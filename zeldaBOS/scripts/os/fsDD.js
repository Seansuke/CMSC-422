/* ----------------------------------
   fsDD.js
   
   File System Device Driver
   ---------------------------------- */
   
/* 	THE APOLOGY
	I apologize in advance for the ridiculous loop that you have to painstakingly look at.
	It is as ugly as Daniel Kreig's Bond career, and I am fully aware of it.
	HOWEVER, it's ugliness is to ensure that the loop acts like a standard loop.
	I will explain how it works here.
	
	for( var i = "001"; parseInt(i , 8) < parseInt("400" , 8) ; i = (parseInt( i , 8) + 1).toString(8)) {
	
	This is fairly obvious.  We start at position TSB 001.
	var i = "001"; 
	
	Here's where the trick comes in.  Having 8 blocks and 8 tracks makes its address look quite a bit like a base 8 number.
	To make it simple, I just take the TSB string and read it as base 8.
	parseInt(i , 8) < parseInt("400" , 8)
	
	Here's the increment.  I take the number as base 8, add 1, then turn it back into a base 8 string, then set the value to the counter.
	i = (parseInt( i , 8) + 1).toString(8)) {
*/

	
function fsDD() {
	// The actual process control array with it's index as the process ID
	this.DISK = null;
	this.status = null;
	
	this.driverEntry = fsddDriverEntry; // Function Callback
	
	this.getStatus = fsddGetStatus; // Function Callback
	this.setStatus = fsddSetStatus; // Function Callback
	this.getTSB = fsddGetTSB; // Function Callback
	this.setTSB = fsddSetTSB; // Function Callback
	this.getData = fsddGetData; // Function Callback
	this.setData = fsddSetData; // Function Callback
	this.setBlock = fsddSetBlock; // Function Callback
	
	this.findEmptyFS = fsddFindEmptyFS; // Function Callback
	this.findEmptyDS = fsddFindEmptyDS; // Function Callback

	this.getFileAddress = fsddGetFileAddress; // Function Callback
	this.listFiles = fsddListFiles; // Function Callback
	
	this.create = fsddCreate; // Function Callback
	this.deleteFile = fsddDeleteFile; // Function Callback
	this.deleteAddress = fsddDeleteAddress; // Function Callback
	this.write = fsddWrite; // Function Callback
	this.read = fsddRead; // Function Callback
	this.format = fsddFormat; // Function Callback

	this.isr = fsddIsr; // Function Callback
	
	this.log = fsddLog; // Function Callback
}

// All the getters and setters for the portions of each string.
function fsddGetStatus(addr) {
	var status = "0";
	try {
		status = this.DISK[addr].substring(0, 1);
	}
	catch(e) {}
	return status;
}
function fsddSetStatus(addr , status) {
	try {
		this.DISK[addr] = status + this.getTSB(addr) + this.getData(addr);
	}
	catch(e) {
		this.DISK[addr] = status + "000" + "                                                                ";
	}
}
function fsddGetTSB(addr) {
	var tsb = "000";
	try {
		tsb = this.DISK[addr].substring(1, 4);
	}
	catch(e) {}
	return tsb;
}
function fsddSetTSB(addr , tsb) {
	try {
		this.DISK[addr] = this.getStatus(addr) + tsb + this.getData(addr);
	}
	catch(e) {
		this.DISK[addr] = "0" + tsb + "                                                                ";
	}
}
function fsddGetData(addr) {
	var data = "";
	try {
		data = this.DISK[addr].substring(4);
	}
	catch(e) {}
	return data;
}
function fsddSetData(addr , data) {
	data += "                                                            ";
	try {
		this.DISK[addr] = this.getStatus(addr) + this.getTSB(addr) + data.substring(0, 60);
	}
	catch(e) {
		this.DISK[addr] = "0" + "000" + data.substring(0, 60);
	}
}
function fsddSetBlock(addr , status, tsb, data) {
	data += "                                                            ";
	this.DISK[addr] = status + tsb + data.substring(0, 60);
	this.log();
}

// Will find the next available file space in storage and return it's TSB.  Returns "000" upon failure
function fsddFindEmptyFS() {
	// Read "apology" above to understand this line
	for( var i = "100"; parseInt(i , 8) < parseInt("400" , 8) ; i = (parseInt( i , 8) + 1).toString(8)) {
		// Ensure the index is of length 3
		i = "000" + i;
		i = i.substring(i.length - 3);
		
		if( this.getStatus(i) == "0" ) {
			return i;
		}
	}
	
	// If we could not find the file, return "000"
	return "000";
}

