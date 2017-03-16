		var info = {
			host: 'localhost',
			origin: 'http://localhost:3000',
			protocol: 'http:',
			port: '3000',
			search: '',
		};
		fillInfo(info);

		//info.host = '10.217.133.188';// ****** set this to point to A*DAX

		var config = {
			base: 'ws://'+info.host+':3000',
			token: 'demo00',
		};
		var adax = Adax.clientFactory(config);
		var dataAPI = adax.dataAPI;
		var map3d = adax.m3;
		var map2d = adax.m2;
		var chart = adax.chart;
		var dataTool = adax.dataTool;

		dataAPI.getConfig().ip = info.host;
		dataAPI.getConfig().apim = 'http://'+info.host+':8082';// AWS - 8082, default - 8280
		var tileServer = 'http://'+info.host+':4000';

		var bumpFile0 = 'data/sg-terrain4.png';
		var mapFile = 'data/SingaporeMapHD2.png';

		var loginId = '.login-page';
		var blockerId = '#blocker';
		var contentBlockId = '#wrapper';
		var rootBlockId = '#page-content-wrapper';
		var mainBlockId = '#block1';
		var sidebarId = '.sidebar-nav';
		var slot1Id = '#slot1';
		var slot2Id = '#slot2';
		var slot3Id = '#slot3';
		var slot4Id = '#slot4';
		var layersMenuId = '#layers-menu';
		var layersMenuListId = '#layers-menu-list';

		var timeline;
		var timelineId = '#timeline';

		var mode = 'aggregation';


		document.onkeyup = function (e) { 
			e = e || window.event; 
			var charCode = e.charCode || e.keyCode, 
					character = String.fromCharCode(charCode);
			var key = character.toLowerCase();
			if(e.shiftKey)
				key = character;
			if(isLoggedIn())
				onKeyPressed(key, e.ctrlKey);
		};

		// from slim scrollbar examples
		$(function(){
			/*
			$('.sidebar-nav').slimScroll({
				height: 'auto',
				allowPageScroll: true,
			});
			*/

			$('#sidebar-wrapper .menu .item').tab({context: '#sidebar-wrapper'});
		});

		window.addEventListener( 'resize', function(e){
			onResize();
		}, false );

		function onResize()
		{
			chart.onResize(specs);
			chart.onResize(specs2);
		}

		document.addEventListener( "DOMContentLoaded", function(){
			closeSidebar();
			closeLayersMenu();
			closeTimeline();
			loadingDone();
			logout();
			update();
			//setup();
		});

		var onLogin = function(){
			if(!map3d._currentContext)
			{
				loadModules()
				.then(setup)
				.then(function(){
					adax.timeKeeper.observer.subscribe(updateLayer2, window)
				})
			}
		}
		var onLogout = function(){
		}

		var loadModules = function(){
			return loadDataOps()
			.then(loadTimeline)
			.then(loadLayerOps)
			.then(loadChartOps)
		}
		var loadTimeline = function(){
			return adax.require('js/timeline')
		}
		var loadDataOps = function(){
			return adax.require('js/data-ops')
		}
		var loadLayerOps = function(){
			return adax.require('js/layer-ops')
		}
		var loadChartOps = function(){
			return adax.require('js/chart-ops')
		}


		var setup = function(){
			return loadingStart()
			.then(init)
			.then(getMRTLocations)
			.then(getMRTNames)
			.then(addMRTLineToLocation)
			.then(addMRTLayer)
			.then(addMRTCharts)
			.then(resetView)
			.then(getTimeRange)
			.then(streamTapOutData)
			.then(loadingDone)
			// this is a catch all for any errors along the way
			.catch(function(err){
				console.log(err);
				loadingDone();
			})
		};

		var init = function()
		{
			map3d.onLayerAdded = onLayerAdded; // misc.js, layers menu helpers
			var container = document.querySelector(mainBlockId);
			return map3d.init(adax, container, 'data/sg0.json')
			.then(function(){
				return map3d.setBaseMap(mapFile, bumpFile0)
			})
		}

		var resetView = function(){
			//map3d._currentContext.controls.target.set(0,0,-0.2);
			return map3d.flyTo(8, 0, 2000)
		};

		var update = function(){
			requestAnimationFrame(update);
			adax.update();
		};










////////////////////////////////////////////////
// Other operations
////////////////////////////////////////////////

function makeSignage(){
	var el = document.createElement('div');
	el.classList.add('signage');
	var s = 'no info';
	el.innerHTML = s;
	var signage = new THREE.CSS3DObject(el);
	signage.scale.multiplyScalar(0.0005);
	signage.position.z += 0.1;
	return signage;
}



function openTimeline()
{
	var o = document.querySelector(timelineId);
	if(!o)
		return;
	o.classList.add('animated');
	o.classList.add(menuEffect + 'InRight');
	o.classList.remove(menuEffect + 'OutRight');
}
function closeTimeline()
{
	if(timeline)
		timeline.pause();
	var o = document.querySelector(timelineId);
	if(!o)
		return;
	o.classList.add('animated');
	o.classList.remove(menuEffect + 'InRight');
	o.classList.add(menuEffect + 'OutRight');
}

function setMode(m)
{
	if(mode == m)
		return;

	// rollback current mode...?

	mode = m;
	switch(mode)
	{
	case 'aggregation':
		closeTimeline();
		updateLayer();
	break;
	case 'simulation':
		openTimeline();
		prevTime = adax.timeKeeper.simCurrentTime - 1;//to trigger a redraw
		gotoTime(adax.timeKeeper.simCurrentTime)
	break;
	default:
	break;
	}
}

function gotoTime(time)
{
	adax.timeKeeper.setCurrentTime(moment(time).valueOf())
}
function setHighlightCount(n)
{
	// -1 to highlight all
	highlightCount = n;
	if(mode == 'aggregation')
		updateLayer();
	else
	{
		prevTime = adax.timeKeeper.simCurrentTime - 1;//to trigger a redraw
		updateLayer2(adax.timeKeeper.simCurrentTime);
	}
}

// binding functions to keypresses
// for quick demos/debug
var onKeyPressed = function(key, ctrlKey){
	console.log(key, ctrlKey);

	// first row
	if(key == 'q')
	{
	}
	else if(key == 'w')
	{
	}

	else if(key == 'z')
	{
		setMode('aggregation');
	}
	else if(key == 'x')
	{
		setMode('simulation');
	}

	// examples to highlight top N stations
	else if(key == 'a')
	{
		setHighlightCount(10);
	}
	else if(key == 's')
	{
		setHighlightCount(-1);
	}

	else if(key == 'd')
	{
		gotoTime('2016-03-11 18:31:00');
	}
	else if(key == 'f')
	{
		gotoTime('2016-03-10 08:32:00');
	}

};
