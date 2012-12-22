/* ------------  
   Globals.js

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation.)
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

//
// Global Constants
//
var APP_NAME = "ZELDA-BOS";  // Naming things after Zelda is cool XP
var APP_VERSION = "0.4";

var CPU_CLOCK_INTERVAL = 100;   // in ms, or milliseconds, so 1000 = 1 second.

var TIMER_IRQ    = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority). 
                       // NOTE: The timer is different from hardware clock pulses. Don't confuse these.
var KEYBOARD_IRQ = 1;  
var CLOCK_IRQ = 2;  // An actual change in the global time
var PROGRAMCALL_IRQ = 3; // Programcall sys interrupt
var DONEEXECUTING_IRQ = 4; // completion of execution interrupt
var PROGRAMLOADED_IRQ = 5; // an interrupt to complete the PCB entry
var DONEEXECUTINGALL_IRQ = 6; // completion of ALL execution interrupt
var HDD_IRQ = 7; // Hard drive i/o interrupt

//
// Global Variables
//
var _CPU = null;

var SCHEDULING = "rr";

var MM = null; // memory manager
var VMM = null; // virtual memory manager

var _OSclock = 0;       // Page 23.

var _Mode = 0;   // 0 = Kernel Mode, 1 = User Mode.  See page 21.

// TODO: Fix the naming convention for these next five global vars.
var CANVAS = null;              // Initialized in hostInit().
var DRAWING_CONTEXT = null;     // Initialized in hostInit().
var DEFAULT_FONT = "sans";      // Ignored, just a place-holder in this version.
var DEFAULT_FONT_SIZE = 10;     
var FONT_HEIGHT_MARGIN = 10;     // Additional space added to font size when advancing a line.

// Default the OS trace to be on.
var _Trace = true;

// OS queues
var _KernelInterruptQueue = null;
var _KernelBuffers = null;
var _KernelInputQueue = null;

// Standard input and output
var _StdIn  = null;
var _StdOut = null;

// UI
var _Console = null;
var _OsShell = null;

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;

// Round robin stuff
var QUANTUM = 6; // of solace  XP

// RAM
var TOTAL_MEMORY = 1024;
var RAM = new Array();

// Pages
var PAGE = new Array();

// PCB
var PCB = null;

// CPU Scheduler
var AGENDUM = null;

// SINGLE STEP VARS
var STEPMODE = false;
var STEPNOW = false;

//
// Global Device Driver Objects - page 12
//
var clockInterruptId = null;
var krnKeyboardDriver = null;
var FSDD = null;
