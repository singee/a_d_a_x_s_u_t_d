		///////////////////////////////////////////////////////
		// sidebar helpers
		// sidebar.css
		// animate.css
		var sidebarWrapperId = '#sidebar-wrapper';
		var menuEffect = 'slide';
		var closeSidebar = function()
		{
			//console.log('closeSidebar');
			var o = document.querySelector(sidebarWrapperId);
			if(!o)
				return;
			o.classList.add('animated');
			o.classList.remove(menuEffect + 'InLeft');
			o.classList.add(menuEffect + 'OutLeft');

			var b = document.querySelector(rootBlockId);
			b.style.left = '0px';
		}
		var openSidebar = function()
		{
			//console.log('openSidebar');
			var o = document.querySelector(sidebarWrapperId);
			if(!o)
				return;
			o.classList.add('animated');
			o.classList.remove(menuEffect + 'OutLeft');
			o.classList.add(menuEffect + 'InLeft');

			var b = document.querySelector(rootBlockId);
			b.style.left = o.offsetWidth*0.5 + 'px';
		}
		var toggleSidebar = function()
		{
			var o = document.querySelector(sidebarWrapperId);
			if(!o)
				return;
			if(o.classList.contains(menuEffect + 'InLeft'))
				closeSidebar();
			else
				openSidebar();
		}
		// sidebar helpers
		///////////////////////////////////////////////////////

		///////////////////////////////////////////////////////
		// loading screen helpers
		// loading.css
		// animate.css
		var loadingId = '.spinner';
		var loadingStart = function()
		{
			var o = document.querySelector(loadingId);
			if(o)
			{
				o.classList.add('animated');
				o.classList.remove('fadeOutUp');
				o.classList.add('fadeInDown');
			}
			return Promise.resolve();
		}
		var loadingDone = function()
		{
			var o = document.querySelector(loadingId);
			if(o)
			{
				o.classList.add('animated');
				o.classList.remove('fadeInDown');
				o.classList.add('fadeOutUp');
			}
			return Promise.resolve();
		}
		// loading screen helpers
		///////////////////////////////////////////////////////


		///////////////////////////////////////////////////////
		// login helpers
		document.getElementById('passwordInput').onkeypress = function(e) {
			var event = e || window.event;
			var charCode = event.which || event.keyCode;

			if ( charCode == '13' ) {
				// Enter pressed
				processLogin();
				return false;
			}
		}
		var useLogin = true;
		var processLogin = function()
		{
			if(!useLogin)
			{
				login();
				return;
			}

			var n = document.getElementById('nameInput');
			var p = document.getElementById('passwordInput');
			console.log(n.value, p.value);
			if(dataAPI)
			{
				var scope = '';
				dataAPI.login(n.value, p.value, scope)
				.then(function(result){
					console.log(result);
					if(!result.error)
						login();
					else
					{
						loginShake();
					}
				})
			}
			else
			{
				console.log('no data API client');
			}
		}

		var isLoggedIn = function()
		{
			if(!useLogin)
				return true;
			if(dataAPI && dataAPI.getConfig().authKV.Authorization.indexOf('LOGIN')==-1)
				return true;
			return false;
		}

		var loginShake = function()
		{
			var o = document.querySelector(loginId);
			o.addEventListener('animationend', loginShakeDone);
			o.classList.add('animated');
			o.classList.add('shake');
		}
		var loginShakeDone = function(){
			console.log('shake end');
			var o = document.querySelector(loginId);
			o.removeEventListener('animationend', loginShakeDone);
			o.classList.remove('shake');
		}

		var login = function()
		{
			var o = document.querySelector(loginId);
			o.addEventListener('animationend', loginDone);
			o.classList.add('animated');
			o.classList.add('bounceOutUp');
			//document.body.style.overflow = 'hidden';
		}
		var loginDone = function(){
			console.log('login end');
			doBlur(false);
			var o = document.querySelector(loginId);
			o.removeEventListener('animationend', loginDone);
			//document.body.style.overflow = 'auto';

			if(onLogin)
				onLogin();
		}
		var logout = function()
		{
			doBlur(true);
			var o = document.querySelector(loginId);
			o.addEventListener('animationend', logoutDone);
			o.classList.add('animated');
			o.classList.remove('bounceOutUp');
			o.classList.add('bounceInDown');
			//document.body.style.overflow = 'hidden';
		}
		var logoutDone = function(){
			console.log('logout end');
			var o = document.querySelector(loginId);
			o.removeEventListener('animationend', logoutDone);
			o.classList.remove('bounceInDown');
			//document.body.style.overflow = 'auto';

			if(onLogout)
				onLogout();
		}

		var doBlur = function(flag)
		{
			var o = document.querySelector(contentBlockId);
			var b = document.querySelector(blockerId);
			if(flag)
			{
				o.classList.remove('unblur');
				o.classList.add('blur');
				b.style.display = 'block';
			}
			else
			{
				o.classList.remove('blur');
				o.classList.add('unblur');
				b.style.display = 'none';
			}
		}

		// login helpers
		///////////////////////////////////////////////////////

		///////////////////////////////////////////////////////
		// layers menu helpers
		var openLayersMenu = function()
		{
			var o = document.querySelector(layersMenuId);
			if(!o)
				return;
			o.classList.add('animated');
			o.classList.remove('slideOutRight');
			o.classList.add('slideInRight');
		};
		var closeLayersMenu = function()
		{
			var o = document.querySelector(layersMenuId);
			if(!o)
				return;
			o.classList.add('animated');
			o.classList.remove('slideInRight');
			o.classList.add('slideOutRight');
		};

		var toggleLayersMenu = function()
		{
			var o = document.querySelector(layersMenuId);
			if(!o)
				return;
			if(o.classList.contains('slideInRight'))
				closeLayersMenu();
			else
				openLayersMenu();
		};

		var onLayerAdded = function(layer){
			var o = document.querySelector(layersMenuListId);
			if(!o)
				return;

			var cmd = 'toggleLayer(\'' + layer.name + '\');';
			var iconspan = '<span id="layer-item-icon-' + layer.name + '" class="glyphicon glyphicon-ok" style="padding-right:1em;"></span>';

			var s = '<li class="list-group-item" id="layer-item-'+layer.name+'" onclick="'+cmd+'"><span style="cursor:context-menu;">'+iconspan+layer.name+'</span></li>';
			console.log(s);
			var div = document.createElement('div');
			div.innerHTML = s;
			var element = div.firstChild;
			o.appendChild(element);
		};
		var toggleLayer = function(layername){
			var o = map3d.getLayerByName(layername);
			if(!o)
				return;
			o.visible = !o.visible;
			var icon = document.querySelector('#layer-item-icon-'+layername);
			var chart = document.querySelector('#'+layername+'-chart');
			if(o.visible)
			{
				icon.classList.add('glyphicon-ok');
				icon.classList.remove('glyphicon-ban-circle');
				if(chart)
				{
					chart.classList.add('animated');
					chart.classList.remove('slideOutDown');
					chart.classList.add('slideInUp');
				}
			}
			else
			{
				icon.classList.remove('glyphicon-ok');
				icon.classList.add('glyphicon-ban-circle');
				if(chart)
				{
					chart.classList.add('animated');
					chart.classList.add('slideOutDown');
					chart.classList.remove('slideInUp');
				}
			}
		};

		// layers menu helpers
		///////////////////////////////////////////////////////

