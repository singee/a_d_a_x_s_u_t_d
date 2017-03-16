////////////////////////////////////////////////
// 3D Layer operations
////////////////////////////////////////////////

function addMRTLayer(){
	var data = mrtStationLocations.map(function(record){
		var opacity = record.dupeName ? 0 : 0.8;
		return [+record.LATITUDE, +record.LONGITUDE, 0.005, mrtColormap[record.line], opacity];//[[lat, lon, ht, [r,g,b]], opacity, ...]
	})
	//var rgb = data[0][3];
	//var color = (rgb[0]*255)<<16 + (rgb[1]*255)<<8 + rgb[2]*255;
	//console.log(rgb, color);

	//console.log('layer', data);
	var params = {
		type: 'bars',
		name: 'mrt_stations',
		data: data,
		size: 0.01,
	}
	map3d.addLayer(params)
	.then(function(layer){
		pickTarget = layer;
		map3d._currentContext.addPicking(layer, onPickHovered, onPickSelected);
	})
}

var ttt, tttd;

var highlightCount = -1; // set this to highlight top N stations
var prevTime;
function updateLayer2(simulatedTime){
	if(mode != 'simulation')
		return;
	if(prevTime == simulatedTime)
		return;
	prevTime = simulatedTime;

	var id = 'STATION_NAME';
	var field = 'TOTAL_TAP_OUT';

	//queryDataRange(tapOutData, 'timestamp', simulatedTime, simulatedTime+30*60*1000)
	queryData(tapOutData, 'timestamp', simulatedTime)
	.then(function(data){
		for(var i=0; i<mrtStationLocations.length; ++i)
		{
			var station = mrtStationLocations[i];
			station[field] = 0;
			if(station.dupeName)
				continue;
			for(var j=0; j<data.length; ++j)
			{
				var datum = data[j];
				if(datum[id] == station[id])
				{
					station[field] += datum[field];
				}
			}
		}
		updateChart2_2(mrtStationLocations);

		var ht = mrtStationLocations.map(function(item){
			return item[field]/(4000.0*10);
			//return item[field]/(4000.0*10);
		})
		var dupe = mrtStationLocations.slice();
		dupe.sort(function(a, b){
			return b[field] - a[field];
		})
		var opacities = highlightStations(dupe, highlightCount)

		var params = {
			height: ht,
			opacity: opacities
		}
		map3d.updateLayer('mrt_stations', params, 300)
	})
}

function updateLayer(json){
	for(var i=0; i<mrtStationLocations.length; ++i)
	{
		mrtStationLocations[i].totalTapouts = 0;
	}

	rData2[variable2].forEach(function(item){
		var name = item[0];
		var value = item[1];
		updateTapoutToLocations(name, value);
	});

	var data = mrtStationLocations.map(function(record){
		return record.totalTapouts/(1500000.0*10);
	})

	var dupe = mrtStationLocations.slice();
	dupe.sort(function(a, b){
		return b.totalTapouts - a.totalTapouts;
	})
	var opacities = highlightStations(dupe, highlightCount)

	var params = {
		height: data,
		opacity: opacities
	}
	map3d.updateLayer('mrt_stations', params, 300)
}

function updateTapoutToLocations(name, value){
	for(var i=0; i<mrtStationLocations.length; ++i)
	{
		if(mrtStationLocations[i].STATION_NAME.indexOf(name) != -1)
		{
			mrtStationLocations[i].totalTapouts += value;
			break
		}
	}
}

function getStationInfo(obj)
{
	var station = null;
	var i;
	for(i=0; i<pickTarget.children.length; ++i)
	{
		if(pickTarget.children[i] == obj)
			break;
	}
	if(i < pickTarget.children.length)
	{
		station = mrtStationLocations[i]
	}

	return station;
}

function complement(r, g, b)
{
	var c = [r, g, b];

	var cc = new THREE.Color(r/255, g/255, b/255);
	var hsl = cc.getHSL();
	var Y = 0.299*cc.r + 0.587*cc.g + 0.114*cc.b;
	//console.log(hsl, cc, Y);

	if(Y > 0.6)
		hsl.l = 0.2;
	else
		hsl.l = 0.9;

	cc.setHSL(hsl.h, hsl.s, hsl.l);
	//console.log('after ', hsl, cc);
	c[0] = Math.round(cc.r*255);
	c[1] = Math.round(cc.g*255);
	c[2] = Math.round(cc.b*255);

	return c;
}

