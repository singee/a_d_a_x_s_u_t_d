// timeline class
function Timeline(){
	this._dragOffset = 10;
}


Timeline.prototype = {
	constructor: Timeline,

	init: function(timekeeper, container, rates){
		this.barLength = 1000;
		this.noDate = false;
		this.isDragging = false;
		this.checkLast = null;
		this.timekeeper = timekeeper;
		this.container = container;
		if(!this.container)
			this.container = document.body;

		// listens to regiondataviewtime
		this.timekeeper.observer&&
			this.timekeeper.observer.subscribe(this.update.bind(this));
		this.inited = false;

		this.rates = rates || [
			1, 60, 60*60, 60*60*24
		];

		this.timeDisplay = this.makeEl('div', 'timeDisplay', this.container, null, 'time');
		this.dateDisplay = this.makeEl('div', 'dateDisplay', this.container, null, 'date');
		this.timeProgressBar1 = this.makeEl('div', 'timeProgressBar1', this.container, null, '');
		this.timeProgressBar2 = this.makeEl('div', 'timeProgressBar2', this.container, null, '');
		this.speedDisplayBackButtons = this.makeEl('div', 'speedDisplayBackButtons', this.container, null, '');
		this.checkX0 = this.makeEl('div', 'checkX0', this.speedDisplayBackButtons, 'ControlButtonType3', 'pause');
		this.checkX1 = this.makeEl('div', 'checkX1', this.speedDisplayBackButtons, 'ControlButtonType3', this.rates[0]+'x');
		this.checkX2 = this.makeEl('div', 'checkX2', this.speedDisplayBackButtons, 'ControlButtonType3', this.rates[1]+'x');
		this.checkX3 = this.makeEl('div', 'checkX3', this.speedDisplayBackButtons, 'ControlButtonType3', this.rates[2]+'x');
		this.checkX4 = this.makeEl('div', 'checkX4', this.speedDisplayBackButtons, 'ControlButtonType3', this.rates[3]+'x');

		this.checkX0.addEventListener('click', this.toggleX0.bind(this));
		this.checkX1.addEventListener('click', this.toggleX1.bind(this));
		this.checkX2.addEventListener('click', this.toggleX2.bind(this));
		this.checkX3.addEventListener('click', this.toggleX3.bind(this));
		this.checkX4.addEventListener('click', this.toggleX4.bind(this));

	},

	// jquery extend, which merges 2 lists
	// this is used in merging options/config lists,
	// a default and a user supplied overrides
	extend: function(){
		for(var i=1; i<arguments.length; i++)
			for(var key in arguments[i])
				if(arguments[i].hasOwnProperty(key))
					arguments[0][key] = arguments[i][key];
		return arguments[0];
	},

	// dynamically add css rules to stylesheet
	addCSSRule: function(sheet, selector, rules, index) {
		//console.log(sheet);
		//if("insertRule" in sheet) {
		//	sheet.insertRule(selector + "{" + rules + "}", index);
		//}
		//else if("addRule" in sheet) {
			sheet.addRule(selector, rules, index);
		//}
	},

	makeEl: function(type, id, parent, c, text)
	{
		var el = document.createElement(type);
		el.id = id;
		if(c)
			el.classList.add(c);
		el.textContent = text;
		parent.appendChild(el);
		return el;
	},

	////////////////////////////////////////////////////////////
	// timeline GUI
	md: function(e)
	{
		this.isDragging = true;
		//var x = e.clientX;
		//var progress = (x-110)/this.barLength;
		//var progress = 1 - ((window.innerWidth-x)-this._dragOffset)/this.barLength;

		var x = e.clientX - this.timeProgressBar1.getBoundingClientRect().left;
		var progress = x/this.barLength;

		this.timekeeper.setProgress(progress);
		//console.log('progress '+progress+' '+this.timekeeper.simCurrentTime);
	},
	mm: function(e)
	{
		if(!this.isDragging)
			return;
		//var x = e.clientX;
		//var progress = (x-110)/this.barLength;
		//var progress = 1 - ((window.innerWidth-x)-this._dragOffset)/this.barLength;
		//console.log('progress '+progress+' '+x);

		var x = e.clientX - this.timeProgressBar1.getBoundingClientRect().left;
		var progress = x/this.barLength;

		this.timekeeper.setProgress(progress);
	},
	mu: function(e)
	{
		this.isDragging = false;
	},

	checkThis: function(el){
		el.classList.add('check');
		el.classList.remove('uncheck');
	},
	uncheckThis: function(el){
		el.classList.remove('check');
		el.classList.add('uncheck');
	},

	pause: function()
	{
		if(!this.timekeeper)
			return;
		if(this.timekeeper.timePaused)
			return;
		var el = document.querySelector('#checkX0');
		this.timekeeper.setPause(true);
		this.checkThis(el);
	},
	unpause: function()
	{
		if(!this.timekeeper)
			return;
		if(!this.timekeeper.timePaused)
			return;
		var el = document.querySelector('#checkX0');
		this.timekeeper.setPause(false);
		this.uncheckThis(el);
	},

	toggleX0: function()
	{
		if(!this.timekeeper)
			return;
		var el = document.querySelector('#checkX0');

		this.timekeeper.setPause(!this.timekeeper.timePaused);
		if(this.timekeeper.timePaused)
			this.checkThis(el);
		else
			this.uncheckThis(el);
	},
	toggleX1: function()
	{
		if(!this.timekeeper)
			return;
		if(this.checkLast)
			this.uncheckThis(this.checkLast);
		this.checkLast = document.querySelector('#checkX1');
		this.checkThis(this.checkLast);

		this.timekeeper.setRealDuration(this.timekeeper.getSimDuration()/this.rates[0]);
		console.log('duration '+this.timekeeper.getRealDuration());
	},
	toggleX2: function()
	{
		if(!this.timekeeper)
			return;
		if(this.checkLast)
			this.uncheckThis(this.checkLast);
		this.checkLast = document.querySelector('#checkX2');
		this.checkThis(this.checkLast);

		this.timekeeper.setRealDuration(this.timekeeper.getSimDuration()/this.rates[1]);
		console.log('duration '+this.timekeeper.getRealDuration());
	},
	toggleX3: function()
	{
		if(!this.timekeeper)
			return;
		if(this.checkLast)
			this.uncheckThis(this.checkLast);
		this.checkLast = document.querySelector('#checkX3');
		this.checkThis(this.checkLast);

		this.timekeeper.setRealDuration(this.timekeeper.getSimDuration()/this.rates[2]);
		console.log('duration '+this.timekeeper.getRealDuration());
	},
	toggleX4: function()
	{
		if(!this.timekeeper)
			return;
		if(this.checkLast)
			this.uncheckThis(this.checkLast);
		this.checkLast = document.querySelector('#checkX4');
		this.checkThis(this.checkLast);

		this.timekeeper.setRealDuration(this.timekeeper.getSimDuration()/this.rates[3]);
		console.log('duration '+this.timekeeper.getRealDuration());
	},

	update: function(inTime)
	{
		if(!this.timekeeper)
			return;
		if(this.timekeeper.simStartTime==this.timekeeper.simEndTime)
			return;
		if(!this.inited)
		{
			this.inited = true;
			this.initStartEnd();
		}

		var d = new Date(inTime);
		if(!this.noDate)
			this.dateDisplay.innerHTML = this.timekeeper.dateString(d);
		else
			this.dateDisplay.innerHTML = " ";
		this.timeDisplay.innerHTML = this.timekeeper.timeString(d);
		
		var progress = this.timekeeper.progress();
		//console.log('progress '+progress);
		//var w = (this.barLength-4)*progress;
		var w = this.barLength*(1-progress);
		if(w<0)
			w=0;
		this.timeProgressBar2.style.width = w+'px';

	},

	addMouseEvents: function(selector)
	{
		var el = document.querySelector(selector);
		el.addEventListener('mousedown', this.md.bind(this));
		el.addEventListener('mouseup', this.mu.bind(this));
		el.addEventListener('mousemove', this.mm.bind(this));
	},

	initStartEnd: function()
	{
		var start = this.timekeeper.simStartTime;
		var end = this.timekeeper.simEndTime;

		this.addMouseEvents('#timeProgressBar1');
		this.addMouseEvents('#timeProgressBar2');
		this.addMouseEvents('#timeDisplay');
		this.addMouseEvents('#dateDisplay');

		var ticktype = d3.time.days;
		var tickformat = d3.time.format('%d');
		var duration = end - start;
		if(duration>0 && duration<=1000*60)
		{
			// less than 1 minute
			ticktype = d3.time.second;
			tickformat = d3.time.format('%s');
		}
		else if(duration<=1000*60*60)
		{
			// less than 1 hour
			ticktype = d3.time.minute;
			tickformat = d3.time.format('%M');
		}
		else if(duration<=1000*60*60*24)
		{
			// less than 24 hour
			ticktype = d3.time.hour;
			tickformat = d3.time.format('%H');
		}
		else if(duration<=1000*60*60*24*7)
		{
			// less than 1 week
			ticktype = d3.time.day;
			tickformat = d3.time.format('%a');
		}
		else if(duration<=1000*60*60*24*30*3)
		{
			// less than 3 months
			ticktype = d3.time.day;
			tickformat = d3.time.format('%d');
		}
		else if(duration<=1000*60*60*24*365*2)
		{
			// less than 2 years
			ticktype = d3.time.month;
			tickformat = d3.time.format('%b');
		}
		else
		{
			// more than 2 years
			ticktype = d3.time.year;
			tickformat = d3.time.format('%Y');
		}

		var margin = {top: 30, right: 0, bottom: 5, left: 0},
			width = this.barLength,
			height = 40;
		var x = d3.time.scale()
			//.domain([new Date(data[0].date), d3.time.day.offset(new Date(data[data.length - 1].date), 1)])
			.domain([start, end])
			.rangeRound([0, width - margin.left - margin.right]);
		var xAxis = d3.svg.axis()
			.scale(x)
			.orient('bottom')
			.ticks(ticktype)
			.tickFormat(tickformat)
			.tickSize(10)
			.tickPadding(8);
		var svg = d3.select('#timeProgressBar1').append('svg')
			.attr('class', 'chart')
			.attr('width', width)
			.attr('height', height)
			.append('g')
			//.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
		svg.append('g')
			.attr('class', 'x axis')
			//.attr('transform', 'translate(0, ' + (height - margin.top - margin.bottom) + ')')
			.call(xAxis);

		this.toggleX3();
		this.toggleX0();
	},
};

