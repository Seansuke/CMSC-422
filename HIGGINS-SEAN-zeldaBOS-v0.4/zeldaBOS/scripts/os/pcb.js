/* ----------------------------------
   pcb.js
   
   The Process Control Block.
   ---------------------------------- */

function pcb() {
	// The actual process control array with it's index as the process ID
	this.pcb = new Array(); 
	
	// The real quantity of living processes.
	this.size = 0;
	
	// Whether we are running everything or one thing
	this.parallel = false; // Simulates mode bit
	this.current = -1;
	
	// Init the array with emptiness
	for( i = 0; i < 5; i += 1 ) {
		this.pcb[i] = new pcbProcess();
	}
	
	this.add = pcbAdd; // Function Callback
	this.swapProcesses = pcbSwapProcesses; // Function Callback
	this.loadProgram = pcbLoadProgram; // Function Callback
	this.runAll = pcbRunAll; // Function Callback
	this.runAllCycle = pcbRunAllCycle; // Function Callback
	this.display = pcbDisplay; // Function Callback
	this.kill = pcbKill; // Function Callback
	this.run = pcbRun; // Function callback
	this.log = pcbLog; // Function callback
	this.clean = pcbClean; // Function Callback;
	
	this.log();
}

// Memory: "OOOO PROGRAM STRING!  OMNOMNOMNOM! (^o^)"
// Me: "Hold up, Pacman! (O_O) "
function pcbAdd( prog, priority ) {

	// Find a free pid
	var pid;
	for( pid = 0; this.pcb[pid].limit != 0 && pid < 4; pid += 1 ) {
		// Cycle through until a free index is found
	}
	
	// Our PCB is limited to 4 processes.  Why?  So I can increase it later on XP
	if( pid == 4 ) {
	
		// Well, we can't have more than 4, tell the world we failed.
		return -1;
	}
	
	// Just dump it into a free page
	var page;
	for( page = 0; PAGE[ page ][ 0 ] != "00" && page < 4; page += 1 ) {
		// Cycle through until a free pid is found
	}	
	
	// Only 4 pages right now.
	if( page == 4 ) {
	
		// Well, we can't have more than 4, tell the world we failed.
		return -2;
	}
	
	// Now we can FINALLY assign the program into the PCB.
	this.pcb[pid] = new pcbProcess();
	this.pcb[pid].limit = 256;
	this.pcb[pid].base = 0;
	this.pcb[pid].PC = 0;
	this.pcb[pid].page = page;
	this.pcb[pid].priority = priority; // Fed as an argument 
	this.pcb[pid].idleTime = 0;
	
	// The PCB is ready, place the program in VMM/fsDD
	this.loadProgram(prog, page, pid);
	
	// Total PCB Size increase
	this.size += 1;
	
	// For debug purposes.
	_CPU.displayMemory(); 
	this.log();
	
	// Hand it back
	return pid;
}

// Load a program into RAM or into FSDD
function pcbLoadProgram(prog, page, pcbId) {

	// Do we place this program in RAM or in fsDD ( 4th page )
	if( page != 3 ) {
	
		// Init the address position
		var address = 0;
	
		// Dump it in until the string is essentially empty
		while( prog.length > 1 ) { 
		
			// Take a bite of a Byte
			var programByte = prog.substring(0,2);
			
			// If the text is a single character...
			if (prog.length == 3) {
			
				// Just make text be an empty string.  This will prevent .length causing an exception
				prog = "";
			}
			else {
				// Truncate the first 2 hex.
				prog = prog.substring(3);
			}
			// Chomp
			PAGE[ page ][ address ] = programByte;
			address += 1;
		}
		
		// Wipe the rest of the memory of this page
		while( address < 256 ) {
			PAGE[ page ][ address ] = "00";
			address += 1;
		}
		
		// Debug
		_CPU.displayMemory();
	}
	// Place it in vmm/fsDD instead
	else {
		VMM.setProgram( pcbId, prog );
	}
}

