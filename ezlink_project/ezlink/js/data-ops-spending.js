////////////////////////////////////////////////
// Data operations
////////////////////////////////////////////////

var mrtStationLocations;
var mrtStationNames;
var spendingData = [];
var startTimeMS;
var endTimeMS;

var colorFactor = 400;//255;
var mrtColormap = {
	"Bukit Panjang LRT": [103/colorFactor, 129/colorFactor, 118/colorFactor],
	"Changi Airport Branch Line": [0, 168/colorFactor, 81/colorFactor],
	"Circle Line": [250/colorFactor, 156/colorFactor, 40/colorFactor],
	"Circle Line Extension": [250/colorFactor, 156/colorFactor, 40/colorFactor],
	"Downtown Line": [0, 111/colorFactor, 185/colorFactor],
	"East West Line": [0, 168/colorFactor, 81/colorFactor],
	"North East Line": [123/colorFactor, 67/colorFactor, 154/colorFactor],
	"North South Line": [239/colorFactor, 56/colorFactor, 42/colorFactor],
	"Punggol LRT": [103/colorFactor, 129/colorFactor, 118/colorFactor],
	"Sengkang LRT": [103/colorFactor, 129/colorFactor, 118/colorFactor],
	"unknown line": [255/colorFactor, 255/colorFactor, 0],
	"selected": [0, 255/colorFactor, 255/colorFactor],
};


var datasetName = 'MRTTapOuts_JanFebMar';
var independent = 'TAP_OUT_TIME';
var maxCountPerStation = 3*1500000;

//var datasetName = 'MRTTapOuts';
//var independent = 'TAP_OUT_TIME_IN_30MIN';
//var maxCountPerStation = 1500000;

var variable = 'TOTAL_AMOUT_SPENT_';
var schema = {};
schema[variable] = 'value';
schema[independent] = 'time';
var data = [];
var rData = {};
rData[independent] = [];
rData[variable] = [];
var specs = {
	type: 'bar',
	title: 'Spending',
	subTitle: 'by date',
	data: rData,
	schema: schema,
	tooltip: true,
	independent: independent,
	zoomable: true,
	ymin: 0,
	ymax: 120000,
};
/*
var independent2 = 'STATION_NAME';
var variable2 = 'TOTAL_TAP_OUT';
var schema2 = {};
schema2[variable2] = 'value';
schema2[independent2] = 'category';
var data2 = [];
var rData2 = {};
rData2[independent2] = [];
rData2[variable2] = [];
var specs2 = {
	type: 'bar',
	title: 'Tap Outs',
	subTitle: 'by stations',
	data: rData2,
	schema: schema2,
	tooltip: true,
	independent: independent2,
	zoomable: true,
	ymin: 0,
	ymax: maxCountPerStation,
};
*/
var independent2 = 'STATION_NAME';
var variable2 = 'TOTAL_AMOUT_SPENT_';
var schema2 = {};
schema2[variable2] = 'value';
schema2[independent2] = 'category';
var data2 = [];
var rData2 = {};
rData2[independent2] = [];
rData2[variable2] = [];
var specs2 = {
	type: 'bar',
	title: 'Spending',
	subTitle: 'by stations',
	data: rData2,
	schema: schema2,
	tooltip: true,
	independent: independent2,
	zoomable: true,
	ymin: 0,
	ymax: 5000000,
};

function getMRTLocations()
{
	return dataAPI.getResJson('MRTStationInfo')
	.then(function(json){
		mrtStationLocations = json;

		var nameMap = {};
		// remove NEL, CCL from name
		// and set a flag to indicate dupe name
		mrtStationLocations.forEach(function(station){
			removeTag(station, 'NEL')
			removeTag(station, 'CCL')
			removeTag(station, 'DTL')
			removeTag(station, 'NSEW')

			if(station.STATION_NAME in nameMap)
			{
				nameMap[station.STATION_NAME] += 1;
				station.dupeName = true;
			}
			else
			{
				nameMap[station.STATION_NAME] = 1;
				station.dupeName = false;
			}
		})

	})
}
function removeTag(station, tag)
{
	var index = station.STATION_NAME.indexOf(tag);
	if(index != -1)
	{
		station.ext = station.STATION_NAME.substr(index);
		station.STATION_NAME = station.STATION_NAME.substr(0, index).trim();
	}
}

function getMRTNames()
{
	return dataAPI.getResJson('MRTStation_Names')
	.then(function(json){
		mrtStationNames = json;
	})
}