function formatInfo(station)
{
	var color = mrtColormap[station.line];
	var r = Math.round(color[0]*colorFactor);
	var g = Math.round(color[1]*colorFactor);
	var b = Math.round(color[2]*colorFactor);
	var cc = complement(r, g, b);
	var cs = 'background:rgb('+r+','+g+','+b +'); color:rgb('+cc[0]+','+cc[1]+','+cc[2] +');';
	//console.log(cs);

	var s = '<div class="panel panel-default">';
	s += '<div class="panel-heading" style="'+cs+'">' + station.STATION_NAME + '</div>';
	s += '<div class="panel-body">';
	s += '<p>ID: ' + station.STATION_ID + '</p>';
	s += '<p>Line: ' + station.line + '</p>';
	if(mode == 'simulation')
		s += '<p>Total Tapouts: ' + station.TOTAL_TAP_OUT + '</p>';
	else
		s += '<p>Total Tapouts: ' + station.totalTapouts + '</p>';
	s += '</div>';
	s += '</div>';

	return s;
}

function formatInfo2(station, idVal)
{
	var color = mrtColormap[station.line];
	var r = Math.round(color[0]*colorFactor);
	var g = Math.round(color[1]*colorFactor);
	var b = Math.round(color[2]*colorFactor);
	var cc = complement(r, g, b);
	var cs = 'background:rgb('+r+','+g+','+b +'); color:rgb('+cc[0]+','+cc[1]+','+cc[2] +');';
	//console.log(cs);

	var s = '<div class="panel panel-default">';
	s += '<div class="panel-heading" id="'+idVal+'-handle" style="'+cs+'">' + station.STATION_NAME + '</div>';
	s += '<div class="panel-body">';
	s += '<p>ID: ' + station.STATION_ID + '</p>';
	s += '<p>Line: ' + station.line + '</p>';
	if(mode == 'simulation')
		s += '<p>Total Tapouts: ' + station.TOTAL_TAP_OUT + '</p>';
	else
		s += '<p>Total Tapouts: ' + station.totalTapouts + '</p>';
	s += '</div>';
	s += '</div>';

	return s;
}

/*
function formatInfo2(station)
{
	var color = mrtColormap[station.line];
	var r = Math.round(color[0]*colorFactor);
	var g = Math.round(color[1]*colorFactor);
	var b = Math.round(color[2]*colorFactor);
	var cc = complement(r, g, b);
	var cs = 'background:rgb('+r+','+g+','+b +'); color:rgb('+cc[0]+','+cc[1]+','+cc[2] +');';
	//console.log(cs);

	var s = ' ';
	s += '<div class="header" style="'+cs+'">' + station.STATION_NAME + '</div>';
	s += '<ul class="list">';
	s += '<li>ID: ' + station.STATION_ID + '</li>';
	s += '<li>Line: ' + station.line + '</li>';
	if(mode == 'simulation')
		s += '<li>Total Tapouts: ' + station.TOTAL_TAP_OUT + '</li>';
	else
		s += '<li>Total Tapouts: ' + station.totalTapouts + '</li>';
	s += '</ul>';

	return s;
}
*/

var makeSignage = function(obj){
	var el = document.createElement('div');
	el.classList.add('signage');
	var station = getStationInfo(obj);
	var s = formatInfo(station);
	el.innerHTML = s;
	var signage = new THREE.CSS3DObject(el);
	signage.scale.multiplyScalar(0.001);
	signage.position.copy(obj.position);
	signage.position.z += 0.2;
	map3d._currentContext._cssbillboard.add(signage);
	return signage;
};


