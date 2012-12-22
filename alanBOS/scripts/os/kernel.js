/* ------------
   Kernel.js
   
   Requires globals.js
   
   Routines for the Operataing System, NOT the host.
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5   
   ------------ */


//
// OS Startup and Shutdown Routines   
//
function krnBootstrap()      // Page 8.
{
    simLog("bootstrap", "host");  // Use simLog because we ALWAYS want this, even if _Trace is off.

    // Initialize our global queues.
    _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
    _KernelBuffers = new Array();         // Buffers... for the kernel.
    _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.
    _Console = new Console();             // The console output device.

    // Initialize the Console.
    _Console.init();

    // Initialize standard input and output to the _Console.
    _StdIn  = _Console;
    _StdOut = _Console;

    // Load the Keyboard Device Driver
    krnTrace("Loading the keyboard device driver.");
    krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
    krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
    krnTrace(krnKeyboardDriver.status);
	
    // Load the HDD Device Driver
    krnTrace("Loading the HDD device driver.");
	FSDD = new fsDD();
    FSDD.driverEntry();                    // Call the driverEntry() initialization routine.
    krnTrace(FSDD.status);

    // 
    // ... more?
    //

    // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
    krnTrace("Enabling the interrupts.");
    krnEnableInterrupts();
    // Launch the shell.
    krnTrace("Creating and Launching the shell.")
    _OsShell = new Shell();
    _OsShell.init();
}

function krnShutdown()
{
    krnTrace("begin shutdown OS");
    // TODO: Check for running processes.  Alert if there are some, alert and stop.  Else...    
    // ... Disable the Interruupts.
    krnTrace("Disabling the interrupts.");
    krnDisableInterrupts();
    // 
    // Unload the Device Drivers?
    // More?
    //
    krnTrace("end shutdown OS");
}


function krnOnCPUClockPulse() 
{
    /* This gets called from the host hardware every time there is a hardware clock pulse. 
       This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
       This, on the other hand, is the clock pulse from the hardware (or host) that tells the kernel 
       that it has to look for interrupts and process them if it finds any.                           */

    // Check for an interrupt, are any. Page 560
    if (_KernelInterruptQueue.getSize() > 0)    
    {
        // Process the first interrupt on the interrupt queue.
        // TODO: Implement a priority queye based on the IRQ number/id to enforce interrupt priority.
        var interrput = _KernelInterruptQueue.dequeue();
        krnInterruptHandler(interrput.irq, interrput.params);
    }
    else if (_CPU.isExecuting) // If there are no interrupts then run a CPU cycle if there is anything being processed.
    {
		if( PCB.parallel == true ) {
			PCB.runAllCycle();
		}
        _CPU.cycle();
    }    
    else                       // If there are no interrupts and there is nothing being executed then just be idle.
    {
       krnTrace("Idle");
    }
	
}


// 
// Interrupt Handling
// 
function krnEnableInterrupts()
{
    // Keyboard
    simEnableKeyboardInterrupt();
	// Clock Tick
	clockInterruptId = simEnableClockInterrupt();
    // Put more here.
}

function krnDisableInterrupts()
{
    // Keyboard
    simDisableKeyboardInterrupt();
	// Clock Tick
	simDisableClockInterrupt();
    // Put more here.
}

function krnInterruptHandler(irq, params)    // This is the Interrupt Handler Routine.  Page 8.
{
    // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on.  Page 766.
    krnTrace("Handling IRQ~" + irq);

    // Save CPU state. (I think we do this elsewhere.)

    // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
    // TODO: Use Interrupt Vector in the future.
    // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.  
    //       Maybe the hardware simulation will grow to support/require that in the future.
    switch (irq)
    {
        case TIMER_IRQ: 
            krnTimerISR();                   // Kernel built-in routine for timers (not the clock).
        break;
        case KEYBOARD_IRQ: 
            krnKeyboardDriver.isr(params);   // Kernel mode device driver
			if( _CPU.isExecuting == false) {
				_StdIn.handleInput();
			}
        break;
		case CLOCK_IRQ:
			_Console.isr(params);			// Console clock change call
		break;
		case PROGRAMCALL_IRQ:
			if( parseInt( _CPU.Xreg , 16) == 1 ) {
				_StdIn.putText( ( parseInt( _CPU.Yreg , 16 ) ).toString() );
			}
			else {
				// Get the RAM address from the Y Register
				var address = parseInt( _CPU.Yreg , 16 );
				// Until there is a null string...
				while( PAGE[ _CPU.page ][ address] != "00" ) { 
					// Take the value of the Byte in address and translate it as a character code
					var value = String.fromCharCode( parseInt( PAGE[ _CPU.page ][ address ], 16) );
					// Print the value
					_StdIn.putText( value );
					address += 1;
				}
			}
		break;
		case DONEEXECUTING_IRQ:
			// Notify the ready queue that it is done with the current job
			if( PCB.parallel == false ) {
				_KernelInterruptQueue.enqueue(new Interrput(DONEEXECUTINGALL_IRQ, null));
			}
			else {
				AGENDUM.jobDone();
				_CPU.isExecuting = true;
			}
		break;
		case PROGRAMLOADED_IRQ:
			
		break;
		case DONEEXECUTINGALL_IRQ:
			AGENDUM.empty();
			PCB.clean();
			_CPU.init();
			_CPU.displayMemory();
			_StdIn.advanceLine();
			_OsShell.showPrompt = true;
			_OsShell.putPrompt();
		break;
		case HDD_IRQ:
			_StdIn.putText( FSDD.isr( params ) );
			_StdIn.advanceLine();
			_OsShell.putPrompt();
		break;
        default: 
            krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
		break;
    }

    // 3. Restore the saved state.  TODO: Question: Should we restore the state via IRET in the ISR instead of here? p560.
}

function krnTimerISR()  // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver).
{
    // Check multiprogramming parameters and enfore quanta here. Call the scheduler / context switch here if necessary.
}   



//
// System Calls... that generate software interrupts via tha Application Programming Interface library routines.
//
// Some ideas:
// - ReadConsole
// - WriteConsole
// - CreateProcess
// - ExitProcess
// - WaitForProcessToExit
// - CreateFile
// - OpenFile
// - ReadFile
// - WriteFile
// - CloseFile


//
// OS Utility Routines
//
function krnTrace(msg)
{
   // Check globals to see if trace is set ON.  If so, then (maybe) log the message. 
   if (_Trace)
   {
      if (msg === "Idle")
      {
         // We can't log every idle clock pulse because it would lag the browser very quickly.
         if (_OSclock % 1000 == 0)  // Check the CPU_CLOCK_INTERVAL in globals.js for an 
         {                        // idea of the tick rate and adjust this line accordingly.
            simLog(msg, "OS");          
         }         
      }
      else
      {
       simLog(msg, "OS");
      }
   }
}
   
function krnTrapError(msg)
{
    simLog("OS ERROR - TRAP: " + msg);
	_Console.GGO(msg); // Call the Ganon's Game Over
    krnShutdown();
}
