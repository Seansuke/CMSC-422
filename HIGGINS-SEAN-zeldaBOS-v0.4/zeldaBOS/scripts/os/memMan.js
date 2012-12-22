/* ------------  
   MemMan.js
   ------------ */
function memMan() {
	// Variables
	
	// Methods
	this.setByte = memSetByte; // Callback function
	this.getByte = memGetByte; // Callback function
	this.addByte = memAddByte; // Callback function
}
function memSetByte( hexAddress , hexValue ) {
	var decAddress = parseInt( hexAddress , 16 );
	PAGE[ _CPU.page ][ decAddress ] = hexValue;
}
function memGetByte( hexAddress ) {
	var decAddress = parseInt( hexAddress , 16 );
	return PAGE[ _CPU.page ][  decAddress ];
}
function memAddByte( hexAddress , amnt ) {
	var decAddress = parseInt( hexAddress , 16 );
	var decValue = parseInt( PAGE[ _CPU.page ][  decAddress ] , 16 );
	decValue += parseInt( amnt , 16 );
	var hexValue = ( decValue ).toString(16);
	hexValue = ("0" + hexValue).substring( "0" + hexValue.length - 2)
	return hexValue;
}