var makeSignage2 = function(obj){
	var el = document.createElement('div');
	/*
	el.classList.add('multiple_signage');
	signage.classList.add('highlight');
	*/
	var divIdVal = "div_" + new Date().getTime().toString();
	el.id = divIdVal;
	var station = getStationInfo(obj);
	el.classList.add("signage_"+station.STATION_ID);
	var s = formatInfo2(station,divIdVal);
	el.innerHTML = s;
	var signage = new THREE.CSS3DObject(el);
	signage.scale.multiplyScalar(0.001);
	signage.position.copy(obj.position);
	signage.position.z += 0.2;
	map3d._currentContext._cssbillboard.add(signage);
	addDraggable('#'+divIdVal, '#'+divIdVal+'-handle');
	
	return signage;
};

var fillSignage = function(signage, obj){
	var station = getStationInfo(obj);
	var s = formatInfo(station);
	signage.innerHTML = s;
};

var pickTarget = null;
var prev = null;
var selectedList = [];//multi-select

function onPickHovered(obj, point, picked, x, y){
	if(prev)
	{
		if(!obj || obj.parent!=prev)
		{
			var signage = document.querySelector('.signage');
			if(signage)
				signage.classList.remove('highlight');
			prev = null;
		}
	}

	if(!map3d.isRelated(pickTarget, obj))
		return false;
	if(obj)
	{
		var hovered = obj.parent;
		if(hovered != prev)
		{
			prev = hovered;
			var signage = document.querySelector('.signage');
			if(signage)
			{
				fillSignage(signage, prev);
				var p = new THREE.Vector3(0, 0, 1);
				var pos = map3d.toScreenPosition(p, prev);
				var xx = Math.max(pos.x-signage.offsetWidth, 0);
				var yy = Math.max(pos.y-signage.offsetHeight, 60);
				signage.style.left = xx + 'px';
				signage.style.top = yy + 'px';
				signage.classList.add('highlight');
			}
		}
	}
	return true;
}
function onPickSelected(obj, point, picked, x, y){
	if(!map3d.isRelated(pickTarget, obj))
		return false;
	if(obj)
	{
		var selected = obj.parent;
		if(toggleSelected(selected))
		{
			highlightSelectedStation(selected);
		}
		else
		{
			// toggle: if selected is selected again, unselect it
			unHighlightSelectedStation(selected);
		}
	}
	return true;
}

function toggleSelected(selected)
{
	for(var i=0; i<selectedList.length; ++i)
	{
		if(selectedList[i].id == selected.id)
		{
			selectedList.splice(i, 1);
			return false;
		}
	}
	selectedList.push(selected);
	return true;
}


function highlightStations(list, count)
{
	var opacities = mrtStationLocations.map(function(station, i){
		if(station.dupeName)
			return 0;
		else if(inList(station, list, 'STATION_NAME', count) >= 0)
		{
			//console.log(station)
			return 0.8;
		}
		else
			return 0.3;
	});
	return opacities;
}

function inList(station, list, id, count)
{
	var n = count;
	if(n<0)
		n = list.length;
	for(var i=0; i<n; ++i)
	{
		if(list[i][id] == station[id])
			return i;
	}
	return -1;
}


function highlightSelectedStation(obj)
{
	// can all fillSignage on this...
	var color = mrtColormap['selected'];
	animateColor(obj.children[0], color, 300);
	var sing = makeSignage2(obj);
}

function unHighlightSelectedStation(obj)
{
	var station = getStationInfo(obj);
	var color = mrtColormap[station.line];
	animateColor(obj.children[0], color, 300);
	
	var divId;
	var inputs = document.getElementsByClassName("signage_"+station.STATION_ID);
	for (var i = 0; i < inputs.length; i++) {
		divId= inputs[i].id;
	}
	document.getElementById(divId).style.visibility = 'hidden';
}

function animateColor(mesh, color, duration)
{
	var ocolor = mesh.material.color.clone();
	var tween = new TWEEN.Tween({v:0})
	.to( {v:1}, duration )
	.easing( TWEEN.Easing.Cubic.Out )
	.onUpdate(function(){
		var progress = this.v;
		mesh.material.color.r = ocolor.r + progress*(color[0] - ocolor.r);
		mesh.material.color.g = ocolor.g + progress*(color[1] - ocolor.g);
		mesh.material.color.b = ocolor.b + progress*(color[2] - ocolor.b);
		mesh.material.needsUpdate = true;
	})
	.onComplete(function(){
	})
	.start();
}