function addMRTLineToLocation()
{
	mrtStationLocations.forEach(function(location){
		location.line = getMRTLineFromName(location.STATION_NAME);
	})
}

function getMRTLineFromName(name){
	var results = mrtStationNames.filter(function(station){
		return (name.indexOf(station['MRT Station - English'].trim()) == 0)
	})
	if(results.length > 0)
		return results[0]['MRT Line - English'].trim();
	console.log('unknown line', name);
	return 'unknown line';
}
function getMRTNameFromID(id){
	var results = mrtStationLocations.filter(function(station){
		return (station['STATION_ID'] == id);
	})
	if(results.length > 0)
		return results[0]['STATION_NAME'];
	console.log('unknown name', id);
	return 'unknown name';
}

function getTimeRange()
{
	var id;
	return dataAPI.getResId(datasetName)
	.then(function(result){
		id = result;
		return dataAPI.queryResourceData(id, 0, 1, null, {_id:'asc'})
		.then(function(result){
			if(result.success)
			{
				var item = result.result.entities[0];
				startTimeMS = moment(item[independent]).valueOf();
				console.log('start', startTimeMS);
			}
			else
				throw(result)
		})
		.then(function(){
			return dataAPI.queryResourceData(id, 0, 1, null, {_id:'desc'})
		})
		.then(function(result){
			if(result.success)
			{
				var item = result.result.entities[0];
				endTimeMS = moment(item[independent]).valueOf();
				console.log('end', endTimeMS);
			}
			else
				throw(result)
		})
		.then(function(){
			adax.timeKeeper.init(startTimeMS, endTimeMS, 1000)
			timeline = new Timeline();

			// corresponds to the 4 buttons
			var rates = [
				15*60,
				30*60,
				60*60,
				60*60*24
			];
			timeline.init(adax.timeKeeper, document.querySelector('#timeline'), rates)
		})
	})
}

function streamTapOutData()
{
	return dataAPI.getResJsonStream(datasetName, 0, function(json){
		if(json.length > 0)
		{
			injectNameAndLine(json);
			updateChart1(json);
			updateChart2(json);

			updateLayer(json);

			convertTimestamp(json);
			spendingData.push.apply(spendingData, json);
		}
	}, 10000);
}


function convertTimestamp(json){
	json.forEach(function(row){
		var time = row[independent];
		row.timestamp = moment(time).valueOf(); // convert to unix epoc time
	})
}
function injectNameAndLine(json){
	json.forEach(function(row){
		var name = getMRTNameFromID(row['STATION_ID']);
		var line = getMRTLineFromName(name);
		row.STATION_NAME = name;
		row.line = line;
	})
}

function aggregateRef(json, variable, independent, ops, data)
{
	var xf = crossfilter(json);
	var ind; 
	ind = xf.dimension(function(d){
		
		return d[independent];
		//return moment(d[independent]).format('YYYY-MM-DD')
	})
	/*
	if(independent.toLowerCase().indexOf('time')==-1)
		ind = xf.dimension(function(d){return d[independent]})
	else
		ind = xf.dimension(function(d){
			return moment(d[independent]).format('YYYY-MM-DD')
		})
	*/
	var sum = ind.group().reduceSum(function(d){return Math.max(d[variable], 0)}).all();
	if(data == undefined)
		return sum;

	if(!(variable in data))
	{
		data[variable] = [];
		data[independent] = [];
	}
	sum.forEach(function(item, index){
		upsert(data, variable, independent, item);
	})
	
	return data;
}
function upsert(data, variable, independent, item)
{
	var d = data[variable];
	var e = data[independent];
	var i;
	for(i=0; i<e.length; ++i)
	{
		if(e[i] == item.key)
		{
			d[i][1] += item.value;
			break;
		}
	}
	if(i>=e.length)
	{
		e.push(item.key);
		d.push([item.key, item.value])
	}
}

function queryData(data, field, value)
{
	var cv;
	var d = [];
	for(var i=0; i<data.length; ++i)
	{
		var item = data[i];
		var v = item[field];
		if(value <= v)
		{
			if(cv == undefined)
				cv = v;
			if(cv == v)
				d.push(item)
			else
				break;
		}
	}

	return Promise.resolve(d);
}


function queryDataRange(data, field, value1, value2)
{
	var cv;
	var d = [];
	for(var i=0; i<data.length; ++i)
	{
		var item = data[i];
		var v = item[field];
		if(v>=value1 && v<value2)
		{
			if(cv == undefined)
				cv = v;
			d.push(item)
		}
		if(v>=value2)
			break;
	}

	return Promise.resolve(d);
}

