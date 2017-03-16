////////////////////////////////////////////////
// 3D Layer operations
////////////////////////////////////////////////
var pointsData;
function addMRTLayer(){
	pointsData = mrtStationLocations.map(function(record){
		return [+record.LATITUDE, +record.LONGITUDE, 10, passengerTypeColormap[selectedPassengerType]];//[[lat, lon, sz, [r,g,b]], ...]
	})
	var params = {
		type: 'points',
		name: 'mrt_stations',
		data: pointsData,
		pType: 2,
	}

/*
	var data = mrtStationLocations.map(function(record){
		var opacity = record.dupeName ? 0 : 0.8;
		var hts = [];
		var colors = [];
		passengerTypes.forEach(function(type){
			hts.push(0);
			colors.push(passengerTypeColormap[type])
		})
		return [+record.LATITUDE, +record.LONGITUDE, hts, colors, opacity];//[[lat, lon, ht, [r,g,b]], opacity, ...]
	})
	var params = {
		type: 'stackedbars',
		name: 'mrt_stations',
		data: data,
		size: 0.01,
	}
*/
	map3d.addLayer(params)
	.then(function(layer){
		pickTarget = layer;
		map3d._currentContext.addPicking(layer, onPickHovered, onPickSelected);

		var particles = layer.particles;
		if(DARKMODE)
		{
			particles.container.material.blending = THREE.AdditiveBlending;
			var a = particles.getAlphaBuffer();
			for(var i=0; i<a.length; ++i)
			{
				a[i] = 1;
			}
			particles.updateAlphas();
		}

	})
}

function selectPassengerType(type)
{
	selectedPassengerType = type;

	var color = passengerTypeColormap[selectedPassengerType];
	var particles = map3d.getLayerByName('mrt_stations').particles;
	var c = particles.getColorBuffer();
	for(var i=0; i<c.length; ++i)
	{
		c[i*3+0] = color[0];
		c[i*3+1] = color[1];
		c[i*3+2] = color[2];
	}
	particles.updateColors(300);


	if(mode == 'aggregation')
	{
		updateLayer();
	}
	else
	{
		prevTime = adax.timeKeeper.simCurrentTime - 1000;//to trigger a redraw
		gotoTime(adax.timeKeeper.simCurrentTime)
	}
}

var highlightCount = -1; // set this to highlight top N stations
var prevTime = 0;
function updateLayer2(simulatedTime){
	if(mode != 'simulation')
		return;

	var diff = Math.abs(simulatedTime - prevTime);
	if(diff < 1000)
		return;
	prevTime = simulatedTime;

	var id = 'STATION_NAME';

	//queryDataRange(tapOutData, 'timestamp', simulatedTime, simulatedTime+30*60*1000)
	queryData(tapOutData, 'timestamp', simulatedTime)
	.then(function(data){
		for(var i=0; i<mrtStationLocations.length; ++i)
		{
			var station = mrtStationLocations[i];
			if(station.dupeName)
				continue;

			passengerTypes.forEach(function(type){
				station[type+'_sim'] = 0;
			});

			for(var j=0; j<data.length; ++j)
			{
				var datum = data[j];
				if(datum[id] == station[id])
				{
					passengerTypes.forEach(function(type){
						station[type+'_sim'] += datum[type];
					});
				}
			}
		}

		/*
		var ht = [];
		var f = 100;
		mrtStationLocations.forEach(function(item){
			passengerTypes.forEach(function(type){
				ht.push(item[type+'_sim']/f);
			});
		})
		var params = {
			height: ht,
			//opacity: opacities
		}
		map3d.updateLayer('mrt_stations', params, 300)
		*/

		var f = passengerTypeFactor[selectedPassengerType];
		var particles = map3d.getLayerByName('mrt_stations').particles;
		var s = particles.getSizeBuffer();
		for(var i=0; i<s.length; ++i)
		{
			s[i] = mrtStationLocations[i][selectedPassengerType+'_sim']/f;
		}
		particles.updateSizes(300);

	})
}

function updateLayer(json){
	for(var i=0; i<mrtStationLocations.length; ++i)
	{
		passengerTypes.forEach(function(type){
			mrtStationLocations[i][type] = 0;
		})
	}

	passengerTypes.forEach(function(type){
		rData2[type].forEach(function(item){
			var name = item[0];
			var value = item[1];
			updateTapoutToLocations(name, value, type);
		});
	})


	/*
	var data = [];
	var f = 40000;//1500000.0*10
	mrtStationLocations.forEach(function(record, index){
		passengerTypes.forEach(function(type){
			data.push(record[type]/f);
		})
	})
	var params = {
		height: data,
		//opacity: opacities
	}
	*/

	var f = 400*passengerTypeFactor[selectedPassengerType];
	mrtStationLocations.forEach(function(record, index){
		pointsData[index][2] = record[selectedPassengerType]/f;
	})
	var params = {
		type: 'points',
		data: pointsData
	}
	var particles = map3d.getLayerByName('mrt_stations').particles;
	var s = particles.getSizeBuffer();
	for(var i=0; i<s.length; ++i)
	{
		s[i] = pointsData[i][2];
	}
	particles.updateSizes(300);

	//map3d.updateLayer('mrt_stations', params, 300)
}

function updateTapoutToLocations(name, value, type){
	for(var i=0; i<mrtStationLocations.length; ++i)
	{
		if(mrtStationLocations[i].STATION_NAME.indexOf(name) != -1)
		{
			mrtStationLocations[i][type] += value;
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
		//if(pickTarget.children[i] == obj)
		//	break;
		var base = pickTarget.children[i];
		var j;
		for(j=0; j<base.children.length; ++j)
		{
			if(obj == base.children[j])
				break;
		}
		if(j < base.children.length)
		{
			station = mrtStationLocations[i]
			break;
		}
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

	passengerTypes.forEach(function(type){
		if(mode == 'simulation')
			s += '<p>'+type+': ' + station[type+'_sim'] + '</p>';
		else
			s += '<p>'+type+': ' + station[type] + '</p>';
	})

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

	passengerTypes.forEach(function(type){
		if(mode == 'simulation')
			s += '<p>'+type+': ' + station[type+'_sim'] + '</p>';
		else
			s += '<p>'+type+': ' + station[type] + '</p>';
	})

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
