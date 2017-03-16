////////////////////////////////////////////////
// 3D Layer operations
////////////////////////////////////////////////

function addLayers(){
	return Promise.resolve()
	.then(addPlanningAreaLayer)
	.then(addODLayer)
}

function addPlanningAreaLayer(){
	// custom layer
	var projection = map3d._currentContext.projection0;
	var layer = new THREE.Object3D();
	layer.name = 'planning_area';
	makePlanningAreas(layer, planningAreaNames, projection)
	layer.position.z = 0.0025;
	map3d.addAsLayer(layer);
	pickTarget = layer;
	map3d._currentContext.addPicking(layer, onPickHovered, onPickSelected);
	return layer;
}

function makePlanningAreas(parent, data, projection)
{
	// data = { name1: pa1, name2: pa2, ... }
	// pa = { index1: points1, index2: points2  }
	// points = [ [lat, lng], ... ]

	for(var key in data) // { name1: pa1, name2: pa2, ... }
	{
		var pa3d = new THREE.Object3D();
		parent.add(pa3d);
		pa3d.name = key;
		var pa = data[key]; // { index1: points1, index2: points2  }
		var pamin = [1000000, 1000000];
		var pamax = [-1000000, -1000000];
		var color = new THREE.Color(Math.random()*0xffffff);
		pa3d.color = color;
		for(var index in pa)
		{
			var subgroup = pa[index]; // [ [lat, lng], ... ]
			var submin = [1000000, 1000000];
			var submax = [-1000000, -1000000];
			var points = subgroup.map(function(point){
				var p = projection(point[0], point[1])
				if(submin[0] > p[0])
					submin[0] = p[0]
				if(submin[1] > p[1])
					submin[1] = p[1]
				if(submax[0] < p[0])
					submax[0] = p[0]
				if(submax[1] < p[1])
					submax[1] = p[1]
				return p;
			})
			if(pamin[0] > submin[0])
				pamin[0] = submin[0]
			if(pamin[1] > submin[1])
				pamin[1] = submin[1]
			if(pamax[0] < submax[0])
				pamax[0] = submax[0]
			if(pamax[1] < submax[1])
				pamax[1] = submax[1]

			var subcentroid = [(submax[0]+submin[0])*0.5, (submax[1]+submin[1])*0.5]
			points.forEach(function(point){
				point[0] -= subcentroid[0];
				point[1] -= subcentroid[1];
			})

			var subgroup3d = makeOutline(points, 0xffffff);//color);
			if(subgroup3d)
			{
				subgroup3d.name = index;
				pa3d.add(subgroup3d);
				subgroup3d.position.x = subcentroid[0];
				subgroup3d.position.y = subcentroid[1];
			}

			var shape = makeShape(points, color);
			if(shape)
			{
				shape.name = index + '_shape';
				subgroup3d.add(shape);
			}
			else
			{
				console.log('failed', points, index, key)
			}

		}

		var pacentroid = [(pamax[0]+pamin[0])*0.5, (pamax[1]+pamin[1])*0.5]

		pa3d.position.x = pacentroid[0];
		pa3d.position.y = pacentroid[1];
		pa3d.children.forEach(function(subgroup3d){
			subgroup3d.position.x -= pacentroid[0];
			subgroup3d.position.y -= pacentroid[1];
		})

	}
}

function getRegionInfo(obj)
{
	var region = null;
	var i;
	for(i=0; i<pickTarget.children.length; ++i)
	{
		if(pickTarget.children[i] == obj)
			break;
	}
	if(i < pickTarget.children.length)
	{
		region = planningAreaNames[i]
	}
	return region;
}

