/* ------------
   Console.js

   Requires globals.js

   The OS Console - stdIn and stdOut by default.
   Note: This is not the Shell.  The Shell is the "command line interface" (CLI) or interpreter for this console.
   ------------ */

function Console()
{
    // Pro perties
    this.CurrentFont      = DEFAULT_FONT;
    this.CurrentFontSize  = DEFAULT_FONT_SIZE;
    this.CurrentXPosition = 0;
    this.CurrentYPosition = DEFAULT_FONT_SIZE * 3 + FONT_HEIGHT_MARGIN;
    this.buffer = "";
	this.userStatus = "Active";
    
    // Methods
    this.init        = consoleInit;
    this.clearScreen = consoleClearScreen;
    this.resetXY     = consoleResetXY;
    this.handleInput = consoleHandleInput;
    this.putText     = consolePutText;
    this.advanceLine = consoleAdvanceLine;
	this.drawTaskbar = consoleDrawTaskbar;
	this.isr         = consoleISR;
	this.GGO         = consoleGGO;
}

function consoleInit()
{
	this.clearScreen();
    consoleResetXY();
	consoleDrawTaskbar();
}

function consoleClearScreen()
{
	DRAWING_CONTEXT.clearRect(0, this.CurrentFontSize + FONT_HEIGHT_MARGIN, CANVAS.width, CANVAS.height);
}

function consoleResetXY()
{
    this.CurrentXPosition = 0;
    this.CurrentYPosition = this.CurrentFontSize * 3 + FONT_HEIGHT_MARGIN;
}

function consoleHandleInput()
{
    while (_KernelInputQueue.getSize() > 0)
    {
        // Get the next character from the kernel input queue.
        var chr = _KernelInputQueue.dequeue();
        // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
        if (chr == String.fromCharCode(13))  //     Enter key   
        {
            // The enter key marks the end of a console command, so ...
            // ... tell the shell ... 
            _OsShell.handleInput(this.buffer);
            // ... and reset our buffer.
            this.buffer = "";
        }
		else if (chr == String.fromCharCode(8)) //  Backspace
		{
			// Can only remove characters if there are any.
			if(this.buffer.length > 0)
			{
				// grab the char we're removing
				var chr = this.buffer.substring(this.buffer.length - 1);
				// find the X offset of the character
				var xOffset = DRAWING_CONTEXT.measureText(this.CurrentFont, this.CurrentFontSize, chr);
				// reset cursor position
				this.CurrentXPosition -= xOffset;
				// remove the char from the screen
				DRAWING_CONTEXT.clearRect(this.CurrentXPosition, this.CurrentYPosition - DEFAULT_FONT_SIZE * 1.5, xOffset, DEFAULT_FONT_SIZE * 3);
				// ... and remove the char from our buffer.
				this.buffer = this.buffer.substring(0, this.buffer.length - 1);
			}
		}
        // TODO: Write a case for Ctrl-C.
        else
        {
            // This is a "normal" character, so ...
            // ... draw it on the screen...
            this.putText(chr);
            // ... and add it to our buffer.
            this.buffer += chr;
        }
    }
}

function consolePutText(txt)    
{
    // My first inclination here was to write two functions: putChar() and putString().
    // Then I remembered that Javascript is (sadly) untyped and it won't differentiate 
    // between the two.  So rather than be like PHP and write two (or more) functions that
    // do the same thing, thereby encouraging confusion and decreasing readability, I 
    // decided to write one function and use the term "text" to connote string or char.
	
	// Cycle through each character in the string and handle it independantly to create word wrap.
    while (txt.length > 0)
    {
		var chr = txt.substring(0,1);
		// If the text is a single character...
		if (txt.length == 1) {
			// Just make text be an empty string.  This will prevent .length causing an exception
			txt = "";
		}
		else {
			// Truncate the first character.
			txt = txt.substring(1);
		}
		// View the offset of the next set of characters
        var offset = DRAWING_CONTEXT.measureText(this.CurrentFont, this.CurrentFontSize, chr);
		// If the offset and the current position will definitely pass through the width of the canvas...
		if (this.CurrentXPosition + offset > DRAWING_CONTEXT.canvas.width || chr == "\n")
		{
			// ...write on the next line instead
			this.advanceLine();
		}
        // Draw the text at the current X and Y coordinates.
        DRAWING_CONTEXT.drawText(this.CurrentFont, this.CurrentFontSize, this.CurrentXPosition, this.CurrentYPosition, chr);
    	// Move the current X position.
        this.CurrentXPosition = this.CurrentXPosition + offset;
    }
}