// Swap processes
function pcbSwapProcesses( id ) {

	// Find the most idle process
	var lowestIdleTime = this.pcb[0].idleTime;
	var idleId = (id + 3) % 4;
	for( var i = 0; i < 3; i += 1 ) {
		if( lowestIdleTime < this.pcb[i].idleTime && i != id) {
			lowestIdleTime = this.pcb[i].idleTime;
			idleId = i;
		}
	}
	
	// Making naming conventions easier for this algorithm
	var activeId = id;
	var idlePage = this.pcb[idleId].page;
	
	// Get the idle program data
	var idleProgram = PAGE[ idlePage ].toString();
	
	// Ask VMM to swap the needed one with this one
	var activeProgram = VMM.swapProgram( activeId, idleId, idleProgram );
	
	// Put the active process in RAM in place of the idle process's page
	this.loadProgram(activeProgram.trim() + " ", idlePage, activeId);
	
	// Change the idle ID's page location to 3
	this.pcb[ idleId ].page = 3;

	// Change the current ID's page location to the idle's original page location
	this.pcb[ activeId ].page = idlePage;
}

// Tell the CPU to execute a particular program
function pcbRun( id ) {

	// Check if the process is on "page 3" ( in other words, the fsDD )
	if( this.pcb[id].page == 3 ) {
		this.swapProcesses( id );
	}
	
	// Prep the CPU with the process's info
	this.current = id;
	_CPU.Zflag = this.pcb[id].Zflag;
	_CPU.PC    = this.pcb[id].PC;
	_CPU.Acc   = this.pcb[id].Acc;
	_CPU.Xreg  = this.pcb[id].Xreg;
	_CPU.Yreg  = this.pcb[id].Yreg;
	_CPU.base  = this.pcb[id].base;
	_CPU.limit = this.pcb[id].limit;
	_CPU.page  = this.pcb[id].page;
	_CPU.isExecuting = true;
	this.log();
}

// The common cycle for running all processes
function pcbRunAllCycle() {

	// Only do a single step of execution.... maybe
	if ( ! STEPMODE || (STEPMODE && STEPNOW) ) {
	
		// Ask Moneypenny if we are reassigned a mission
		var id = AGENDUM.cycle();
		
		// Apparently we are out of missions
		if( id == -1 ) {
		
			// So we won't be running everything right now
			this.parallel = false;
			_CPU.isExecuting = false;
			
			// We're done executing EVERYTHING
			 _KernelInterruptQueue.enqueue( new Interrput( DONEEXECUTINGALL_IRQ, null ) );
			 
			 // We don't need to keep working.  We can retire XP
			this.log();
			return;
		}
		
		// The assigned mission is different from the one we are currently doing
		if( id != this.current ) {
		
			// Remember the current mission's progress
			if( this.current != -1 ) {
				this.pcb[this.current].Zflag = _CPU.Zflag;
				this.pcb[this.current].PC =    _CPU.PC; 
				this.pcb[this.current].Acc =   _CPU.Acc; 
				this.pcb[this.current].Xreg =  _CPU.Xreg; 
				this.pcb[this.current].Yreg =  _CPU.Yreg;
				this.pcb[this.current].page =  _CPU.page;
				this.pcb[this.current].base =  _CPU.base;
				this.pcb[this.current].limit = _CPU.limit;
			}
			
			// Do the mission that we're assigned
			this.run( id );
			
			// Since every other process has not been run, reset this id's idle timer and increment all others
			for( var i = 0; i < 4; i++) {
				if( i == this.current ) {
					this.pcb[this.current].idleTime = 0;
				}
				else {
					this.pcb[this.current].idleTime += 1;
				}
			}
		}
	}
	this.log();
}