function makeShape(points, color)
{
	// triangulation might fail sometimes...
	var mesh = null;
	try{
		var material = new THREE.MeshBasicMaterial({
			color: color,
			transparent: true,
			opacity: 0.125,
			//blending: THREE.AdditiveBlending,
			blending: THREE.NormalBlending,
			//blending: THREE.SubtractiveBlending,
			//blending: THREE.MultiplyBlending,

		});
		var shape = new THREE.Shape();
		shape.moveTo(points[0][0], points[0][1]);
		for(var k=1; k<points.length; ++k)
		{
			shape.lineTo(points[k][0], points[k][1]);
		}
		var geom = new THREE.ShapeGeometry(shape);
		mesh = new THREE.Mesh(geom, material);
	}
	catch(err){
		console.log(err);
	}

	return mesh;
};
function makeOutline(points, color)
{
	var mesh = null;
	var material = new THREE.LineBasicMaterial({
		color: color,
		transparent: true,
		opacity: 0.5,
		blending: THREE.AdditiveBlending,
		//blending: THREE.NormalBlending,
		linewidth: 10,
	});
	var geom = new THREE.Geometry();
	points.forEach(function(point){
		geom.vertices.push( new THREE.Vector3( point[0], point[1], 0 ) );
	})
	geom.vertices.push( new THREE.Vector3( points[0][0], points[0][1], 0 ) );
	mesh = new THREE.Line(geom, material);

	return mesh;
};


function addODLayer(layer){
	var paths = new Paths();
	layer.paths = paths;
	return paths.init(layer)
	.then(function(){
		//data: [[lat, lon, ht, [r,g,b]], opacity, ...]
		var data = [];
		var params = {
			type: 'bars',
			name: 'blocks',
			data: data,
			//size: 0.01,
		};
		return map3d.addLayer(params)
	})
	.then(function(l){
		l.projection = function(x, y){return [x, y]}
		layer.blocks = l;
		//	[[lat, lon, ht, [r,g,b]], ...]
		var ht = 0.01;
		var data = [];
		layer.children.forEach(function(pa){
			data.push([pa.position.x, pa.position.y, ht, [pa.color.r,pa.color.g,pa.color.b]]);
		})

		var params = {
			type: 'bars',
			data: data,
		};
		map3d.addToLayer(l, params);
	})
}

var prevTime;
function updateLayer2(simulatedTime){
	if(mode != 'simulation')
		return;
	if(prevTime == simulatedTime)
		return;
	prevTime = simulatedTime;

	var id = 'STATION_NAME';

	//queryDataRange(odData, 'timestamp', simulatedTime, simulatedTime+30*60*1000)
	queryData(odData, 'timestamp', simulatedTime)
	.then(function(data){
	})
}

function getPlanningAreaByName(layer, name)
{
	for(var i=0; i<layer.children.length; ++i)
	{
		if(name.indexOf(layer.children[i].name) >= 0)
			return layer.children[i];
	}
	return null;
}
function setODs(layer, origin, direction)
{
	layer.paths.setAnimate(false);
	layer.paths.reset();
	adax.wait(2000)
	.then(function(){
		var hts = [];
		var originMesh = getPlanningAreaByName(layer, origin);
		var startR = startRegions[origin];
		if(!startR)
		{
			return;
		}
		layer.children.forEach(function(pa){
			var v = 0;
			if(pa.name in startR)
				v = startR[pa.name]/maxN;
			else
			{
				console.log('not in', pa.name)
			}
			hts.push(v);
			
			layer.paths.add(originMesh.position, pa.position, pa.color, v, false);
		})
		layer.paths.updateAll(300);
		layer.paths.setAnimate(true);

		var params = {
			type: 'bars',
			name: 'blocks',
			height: 10,
		};
		return map3d.updateLayerObject(layer.blocks, params, 300)

	})
}


function updateLayer(json){
}

var makeSignage = function(obj){
	var el = document.createElement('div');
	el.classList.add('signage');
	//var region = getRegionInfo(obj);
	var s = "";
	el.innerHTML = s;
	var signage = new THREE.CSS3DObject(el);
	signage.scale.multiplyScalar(0.001);
	signage.position.copy(obj.position);
	signage.position.z += 0.2;
	map3d._currentContext._cssbillboard.add(signage);
	return signage;
};

var fillSignage = function(signage, obj, regionN){
	var s = formatInfo(regionN);
	//var s ="testing";
	signage.innerHTML = s;
};




var pickTarget = null;
var prev = null;
var prevSelected = null;
var selectedList = [];//multi-select

