/* ----------------------------------
   DeviceDriverKeyboard.js
   
   Requires deviceDriver.js
   
   The Kernel Keyboard Device Driver.
   ---------------------------------- */

DeviceDriverKeyboard.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.
function DeviceDriverKeyboard()                     // Add or override specific attributes and method pointers.
{
    // "subclass"-specific attributes.
    // this.buffer = "";    // TODO: Do we need this?
    // Override the base method pointers.
    this.driverEntry = krnKbdDriverEntry;
    this.isr = krnKbdDispatchKeyPress;
    // "Constructor" code.
	this.capsLock = false;
}

function krnKbdDriverEntry()
{
    // Initialization routine for this, the kernel-mode Keyboard Device Driver.
    this.status = "loaded";
    // More?
}

function krnKbdDispatchKeyPress(params)
{
    // Parse the params.    TODO: Check that they are valid and osTrapError if not.
    var keyCode = params[0];
    var isShifted = params[1];
    krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
    var chr = "";
    // Check to see if we even want to deal with the key that was pressed.
    if ( ((keyCode >= 65) && (keyCode <= 90)) ||   // A..Z
         ((keyCode >= 97) && (keyCode <= 123)) )   // a..z
    {
        // Determine the character we want to display.  
        // Assume it's lowercase...
        chr = String.fromCharCode(keyCode + 32);
        // ... then check the shift key and re-adjust if necessary.
        if ( (! this.capsLock && isShifted) || (this.capsLock && !isShifted) )
        {
            chr = String.fromCharCode(keyCode);
        }
        // TODO: Check for caps-lock and handle as shifted if so.
        _KernelInputQueue.enqueue(chr);        
    }    
    else if ( ((keyCode >= 48) && (keyCode <= 57)) ||   // digits 
               (keyCode == 32)                     ||   // space
               (keyCode == 13) )                        // enter
    {
		// If a number is pressed while isShifted, send the corresponding symbol isntead
		if ( ( (! this.capsLock && isShifted) || (this.capsLock && !isShifted) ) && (keyCode >= 48) && (keyCode <= 57))
		{
			chr = ( Array ( ")" , "!" , '@' , "#" , "$" , "%" , "^" , "&" , "*" , "(" ) )[ keyCode - 48 ];
		}
		else
		{
			chr = String.fromCharCode(keyCode);
		}
        
        _KernelInputQueue.enqueue(chr); 
    }
	else if ((keyCode >= 186) && (keyCode <= 192))
	{
		// This will take the offset of the special character code and use it as an index in the array of characters sorted by keycode
		// Array( keycode 188 ~ keycode 192)
        if ( (! this.capsLock && isShifted) || (this.capsLock && !isShifted) )
		{
			chr = ( Array ( ":" , "+" , "<" , '_' , ">" , "?" , "~" ) )[ keyCode - 186 ];
		}
		else
		{
			chr = ( Array ( ";" , "=" , "," , '-' , "." , "/" , "`" ) )[ keyCode - 186 ];
		}
		
        _KernelInputQueue.enqueue(chr); 
	}
	else if ((keyCode >= 219) && (keyCode <= 222))
	{
		// This will take the offset of the special character code and use it as an index in the array of characters sorted by keycode
        if ( (! this.capsLock && isShifted) || (this.capsLock && !isShifted) )
		{
			chr = ( Array ( "{" , '|' , "}" , '"' ) )[ keyCode - 219 ];
		}
		else
		{
			chr = ( Array ( "[" , '\\' , "]" , "'" ) )[ keyCode - 219 ];
		}
		
        _KernelInputQueue.enqueue(chr);
	}
	else if (keyCode == 20)
	{
		// Caps Lock
        this.capsLock = ! this.capsLock;
	}
	else if (keyCode == 8)
	{
		// Backspace
		_KernelInputQueue.enqueue(String.fromCharCode(8));
	}
	else if(keyCode == 3) 
	{
		// BREAK
		_KernelInputQueue.enqueue(String.fromCharCode(3));
	}
}
