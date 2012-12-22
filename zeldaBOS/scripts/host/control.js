/* ------------  
   Control.js

   Requires global.js.
   
   Routines for the hardware simulation, NOT for our client OS itself. In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document envorinment inside a browser is the "bare metal" (so to speak) for which we write code that
   hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using JavaScript in 
   both the host and client environments.
   
   This (and other host/simulation scripts) is the only place that we should see "web" code, like 
   DOM manipulation and JavaScript event handling, and so on.  (Index.html is the only place for markup.)
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */


//
// Control Services
//
function simInit()
{
	// Get a global reference to the canvas.  TODO: Move this stuff into a Display Device Driver, maybe?
	CANVAS  = document.getElementById('display');
	// Get a global reference to the drawing context.
	DRAWING_CONTEXT = CANVAS.getContext('2d');
	// Enable the added-in canvas text functions (see canvastext.js for provenance and details).
	CanvasTextFunctions.enable(DRAWING_CONTEXT);
	// Clear the log text box.
	document.getElementById("taLog").value = "";
	// Set focus on the start button.
	document.getElementById("btnStartOS").focus();     // TODO: This does not seem to work.  Why?
	// Initialize all RAM
	for(i = 0; i < TOTAL_MEMORY; i += 1) {
		RAM[i] = "00";
	}
	// Init pages
	PAGE = new Array();
	for( i = 0; i < 4; i += 1 ) {
		PAGE[i] = new Array();
		for( j = 0; j < 256; j += 1 ) {
			PAGE[i][j] = "00";
		}
	}
		
	PCB = new pcb();
}

function simLog(msg, source)
{
    // Check the source.
    if (!source)
    {
        source = "?";
    }

    // Note the OS CLOCK.
    var clock = _OSclock;

    // Note the REAL clock in milliseconds since January 1, 1970.
    var now = new Date().getTime();

    // Build the log string.   
    var str = "({ msg:" + msg + ", source:" + source + ", clock:" + clock + ", now:" + now  + " })"  + "\n";    
    // ALSO WAS: var str = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now  + " })"  + "\n";    
    // WAS: var str = "[" + clock   + "]," + "[" + now    + "]," + "[" + source + "]," +"[" + msg    + "]"  + "\n";

    // Update the log console.
    taLog = document.getElementById("taLog");
    taLog.value = str + taLog.value;
    // Optionally udpate a log database or some streaming service.
}


//
// Control Events
//
function simBtnStartOS_click(btn)
{
    // Disable the start button...
    btn.disabled = true;
    
    // .. enable the Emergency Halt and Reset buttons ...
    document.getElementById("btnHaltOS").disabled = false;
    document.getElementById("btnReset").disabled = false;
    
    // .. set focus on the OS console display ... 
    document.getElementById("display").focus();
    
    // ... Create and initialize the CPU ...
    _CPU = new cpu();
    _CPU.init();
	_CPU.displayMemory();
	
	MM = new memMan();
	VMM = new vmm();
	
	// Moneypenny (see agendum.js for details)
	AGENDUM = new Agendum();

	PCB.size = 0;
	
    // ... then set the clock pulse simulation to call ?????????.
    hardwareClockID = setInterval(simClockPulse, CPU_CLOCK_INTERVAL);
    // .. and call the OS Kernel Bootstrap routine.
    krnBootstrap();
}

function simBtnHaltOS_click(btn)
{
    simLog("emergency halt", "host");
    simLog("Attempting Kernel shutdown.", "host");
    // Call the OS sutdown routine.
    krnShutdown();
    // Stop the JavaScript interval that's simulating our clock pulse.
    clearInterval(hardwareClockID);
    // TODO: Is there anything else we need to do here?
}

function simBtnReset_click(btn)
{
    // The easiest and most thorough way to do this is to reload (not refresh) the document.
	//location.reload(true);  
	
    // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
    // be reloaded from the server. If it is false or not specified, the browser may reload the 
    // page from its cache, which is not what we want.

    krnShutdown();
    clearInterval(hardwareClockID);
	QUANTUM = 6; // of solace  XP
	// Initialize all RAM
	for(i = 0; i < TOTAL_MEMORY; i += 1) {
		RAM[i] = "00";
	}
	PCB = new pcb();

    // Moneypenny (see agendum.js for details)
	AGENDUM = new Agendum();
	
	_CPU = new cpu();
    _CPU.init();
	_CPU.displayMemory();
	
	MM = new memMan();
	VMM = new vmm();
	
    // ... then set the clock pulse simulation to call ?????????.
    hardwareClockID = setInterval(simClockPulse, CPU_CLOCK_INTERVAL);
    // .. and call the OS Kernel Bootstrap routine.
    krnBootstrap();
    document.getElementById("display").focus();
}

function simBtnSingleStep_click(btn)
{
	STEPNOW = true;
}

function simBtnEnableStep_click(btn) {
	if( STEPMODE == true ) {
		btn.value = "ENABLE SINGLE STEP";
	}
	else {
		btn.value = "DISABLE SINGLE STEP";
	}
	STEPMODE = ! STEPMODE;
}