function consoleAdvanceLine() {
    this.CurrentXPosition = 0;
    // if the cursor position will display offscreen...
    if (this.CurrentYPosition + DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN > DRAWING_CONTEXT.canvas.height - FONT_HEIGHT_MARGIN) {
		// shift everything to the left:
		var imageData = DRAWING_CONTEXT.getImageData(0, (DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN), DRAWING_CONTEXT.canvas.width, DRAWING_CONTEXT.canvas.height - (DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN));
		DRAWING_CONTEXT.putImageData(imageData, 0, 0);
		// now clear the bottom-most pixels:
		DRAWING_CONTEXT.clearRect(0, DRAWING_CONTEXT.canvas.height - (DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN), DRAWING_CONTEXT.canvas.width, (DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN));
		this.drawTaskbar();
	}
	else {
		this.CurrentYPosition += DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN;
	}
}

function consoleDrawTaskbar()
{
	// Clear everything
	DRAWING_CONTEXT.clearRect(0, 0, CANVAS.width, DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN);
	// Draw the background
	DRAWING_CONTEXT.fillStyle = "#4488FF";
	DRAWING_CONTEXT.fillRect(0, 0, DRAWING_CONTEXT.canvas.width, DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN);
	// Draw the date
	var datetime = new Date();
	var dateString = (datetime.getMonth() + 1) + "/" + datetime.getDate() + "  ";
	var minutes = "00" + datetime.getMinutes();
	minutes = minutes.substring(minutes.length - 2);
	var seconds = "00" + datetime.getSeconds();
	seconds = seconds.substring(seconds.length - 2);
	if( datetime.getHours() > 12 )
	{
		dateString += (datetime.getHours() - 12) + ":" + minutes + ":" + seconds + " PM";
	}
	else
	{
		dateString += datetime.getHours() + ":" + minutes + ":" + seconds + " AM";
	}
	DRAWING_CONTEXT.drawText(this.CurrentFont, DEFAULT_FONT_SIZE, 0, DEFAULT_FONT_SIZE, dateString );
	// Draw the status
	var statusString = this.userStatus;
	DRAWING_CONTEXT.drawText(this.CurrentFont, DEFAULT_FONT_SIZE, DRAWING_CONTEXT.canvas.width / 2, DEFAULT_FONT_SIZE, "Status: " + statusString);
}

// The "Blue Screen of Death" "BSOD"
function consoleGGO(msg)
{
	DRAWING_CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
	DRAWING_CONTEXT.fillStyle = "#00FF00";
	DRAWING_CONTEXT.fillRect(0, 0, DRAWING_CONTEXT.canvas.width, DRAWING_CONTEXT.canvas.height);
	DRAWING_CONTEXT.drawText(this.CurrentFont, DEFAULT_FONT_SIZE, 0, DEFAULT_FONT_SIZE, "GANON'S GAME OVER" );
	DRAWING_CONTEXT.drawText(this.CurrentFont, DEFAULT_FONT_SIZE, 0, DEFAULT_FONT_SIZE * 3, msg );
}

// A standard interrupt service routine.  This one particularly just changes the current clock 
function consoleISR() 
{
	// The overall time has changed, redraw the taskbar.
	this.drawTaskbar();

}