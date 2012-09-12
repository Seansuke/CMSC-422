/* ----------------------------------
   pcb.js
   
   The Process Control Block.
   ---------------------------------- */

function pcb()
{
	// The actual process control array with it's index as the process ID
    this.pcb = new Array(); 
	
	// Init the array with emptiness
	for(i = 0; i < 256; i+= 1)
	{
		pcb[i] = new process();
	}
	
	this.add = pcbAdd(); // Function Callback
}

function pcbAdd() 
{
	var i = 0;
	for(i = 0; this.pcb[i].Zflag != 0 && i < 256; i += 1)
	{
		// Cycle to find the next item that fulfills the conditions.
	}
	return i;
}

// 
function process()
{
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)
}