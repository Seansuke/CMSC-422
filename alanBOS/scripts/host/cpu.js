/* ------------  
   CPU.js

   Requires global.js.
   
   Routines for the host CPU simulation, NOT for the OS itself.  
   In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document envorinment inside a browser is the "bare metal" (so to speak) for which we write code
   that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
   JavaScript in both the host and client environments.

   This code references page numbers in the text book: 
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

function cpu() {
	this.base  = 0;
	this.limit = 0;
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.page  = 0;     // Y register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)
    this.isExecuting = false;
	
    this.processLoop = CPUprocessLoop; // CALLBACK FUNCTION
    this.displayMemory = CPUdisplayMemory; // CALLBACK FUNCTION
	
    this.init = function() {
		this.base  = 0;
 		this.limit = 0;
		this.page  = 0;
        this.PC    = 0;
        this.Acc   = 0;
        this.Xreg  = 0;
        this.Yreg  = 0;
        this.Zflag = 0;
        this.isExecuting = false;
    }
    
    this.pulse = function() {
        // TODO: Do we need this?  Probably not.
    }
    
    this.cycle = function() {
		// Let's do a single cycle of work
		if ( ! STEPMODE || (STEPMODE && STEPNOW)) {
			krnTrace("CPU cycle");			
			this.processLoop();
			this.displayMemory();
			
			// A step has completed, let's say the step has ended if we're in step mode.
			if( STEPMODE ) { 
				STEPNOW = false; 
			}
		}
	}
}

// Memory display created for debugging purposes.
function CPUdisplayMemory() {
	var str = "RAM\nADDR|        PAGE 0         |ADDR|         PAGE 1        |ADDR|         PAGE 2        |ADDR|         PAGE 3        |ADDR";
	// For each line
	for(line = 0; line < 32; line += 1) {
		var currentAddr = ("000" + (line * 8).toString(16)).substring(("000" + (line * 8).toString(16)).length - 4) + "|";
		str += "\n" + currentAddr;
		// For each page
		for(page = 0; page < 4; page += 1) {
			// For each Bytes
			for(byt = 0; byt < 8; byt += 1) {
				var addr = line * 8 + byt;
				// Display 1 Byte
				str += PAGE[page][addr] + " ";
			}
			// Truncate last space
			str = str.substring(0, str.length - 1);
			// Put on a bar instead to separate the pages
			str += "|";
			// Show the address again!
			str += currentAddr;
		}
		str = str.substring( 0 , str.length - 1 );
	}
	(document.getElementById('ramContents')).value = str;
	
	// I lied, we're displaying the program log too.  (XP)
	var pc  = (this.PC   ).toString(16);
	var acc = this.Acc;
	var x   = this.Xreg;
	var y   = this.Yreg;
	var z   = (this.Zflag).toString(16);
	(document.getElementById('progLog')).value = 
		"REGISTERS\n   PC   |AC|XR|YR| Z\n" + 
		("0000000" + pc).substring(("0000000" + pc).length - 8) + 
		"|" + ("0" + acc).substring(("0" + acc).length - 2) + 
		"|" + ("0" + x  ).substring(("0" + x  ).length - 2) + 
		"|" + ("0" + y  ).substring(("0" + y  ).length - 2) + 
		"|" + ("0" + z  ).substring(("0" + z  ).length - 2);
}

// Peppy: "Do a loop!"
// Fox: "At least he didn't say barrel roll.., (-_-;;) "
function CPUprocessLoop() {
	// Rather than constantly attempting to translate the program counter, let's do it once and have it available.
	var pc0 = (this.PC).toString(16);
	var pc1 = (this.PC + 1).toString(16);
	var pc2 = (this.PC + 2).toString(16);
	
	// Get the opcode of the current pc location from MM (memory manager)
	switch( MM.getByte(pc0) ) {
		case '00':
			// Make explosions occur
			this.isExecuting = false;
			_KernelInterruptQueue.enqueue( new Interrput(DONEEXECUTING_IRQ, null) );
		break;
		case '6D':
			// Add to Acc from Mem [OP][ADDR][]
			var address = MM.getByte(pc1);
			this.Acc = MM.addByte( address, this.Acc);
			this.PC += 3;
		break;
		case '8D':
			// Store accum into memory [OP][ADDR][]
			var address = MM.getByte(pc1);
			MM.setByte(address , this.Acc);
			this.PC += 3;
		break;
		case 'A0':
			// Load Y Reg with Constant [OP][VALUE]
			this.Yreg = MM.getByte(pc1);
			this.PC += 2;
		break;
		case 'A2':
			// Load X Reg with Constant [OP][VALUE]
			this.Xreg = MM.getByte(pc1);
			this.PC += 2;
		break;
		case 'A9':
			// Load Acc with Constant; [OP][VALUE]
			this.Acc = MM.getByte(pc1);
			this.PC += 2;
		break;
		case 'AC':
			// Load Y Reg from Mem [OP][ADDR][]
			var address = MM.getByte(pc1);
			this.Yreg = MM.getByte( address );
			this.PC += 3;
		break;
		case 'AD':
			// Load Acc from Mem [OP][ADDR][]
			var address = MM.getByte(pc1);
			this.Acc = MM.getByte( address );
			this.PC += 3;
		break;
		case 'AE':
			// Load X Reg from Mem [OP][ADDR][]
			var address = MM.getByte(pc1);
			this.Xreg = MM.getByte( address );
			this.PC += 3;
		break;
		case 'D0':
			// branch +value bytes if z flag = 0 [OP][VALUE]
			if( this.Zflag == 0 ) {
				var value = parseInt( MM.getByte( pc1 ) , 16 );
				if( value > 128 ) {
					value = -(256 - value);
				}
				// OUT OF BOUNDS!  Make explosions
				if( this.PC + value < this.base || this.PC + value > this.base + this.limit ) {
					_KernelInterruptQueue.enqueue(new Interrput(-2, null));
					this.isExecuting = false;
				}
				else {
					this.PC += value;
				}
			}
			this.PC += 2;
		break;
		case 'EC':
			// Compare a byte in memory to X reg. Store equality in Z. [OP][ADDR][]
			var address = MM.getByte( pc1 );
			var value = MM.getByte( address )
			if( parseInt( this.Xreg , 16 ) == parseInt( value , 16 ) ) {
				this.Zflag = 1;
			}
			else {
				this.Zflag = 0;
			}
			this.PC += 3;
		break;
		case 'EE':
			// Increment value of byte [OP][ADDR][]
			var addr = MM.getByte( pc1 );
			var value = MM.addByte( addr ,"01");
			MM.setByte( addr, value );
			this.PC += 3;
		break;
		case 'FF':
			// Sys call
			_KernelInterruptQueue.enqueue( new Interrput(PROGRAMCALL_IRQ, null) );
			this.PC += 1;
		break;
		default:
			// EXPLOOOOOOOOOOOOOOSION!!!
			_KernelInterruptQueue.enqueue(new Interrput(-1, null));
			_CPU.isExecuting = false;
		break;
	}
}