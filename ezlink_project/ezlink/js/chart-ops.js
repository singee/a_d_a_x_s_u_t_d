////////////////////////////////////////////////
// Chart operations
////////////////////////////////////////////////

function addMRTCharts(){
	chart.chartService(specs, '#slot2');
	chart.chartService(specs2, '#slot4');

	addDraggable('#slot2-container', '#slot2-handle');
	addDraggable('#slot4-container', '#slot4-handle');
}

function updateChart1(json)
{
	var data = aggregateRef(json, variable, independent, 'sum', rData);
	specs.toUpdate = {
		xAxis: {
			data: data[independent]
		},
		series:[
			{data: data[variable]}
		]
	};
	chart.updateChart(specs);
}

function updateChart2(json)
{
	var data2 = aggregateRef(json, variable2, independent2, 'sum', rData2);
	specs2.toUpdate = {
		xAxis: {
			data: data2[independent2]
		},
		series:[
			{data: data2[variable2]}
		]
	};
	chart.updateChart(specs2);
}




function updateChart2_2(mrtlocations)
{
	var data2 = {};
	data2[independent2] = [];
	data2[variable2] = [];

	var max = 0;

	mrtlocations.forEach(function(station){
		var v2 = station[variable2];
		if(max < v2)
			max = v2;
		data2[variable2].push(v2)
	})

	specs2.toUpdate = {
		legend: {
			data: [], //removed the unneeded legend
		},
		yAxis: {
			max: max // set to 8000 if you want it to be fixed
		},
		series:[
			{data: data2[variable2]}
		]
	};
	//console.log(data2)
	chart.updateChart(specs2);
}
