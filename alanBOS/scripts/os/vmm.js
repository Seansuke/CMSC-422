/* ----------------------------------
   vmm.js
   
   Virtual Memory Manager
   ---------------------------------- */
   
// Main constructor
function vmm() {

	// Stores all the pages (each page is information for a program in virtual memory
	this.book = new Array();
	
	// Methods
	this.addPage = vmmAddPage; // Function Callback
	this.getProgram = vmmGetProgram; // Function Callback
	this.setProgram = vmmSetProgram; // Function Callback
	this.deleteProgram = vmmDeleteProgram; // Function Callback
	this.swapProgram = vmmSwapProgram; // Function Callback
}

// A single page of a virtual program
function vmmPage() {

	// The filename on the fsDD containing the program's data
	this.filename = "";

	// The process control block's ID associated with this program
	this.pcbId = -1;
}

// Add a single page of a virtual program
function vmmAddPage(pcbId, filename) {
	var page = new vmmPage();
	page.filename = filename;
	page.pcbId = pcbId;
	this.book.push( page );
}

// Returns a whole program based on the pcbId
function vmmGetProgram( pcbId ) {

	// Cycle through each page in the book
	for( var i = 0; i < this.book.length; i += 1 ) {
	
		// Found the program matching the id
		if( pcbId == this.book[i].pcbId ) {
			
			// Hand back the program data
			return FSDD.isr( ["read" , this.book[i].filename] );
		}
	}
	
	// Could not find a program matching the id
	return null;
}

// Puts a program on the fsDD
function vmmSetProgram( pcbId, program ) {

	// Let's create a unique filename in the tmp "directory"
	var filename = "tmp\\program" + pcbId + ".exe";
	
	// create the program in a temp file
	FSDD.isr( ["create" , filename] );
	
	// write the program in a temp file
	FSDD.isr( ["write" ,  filename, program] );
	
	// Add it to the list of pages
	this.addPage( pcbId, filename );
}

// Removes a program from the fsDD
function vmmDeleteProgram( pcbId ) {

	// Keeping the scope of the index within the whole function
	var index = 0; 
	
	// Cycle until we hit the id or end of the book
	for( index = 0; pcbId != this.book[index].pcbId && i < this.book.length; index += 1) {
	}
	
	// We hit the end of the loop without finding the matching ID
	if( index >= this.book.length ) {
		return 1;
	}
	
	// Get the filename
	var filename = this.book[index].filename;
	
	// create the program in a temp file
	FSDD.isr( ["delete" , filename] );
	
	// Remove the page from the book
	this.book.splice( index, 1);
	
	// Success!
	return 0;
}

// Returns the new program string after exchanging this one
function vmmSwapProgram( pcbId, newPcbId, newProgram ) {

	// Take the program data
	var programData = this.getProgram( pcbId );

	// Delete the previous program
	this.deleteProgram( pcbId );
	
	// Add the new program
	this.setProgram( newPcbId, newProgram );

	// Hand back the program string
	return programData;
}
