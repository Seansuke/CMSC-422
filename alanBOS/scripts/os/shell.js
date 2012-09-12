/* ------------
   Shell.js
   
   The OS Shell - The "command line interface" (CLI) or interpreter for the console.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

function Shell()
{
    // Properties
    this.promptStr   = ">";
    this.commandList = [];
    this.curses      = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
    this.apologies   = "[sorry]";
    // Methods
    this.init        = shellInit;
    this.putPrompt   = shellPutPrompt;
    this.handleInput = shellHandleInput;
    this.execute     = shellExecute;
}

function shellInit()
{
    var sc = null;
    //
    // Load the command list.

    // date
    sc = new ShellCommand();
    sc.command = "date";
    sc.description = "- Displays the current date and time."
    sc.function = shellDate;
    this.commandList[this.commandList.length] = sc;
	
    // whereami
    sc = new ShellCommand();
    sc.command = "whereami";
    sc.description = "- Displays the user's current location."
    sc.function = shellWhereami;
    this.commandList[this.commandList.length] = sc;
	
    // sessiontime
    sc = new ShellCommand();
    sc.command = "sessiontime";
    sc.description = "- Displays the user's active time in this session."
    sc.function = shellSessiontime;
    this.commandList[this.commandList.length] = sc;
	
    // status
    sc = new ShellCommand();
    sc.command = "status";
    sc.description = "- Set the user's current status/"
    sc.function = shellStatus;
    this.commandList[this.commandList.length] = sc;
	
    // ver
    sc = new ShellCommand();
    sc.command = "ver";
    sc.description = "- Displays the current version data."
    sc.function = shellVer;
    this.commandList[this.commandList.length] = sc;
    
    // load
    sc = new ShellCommand();
    sc.command = "load";
    sc.description = " - Loads a program from the local device.";
    sc.function = shellLoad;
    this.commandList[this.commandList.length] = sc;
	
    // help
    sc = new ShellCommand();
    sc.command = "help";
    sc.description = "- This is the help command. Seek help."
    sc.function = shellHelp;
    this.commandList[this.commandList.length] = sc;
    
    // shutdown
    sc = new ShellCommand();
    sc.command = "shutdown";
    sc.description = "- Shuts down the virtual OS but leaves the underlying hardware simulation running."
    sc.function = shellShutdown;
    this.commandList[this.commandList.length] = sc;

    // cls
    sc = new ShellCommand();
    sc.command = "cls";
    sc.description = "- Clears the screen and resets the cursosr position."
    sc.function = shellCls;
    this.commandList[this.commandList.length] = sc;

    // man <topic>
    sc = new ShellCommand();
    sc.command = "man";
    sc.description = "<topic> - Displays the MANual page for <topic>.";
    sc.function = shellMan;
    this.commandList[this.commandList.length] = sc;
    
    // trace <on | off>
    sc = new ShellCommand();
    sc.command = "trace";
    sc.description = "<on | off> - Turns the OS trace on or off.";
    sc.function = shellTrace;
    this.commandList[this.commandList.length] = sc;

    // rot13 <string>
    sc = new ShellCommand();
    sc.command = "rot13";
    sc.description = "<string> - Does rot13 obfuscation on <string>.";
    sc.function = shellRot13;
    this.commandList[this.commandList.length] = sc;

    // prompt <string>
    sc = new ShellCommand();
    sc.command = "prompt";
    sc.description = "<string> - Sets the prompt.";
    sc.function = shellPrompt;
    this.commandList[this.commandList.length] = sc;
	
    // processes - list the running processes and their IDs
    // kill <id> - kills the specified process id.

    //
    // Display the initial prompt.
    this.putPrompt();
}

function shellPutPrompt()
{
    _StdIn.putText(this.promptStr);
}

function shellHandleInput(buffer)
{
    krnTrace("Shell Command~" + buffer);
    // 
    // Parse the input...
    //
    var userCommand = new UserCommand();
    userCommand = shellParseInput(buffer);
    // ... and assign the command and args to local variables.
    var cmd = userCommand.command;
    var args = userCommand.args;
    //
    // Determine the command and execute it.
    //
    // Javascript may not support associative arrays (one of the few nice features of PHP, actually)
    // so we have to iterate over the command list in attempt to find a match.  TODO: Is there a better way?
    var index = 0;
    var found = false;
    while (!found && index < this.commandList.length)
    {
        if (this.commandList[index].command === cmd)
        {
            found = true;
            fn = this.commandList[index].function;
        }
        else
        {
            ++index;
        }
    }
    if (found)
    {
        this.execute(fn, args);
    }
    else
    {
        // It's not found, so check for curses and apologies before declaring the command invalid.
        if (this.curses.indexOf("[" + rot13(cmd) + "]") >= 0)      // Check for curses.
        {
            this.execute(shellCurse);
        }
        else if (this.apologies.indexOf("[" + cmd + "]") >= 0)      // Check for apoligies.
        {
            this.execute(shellApology);
        }
        else    // It's just a bad command.
        {
            this.execute(shellInvalidCommand);
        }
    }
}


function shellParseInput(buffer)
{
    var retVal = new UserCommand();
    //
    // 1. Remove leading and trailing spaces.
    buffer = trim(buffer);
    // 2. Lower-case it.
    buffer = buffer.toLowerCase();
    // 3. Separate on spaces so we can determine the command and command-line args, if any.
    var tempList = buffer.split(" ");
    // 4. Take the first (zeroth) element and use that as the command.
    var cmd = tempList.shift();  // Yes, you can do that to an array in Javascript.  See the Queue class.
    // 4.1 Remove any left-over spaces.
    cmd = trim(cmd);
    // 4.2 Record it in the return value.
    retVal.command = cmd;
    //
    // 5. Now create the args array from what's left.
    for (var i in tempList)
    {
        var arg = trim(tempList[i]);
        if (arg != "")
        {
            retVal.args[retVal.args.length] = tempList[i];
        }
    }
    return retVal;
}


function shellExecute(fn, args)
{
    // we just got a command, so advance the line... 
    _StdIn.advanceLine();
    // .. call the command function passing in the args...
    fn(args);
    // Check to see if we need to advance the line again
    if (_StdIn.CurrentXPosition > 0)
    {
        _StdIn.advanceLine();
    }
    // ... and finally write the prompt again.
    this.putPrompt();
}


//
// The rest of these functions ARE NOT part of the Shell "class" (prototype, more accurately), 
// as they are not denoted in the constructor.  The idea is that you cannot execute them from
// elsewhere as shell.xxx .  In a better world, and a more perfect Javascript, we'd be 
// able to make then private.  (Actually, we can. Someone look at Crockford's stuff and give me the details, please.)
//

//
// An "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function ShellCommand()     
{
    // Properties
    this.command = "";
    this.description = "";
    this.function = "";
}

//
// Another "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function UserCommand()
{
    // Properties
    this.command = "";
    this.args = [];
}

//
// Shell Command Functions.  Again, not part of Shell() class per se', just called from there.
//
function shellInvalidCommand()
{
    _StdIn.putText("Invalid Command. ");
    if (_SarcasticMode)
    {
        _StdIn.putText("Duh. Go back to your Speak & Spell.");
    }
    else
    {
        _StdIn.putText("Type 'help' for, well... help.");
    }
}

function shellCurse()
{
    _StdIn.putText("Oh, so that's how it's going to be, eh? Fine.");
    _StdIn.advanceLine();
    _StdIn.putText("Bitch.");
    _SarcasticMode = true;
}

function shellApology()
{
    _StdIn.putText("Okay. I forgive you. This time.");
    _SarcasticMode = false;
}

function shellVer(args)
{
    _StdIn.putText("HI!");
	_StdIn.advanceLine();
	_StdIn.putText("WELCOME TO " + APP_NAME + " VERSION " + APP_VERSION + "!!!!!");    
}

//
// -is a callback function.  This will display on the console the current data and time.
//
function shellDate(args)
{
	var datetime = new Date();
	_StdIn.putText("The current date and time is:");
	_StdIn.advanceLine();
	_StdIn.putText(datetime.toString());
}

//
// -is a callback function.  This will lie to you explicity and say you are in a random location.
//
function shellWhereami(args)
{
	var randomPlace = ( Array( 'the Aperture Science Laboratory','Boondocks','Conneticut','Delaware',"the Earth's atmosphere",'Freemont','Goldeneye','Hyrule','India','Japan','Kentucky','"Live and Let Die"','the Mushroom Kingdom','Nationwide','Oklahoma','Peru','Qinhuangdao','Rouen','Switzerland','Turkey','the United States of America','Volgograd','Warsaw','Xuzhou Suchow','Yugoslavia','Zimbabwe' ) )[ Math.floor(Math.random() * 26) ];
	_StdIn.putText("You are in " + randomPlace);
}

//
// -is a callback function.  Display on the console: the current time this session has been active.
//
function shellSessiontime(args)
{
	// I add far too many parens for the sake of user readability. ( ( OneSecond / TotalTimeInOneInterval) * AmountOfCycles ) / ConvertFromMillisecondsToMinutes
	var sessionTime = ( (1000 / CPU_CLOCK_INTERVAL) * _OSclock ) / 6000;
	// Session has been too short for a user to be begging for the active session time
	if (sessionTime < 1) 
	{
		_StdIn.putText("ARE YOU SERIOUS!?");
		_StdIn.advanceLine();
		_StdIn.putText("YOU HAVE BEEN ON FOR LESS THAN AN ENTIRE MINUTE");
		_StdIn.advanceLine();
		_StdIn.putText("AND YOU WANT THE SESSION TIME ALREADY?!");
		_StdIn.advanceLine();
		shellCurse();
	}
	else
	{
		_StdIn.putText("This session has been active for: " + Math.floor(sessionTime) + " minute");
		if(sessionTime >= 2)
		{
			// Let's change "minute" to "minutes" if more than one minute has passed by tacking on an "s"
			_StdIn.putText("s");
		}
	}
}

//
// -is a callback function.  Will allow the user to specify the status.
//
function shellStatus(args)
{
	_Console.userStatus = args[0];
	_StdIn.putText("Status has been set.");
	_Console.isr(); // Force the console to redo a cycle to draw the taskbar once more.
}

//
// -is a callback function.  Will allow the user to specify the status.
//
function shellLoad(args)
{
	_StdIn.putText("Loading Program...");
	_StdIn.advanceLine();
	
	//TODO Clean this method up entirely
	var prog = ( document.getElementById( "progInput" ) ).value + " "; // expecting ff_ff_ff but for parsing perpurposes, we make it: ff_ff_ff_
	
	_StdIn.advanceLine();
	_StdIn.putText("PROG: " + prog);
	_StdIn.advanceLine();
	
	var valid = " ";
	
	var str = new Array();
	
	// Ensure the string's length is a multiple of 3.
	if(prog.length % 3 == 0)
	{
		// Cycle each set of 3 characters in the entire string
		for( i = 0; i < prog.length - 3; i += 3 )
		{
			str[0] = prog.charAt( i );
			str[1] = prog.charAt( i + 1 );
			
			// Make sure both chars are hex characters
			for( j = 0; j < 2; j += 1 )
			{
				if( ( new Array("0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F") ).indexOf( str[j] ) == -1 )
				{
					valid += " theres a " + prog.charAt(i + j) + " at " + (i + j) + ".";
				}
			}
			
			if( prog.charAt(i + 2) != " " )
			{
				valid += " theres a " + prog.charAt(i + 2) + " at " + (i + 2) + ".";
			}			
		}
	}
	else
	{
		valid += " length is " + prog.length + ".";
	}
	
	if(valid == " ")
	{
		loadMem(prog);
	}
	else
	{
		_StdIn.putText("Validation Errors: " + valid);
		_StdIn.advanceLine();
	}
}

function shellHelp(args)
{
    _StdIn.putText("Commands:");
    for (i in _OsShell.commandList)
    {
        _StdIn.advanceLine();
        _StdIn.putText("  " + _OsShell.commandList[i].command + " ");
		_StdIn.putText(_OsShell.commandList[i].description);
    }    
}

function shellShutdown(args)
{
     _StdIn.putText("Shutting down...");
     // Call Kernal shutdown routine.
    krnShutdown();   
    // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
}

function shellCls(args)
{
    _StdIn.clearScreen();
    _StdIn.resetXY();
}

function shellMan(args)
{
    if (args.length > 0)
    {
        var topic = args[0];
        switch (topic)
        {
            case "help": 
                _StdIn.putText("Help displays a list of (hopefully) valid commands.");
                break;
            case "date": 
                _StdIn.putText("Date displays the current date and time.");
                break;
            case "sessiontime": 
                _StdIn.putText("Sessiontime displays how long a session has been active.");
                break;
            default:
                _StdIn.putText("No manual entry for " + args[0] + ".");
        }        
    }
    else
    {
        _StdIn.putText("Usage: man <topic>  Please supply a topic.");
    }
}

function shellTrace(args)
{
    if (args.length > 0)
    {
        var setting = args[0];
        switch (setting)
        {
            case "on": 
                if (_Trace && _SarcasticMode)
                {
                    _StdIn.putText("Trace is already on, dumbass.");
                }
                else
                {
                    _Trace = true;
                    _StdIn.putText("Trace ON");
                }
                
                break;
            case "off": 
                _Trace = false;
                _StdIn.putText("Trace OFF");                
                break;                
            default:
                _StdIn.putText("Invalid arguement.  Usage: trace <on | off>.");
        }        
    }
    else
    {
        _StdIn.putText("Usage: trace <on | off>");
    }
}

function shellRot13(args)
{
    if (args.length > 0)
    {
        _StdIn.putText(args[0] + " = '" + rot13(args[0]) +"'");     // Requires Utils.js for rot13() function.
    }
    else
    {
        _StdIn.putText("Usage: rot13 <string>  Please supply a string.");
    }
}

function shellPrompt(args)
{
    if (args.length > 0)
    {
        _OsShell.promptStr = args[0];
    }
    else
    {
        _StdIn.putText("Usage: prompt <string>  Please supply a string.");
    }
}