// Will find the next available directory space in storage and return it's TSB.  Returns "000" upon failure
function fsddFindEmptyDS() {
	// Read "apology" above to understand this line
	for( var i = "001"; parseInt(i , 8) < parseInt("100" , 8) ; i = (parseInt( i , 8) + 1).toString(8)) {
		// Ensure the index is of length 3
		i = "000" + i;
		i = i.substring(i.length - 3);
		
		if( this.getStatus(i) == "0" ) {
			return i;
		}
  	}
	
	// If we could not find the file, return "000"
	return "000";
}

// Will find the DIRECTORY address of a filename.  Returns "000" upon failure.
function fsddGetFileAddress( filename ) {
	// Our data on the DS is going to be 60 characters long.
	// We make the filename have trailing spaces for the convenience for the if statement
	filename += "                                                            ";
	filename = filename.substring(0, 60);
	
	// Read "apology" above to understand this line
	for( var i = "001"; parseInt(i , 8) < parseInt("100" , 8) ; i = (parseInt( i , 8) + 1).toString(8)) {
		// Ensure the index is of length 3
		i = "000" + i;
		i = i.substring(i.length - 3);
		
		// Check to make sure its data we're currently storing.  
		if( this.getStatus(i) == "1" && this.getData(i) == filename ) {
			return i;
		}
	}
	
	// If we could not find the file, return "000"
	return "000";
}

// Request the creation of a file
function fsddCreate( filename ) {
	// Tell the user that they are stupid for not giving us a filename
	if( filename.length == 0) {
		return 3;
	}
	
	// Tell the user we ran out of file space
	var fsAddr = this.findEmptyFS();
	if( fsAddr == "000" ) {
		return 2;
	}
	
	// Tell the user we ran out of directory space
	var dsAddr = this.findEmptyDS();
	if( dsAddr == "000" ) {
		return 2;
	}
	
	// Make sure the filename doesn't already exist
	if( this.getFileAddress( filename ) != "000" ) {
		return 1;
	}
	
	// Everything looks pretty ok, just set the data
	this.setBlock( dsAddr, "1", fsAddr, filename );
	this.setBlock( fsAddr, "1", "000", " " );
	
	this.log();
	// Tell the user that everything went ok.
	return 0;
}

// Remove all files and all children of a certain address
function fsddDeleteAddress(fileAddr) {
	// If our file wasn't there to begin with, kick and scream
	if( fileAddr == "000" ) {
		return 1;
	}
	
	// Keep going until we hit the end
	while( fileAddr != "000" ) {
		// Take the address of the next data chunk's location before we wipe this chunk.
		nextFileAddr = this.getTSB( fileAddr );
		
		// Remove the data contained
		this.setBlock( fileAddr , "0", "000", "" );
		
		// We'll work on the next chunk
		fileAddr = nextFileAddr;
	}
	
	// Success!
	this.log();
	return 0;
}

// Remove a file from DS and remove all it's data in FS
function fsddDeleteFile(filename) {
	return this.deleteAddress( this.getFileAddress( filename ) );
}

// Write a file with certain data to local storage
function fsddWrite(filename, data) {
	
	// Find the address of the directory
	var fileAddr = this.getFileAddress( filename );
	
	// If the file you wish to write to does not exist, throw an exception.
	if( fileAddr == "000" ) {
		return 1;
	}
	
	// Remove all it's children
	this.deleteAddress( this.getTSB( fileAddr ) );
	
	// Get the address of the files themselves
	fileAddr = this.getTSB( fileAddr )
	
	// This loop will continue until we run out of file space or run out of data chunks
	// This is only annoying when our user's data is larger than 60 chars
	while( data.length > 60 && fileAddr != "000" ) {
		// I know what you're thinking: If we're out of space then shouldn't you do a check for something like that?  You'll see....
		this.setBlock( fileAddr, "1", "000" , data.substring( 0, 60 ) );
		
		// We need to assign our current block the address of the next block we'll need to use, so we won't go to this address YET
		var nextFileAddr = this.findEmptyFS();
		
		// Here's that condition you were looking for.  We'll boot out if we run out of file space
		if( nextFileAddr == "000") {
			return 1;
		}
		
		// Take the new address and assign it to the current file
		this.setTSB( fileAddr, nextFileAddr );
		
		// Still more of the string to write, let's remove the previous data.
		data = data.substring( 60 );
		
		// Let's go to the next address
		fileAddr = nextFileAddr;
	}
	
	// If we ran out of space at some point, we would rather skip this part
	if( nextFileAddr != "000" ) {
		// Write the final chunk of data
		this.setBlock( fileAddr, "1", "000" , data );
		
		// SUCCESS!!!  Let's leave happy.
		this.log();
		return 0;
	}
	
	// Tell the user that we failed.  Most likely we ran out of file space
	return 1;
}

