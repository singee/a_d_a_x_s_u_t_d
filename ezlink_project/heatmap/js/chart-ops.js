////////////////////////////////////////////////
// Chart operations
////////////////////////////////////////////////

function addMRTCharts(){
	chart.chartService(specs, '#slot2');
	chart.chartService(specs2, '#slot4');
}

function updateChart1(json)
{
	var data = aggregateRefs(json, [variable_1, variable_2, variable_3], independent, 'sum', rData);
	specs.toUpdate = {
		xAxis: {
			data: data[independent]
		},
		series:[
			{data: data[variable_1]},
			{data: data[variable_2]},
			{data: data[variable_3]},
		]
	};
	chart.updateChart(specs);
}

function updateChart2(json)
{
	var data2 = aggregateRefs(json, [variable2_1, variable2_2, variable2_3], independent2, 'sum', rData2);
	specs2.toUpdate = {
		xAxis: {
			data: data2[independent2]
		},
		series:[
			{data: data2[variable2_1]},
			{data: data2[variable2_2]},
			{data: data2[variable2_3]},
		]
	};
	chart.updateChart(specs2);
}
