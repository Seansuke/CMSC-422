/* ------------  
   agendum.js
   Our CPU Scheduler
   It's like Moneypenny, but without the flirting.  I'll change that.
   ------------ */
   
// I'll be scheduling your tasks, Mr. Bond.
// "Please, call me James"
function Agendum() {
	// Variables
	this.jobs = new Array(); // Simulates our Ready Queue
	this.timer = -1;
	this.currentJob = -1;
	
	// Methods
	this.jobDone = AgendumJobDone; // Callback function
	this.newJob = AgendumNewJob; // Callback function
	this.cycle = AgendumCycle; // Callback function
	this.empty = AgendumEmpty; // Callback function
	this.log = AgendumLog; // Callback function
	this.log();
}

// A single job in the agenda
function Agenda( newPcbId, newPriority ) {
	this.pcbId = newPcbId;
	this.priority = newPriority;
}

// There's a new assignment James, do be careful.
function AgendumNewJob( pcbId, priority ) {
	this.jobs.push( new Agenda( pcbId, priority ) );
	krnTrace("Added. PID:" + this.jobs[ this.jobs.length - 1 ].pcbId + ", Job ID:" + (this.jobs.length - 1) + ", Priority: " + this.jobs[ this.jobs.length - 1 ].priority );
	this.log();
}

// Show all the information to the areatext  Debug purposes only
function AgendumLog() {
	var output = "CPU SCHEDULER\n";
	output += "Current Job: " + this.currentJob + "\n";
	output += "Timer: " + this.timer + "\n";
	output += "PIDs: ";
	for(var i = 0; i < this.jobs.length; i += 1) {
		output += "[" + this.jobs[i].pcbId + ":" + this.jobs[i].priority + "]";
	}
	document.getElementById("agendumLog").value = output;
}

// Job well done, James.  I'll notify M that your mission is completed.
function AgendumJobDone() {
	krnTrace("Terminating. PID:" + this.jobs[this.currentJob].pcbId + ", Job ID:" + this.currentJob);
	this.jobs.splice(this.currentJob, 1);
	this.currentJob -= 1;
	this.timer = -1;
	this.log();
}

// Clear the Agenda
function AgendumEmpty() {
	while( this.jobs.length > 0) { 
		this.jobs.pop();
		this.timer = -1;
		this.currentJob = -1;	
	}
	this.log();
}

// Please don't interrupt my job, James!
function AgendumCycle() {	
	// A break now.  Care for a drink?
	if( this.jobs.length == 0 ) {
		this.log();
		return -1;
	}
	
	// News flash James!  We need you to stop what you're doing to work on a different mission!
	if( this.timer <= 0 ) {
		// Only go to the NEXT job if we're not using priority
		if( SCHEDULING != "priority" ) {
			this.currentJob = (this.currentJob + 1) % this.jobs.length;
		}
		else {
			// Default next job
			this.currentJob = 0;
			// Cycle through every item to find the highest priority item and set it as the current job
			for( var i = 0; i < this.jobs.length ; i += 1 ) {
				// Compare the priority of the currently selected job to the index
				if( this.jobs[i].priority < this.jobs[this.currentJob].priority ) {
					// The indexed job is more important
					this.currentJob = i;
				}
			}
		}
		// We set this regardless of what type we're using since it must always be above 0
		this.timer = QUANTUM;
		krnTrace("Setting Current Job. PID:" + this.jobs[this.currentJob].pcbId + ", Job ID:" + this.currentJob);
	}
	
	// Status is ok, James.  Continue with your mission.
	krnTrace("Running. PID:" + this.jobs[this.currentJob].pcbId + ", Job ID:" + this.currentJob);
	
	// Only decrement the timer every cycle if we use round robin
	if( SCHEDULING == "rr" ) {
		this.timer -= 1;
	}
	
	this.log();
	
	// return the PID James is working on
	return this.jobs[this.currentJob].pcbId;
}