// This is rather similar to our delete function... well, without deleting
function fsddRead(filename) {
	// Find the address of the file
	var fileAddr = this.getFileAddress( filename );
	
	// We'll work on the next chunk
	fileAddr = this.getTSB( fileAddr );
		
	// This will be our accumulated data
	var data = "";
	
	// Keep going until we hit the end
	while( fileAddr != "000" ) {
		// Add our data to the chunk.
		data += this.getData( fileAddr );
		
		// We'll work on the next chunk
		fileAddr = this.getTSB( fileAddr );
	}
	
	// Give our data back to the user
	return data;
}

// Perform a full format rather than a quick format.
function fsddFormat() {
	// Read "apology" above to understand this line
	for( var i = "001"; parseInt(i , 8) < parseInt("400" , 8) ; i = (parseInt( i , 8) + 1).toString(8)) {
		// Ensure the index is of length 3
		i = "000" + i;
		i = i.substring(i.length - 3);
		
		this.DISK[i] = "0" + "000" + "                                                                ";
	}
	this.log();
}

// This will return a list of files
function fsddListFiles() {
	var filelist = "File List: \n";
	
	// Read "apology" above to understand this line
	for( var i = "001"; parseInt(i , 8) < parseInt("100" , 8) ; i = (parseInt( i , 8) + 1).toString(8)) {
		// Ensure the index is of length 3
		i = "000" + i;
		i = i.substring(i.length - 3);
		
		if( this.getStatus(i) == "1" ) {
			filelist += this.getData(i) + "\n";
		}
	}
	filelist = filelist.substring(0, filelist.length - 2);
	return filelist;
}

// This will display in the log all UNAVAILABLE data in local storage
function fsddLog() {
	var logNode = document.getElementById( this.logNodeName );
	if ( logNode != null ) {
		var logStr = "FSDD\nLOC|TSB|DATA\n";
		
		// Read "apology" above to understand this line
		for( var i = "001"; parseInt(i , 8) < parseInt("400" , 8) ; i = (parseInt( i , 8) + 1).toString(8)) {
			// Ensure the index is of length 3
			i = "000" + i;
			i = i.substring(i.length - 3);
			
			if( this.getStatus(i) == "1" ) {
				logStr += i + "|" + this.getTSB(i) + "|" + this.getData(i) + "\n";
			}
		}
		
		logStr = logStr.substring(0, logStr.length - 1);
		logNode.value = logStr;
	}
}

function fsddDriverEntry( ) {
	this.DISK = localStorage;
	this.DISK["000"] = "ZELDA-BOS";
	this.status = "loaded";
	this.logNodeName = "fsddLog";
	this.log();
}

function fsddIsr( params ) {
	var outputStr = "";
	switch( params[0] ) {
		case "create":
			// Check our exit code.
			switch ( this.create( params[1] ) ) {
				case 3:
					outputStr = "No file name specified." ;
				break;
				case 2:
					outputStr = "Out of disk space." ;
				break;
				case 1:
					outputStr = "File already exists." ;
				break;
				case 0:
					outputStr = "File created." ;
				break;
			}
		break;
		case "write":
			switch ( this.write( params[1] , params[2] ) ) {
				case 1:
					outputStr = "File does not exists." ;
				break;
				case 0:
					outputStr = "Written to File." ;
				break;
			}
		break;
		case "read":
			outputStr = this.read( params[1] ) ;
		break;
		case "delete":
			// Check our exit code.
			switch ( this.deleteFile( params[1] ) ) {
				case 1:
					outputStr = "File not found." ;
				break;
				case 0:
					outputStr = "File deleted." ;
				break;
			}
		break;
		case "ls":
			outputStr = this.listFiles() ;
		break;
		case "format":
			this.format()
			outputStr = "Disk formatted." ;
		break;
	}
	return outputStr;
}