function onPickHovered(obj, point, picked, x, y){
	if(!obj || obj!=prev)
	{
		if(prev)
		{
		/*
			var signage = document.querySelector('.signage');
			if(signage)
				signage.classList.remove('highlight'); */
			unhighlight(prev)
			prev = null;
		}
	}
	if(!obj)
		return true;

	if(!map3d.isRelated(pickTarget, obj))
		return false;
	if(obj.name.indexOf('_shape') == -1)
		return false;

	if(obj!=prev)
	{
		if(prev)
			unhighlight(prev)
		prev = obj;
		highlight(prev)
	}
	if(obj)
	{
		var hovered = obj.parent;
		if(hovered != prev)
		{
			prev = hovered;
			var signage = document.querySelector('.signage');
			if(signage)
			{
				

				fillSignage(signage, prev, obj.parent.parent.name);
				var p = new THREE.Vector3(0, 0, 1);
				var pos = map3d.toScreenPosition(p, prev);
				var xx = Math.max(pos.x-signage.offsetWidth, 0);
				var yy = Math.max(pos.y-signage.offsetHeight, 60);
				//var xx = Math.max(pos.x-10, 0);
				//var yy = Math.max(pos.y, 90);
				signage.style.left = xx + 'px';
				signage.style.top = yy + 'px';
				signage.classList.add('highlight');
			}
		}
	}
	return true;
}
function onPickSelected(obj, point, picked, x, y){
	if(!obj || obj!=prevSelected)
	{
		if(prevSelected)
		{
			unhighlight(prevSelected)
			prevSelected = null;
		}
	}
	if(!obj)
		return true;

	if(!map3d.isRelated(pickTarget, obj))
		return false;
	if(obj.name.indexOf('_shape') == -1)
		return false;

	if(obj!=prevSelected)
	{
		if(prevSelected)
			unhighlight(prevSelected)
		prevSelected = obj;
		console.log('selected', obj)
		//setOD(map3d.getLayerByName('planning_area'), 'ANG MO KIO', obj.parent.parent.name, Math.round(100*Math.random()), obj.material.color)
		setODs(map3d.getLayerByName('planning_area'), obj.parent.parent.name, 0)
		highlight(prevSelected)
	}
	return true;

}

function highlight(obj)
{
	var o = obj;
	//console.log('highlight', o.name, obj.name)
	animateOpacity(o, 0.9, 300)
}
function unhighlight(obj)
{
	var o = obj;
	//console.log('unhighlight', o.name, obj.name)
	animateOpacity(o, 0.425, 300)
}
var colorFactor = 400;//255;

function formatInfo(region)
{
	var color = new THREE.Color(Math.random()*0xffffff);
	var r = Math.round(color[0]*colorFactor);
	var g = Math.round(color[1]*colorFactor);
	var b = Math.round(color[2]*colorFactor);
	var cc = complement(r, g, b);
	var cs = 'background:rgb('+r+','+g+','+b +'); color:rgb('+cc[0]+','+cc[1]+','+cc[2] +');';
	//console.log(cs);

	var s = '<div class="panel panel-default">';
	s += '<div class="panel-heading" style="'+cs+'">' + region + '</div>';
	var count = startRegions[region];

	s += '<div class="panel-body">';
	for (var key in count) {
		if (count.hasOwnProperty(key)) {
				s += '<p style="font-size:8px">' +  key+'->'+count[key] + '</p>';
		}
	}
	s += '</div>';

	//s += '<div class="panel-heading" style="'+cs+'">' + region + '</div>';
	
	s += '</div>';

	return s;
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

function animateOpacity(mesh, opacity, duration)
{
	var oopacity = mesh.material.opacity;
	var tween = new TWEEN.Tween({v:0})
	.to( {v:1}, duration )
	.easing( TWEEN.Easing.Cubic.Out )
	.onUpdate(function(){
		var progress = this.v;
		mesh.material.opacity = oopacity + progress*(opacity - oopacity) ;
	})
	.onComplete(function(){
	})
	.start();
}
