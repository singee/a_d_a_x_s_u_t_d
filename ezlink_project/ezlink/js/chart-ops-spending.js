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