// The intro to running all the processes
function pcbRunAll() {
	_CPU.init();
	this.parallel = true;
	for( var i = 0; i < 4; i += 1 ) {
		if( this.pcb[i].limit != 0) {
			this.pcb[i].idleTime = 0;
			AGENDUM.newJob( i, this.pcb[i].priority );
		}
	}
	_CPU.isExecuting = true;
}

// Return all the non-vital information in the PCB to 0s.
function pcbClean() {
	for(var i = 0; i < 4; i += 1) {
		this.pcb[i].Zflag = 0;     // Z-ero flag (Think of it as "isZero".)	
		this.pcb[i].PC    = 0;     // Program Counter
		this.pcb[i].Acc   = 0;     // Accumulator
		this.pcb[i].Xreg  = 0;     // X register
		this.pcb[i].Yreg  = 0;     // Y register
	}
	this.parallel = false; // Simulates mode bit
	this.current = -1;
	this.log();
}

// A single node containing a process's information
function pcbProcess() {
    this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)	
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
	this.base  = 0;     // the base memory location
	this.limit = 0;		// the memory limit
	this.page  = 0;		// the current page the process is dumped in
	this.priority = 0;	// A measure of CPU time gluttony with 0 being most gluttonous
	this.idleTime = 0;  // The amount of calls that have gone by without this one being selected
}

// Return the information for each process as a string that could be output to the console.
function pcbDisplay() {
	var output = "";
	for(i = 0; i < 4; i += 1) {
		if( this.pcb[i].limit != 0 ) {
			output += "PID ADDED: " + i + "})\n";
		}
	}
	return output;
}

// Show all the information to the areatext  Debug purposes only
function pcbLog() {
	var output = "PCB  (! = Priority)(t = Idle Time)\nPID|PAGE|   PC   |AC|XR|YR| Z|!|t \n";
	for(i = 0; i < 4; i += 1) {
		output += 
		""  + ("00"      + i                   ).substring(("00"      + i                   ).length - 3) + 
		"|" + ("000"     + this.pcb[i].page    ).substring(("000"     + this.pcb[i].page    ).length - 4) + 
		"|" + ("0000000" + this.pcb[i].PC      ).substring(("0000000" + this.pcb[i].PC      ).length - 8) + 
		"|" + ("0"       + this.pcb[i].Acc     ).substring(("0"       + this.pcb[i].Acc     ).length - 2) + 
		"|" + ("0"       + this.pcb[i].Xreg    ).substring(("0"       + this.pcb[i].Xreg    ).length - 2) + 
		"|" + ("0"       + this.pcb[i].Yreg    ).substring(("0"       + this.pcb[i].Yreg    ).length - 2) + 
		"|" + ("0"       + this.pcb[i].Zflag   ).substring(("0"       + this.pcb[i].Zflag   ).length - 2) + 
		"|" + ("0"       + this.pcb[i].priority).substring(("0"       + this.pcb[i].priority).length - 1) + 
		"|" + ("0"       + this.pcb[i].idleTime).substring(("0"       + this.pcb[i].idleTime).length - 2) + 
		"\n";
	}
	output = output.substring(0, output.length - 1);
	document.getElementById("pcbLog").value = output;
}

// Remove a program from the PCB
function pcbKill( args ) {

	// A program's limit determines whether it is empty or not
	if( this.pcb[args].limit != 0 ) {
	
		// Return the process in memory (or fsdd) completely to 0s
		if( this.pcb[args].page == 3 ) {
			VMM.deleteProgram(args);
		}
		else {
			for( j = 0; j < 256; j += 1 ) {
				PAGE[ this.pcb[args].page ][ j ] = "00";
			}
		}
		
		// Return the pcb object back to default
		this.pcb[args] = new pcbProcess();
		this.size -= 1;
		
		// Wipe the memory for it
		_CPU.displayMemory();
		this.log();
		return "Process " + args + " Killed";
	}
	else {
		return "Process does not exist";
	}
}