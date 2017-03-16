function Paths(){
}

Paths.prototype = {
	constructor: Paths,

	init: function(parent, ppp){
		var self = this;
		self.pa = parent;
		self.pointsPerPath = ppp || 100;
		var params = {
			type: 'points',
			max: self.pointsPerPath * parent.children.length * 2,
			name: 'paths',
		};
		return map3d.addLayer(params)
		.then(function(layer){
			self.layer = layer;
			layer.paths = self;
			self.layer.projection = function(x, y){ return [x, y] }
			self.reset();
			return layer;
		})
	},

	paths: [],
	sFactor: 100,

	reset: function(){
		var self = this;
		self.paths = [];
		var particles = self.layer.particles;
		var a = particles.getAlphaBuffer();
		for(var i=0; i<a.length; ++i)
			a[i] = 0;
		particles.updateAlphas(300);
	},

	add: function(src, dst, color, value, updateNow){
		var self = this;
		var path = [src, dst, color, value];
		self.paths.push(path);

		var dist = src.distanceTo(dst);
		var ht = dist/2;
		var p0 = new THREE.Vector3(src.x, src.y, src.z);
		var p1 = new THREE.Vector3((src.x+dst.x)/2, (src.y+dst.y)/2, ht);
		var p2 = new THREE.Vector3(dst.x, dst.y, dst.z);
		var curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
		var points = curve.getSpacedPoints(self.pointsPerPath -1);
		//var points = curve.getPoints(self.pointsPerPath -1);

		var particles = self.layer.particles;
		var pos = particles.getPositionBuffer();
		var c = particles.getColorBuffer();
		var s = particles.getSizeBuffer();
		var a = particles.getAlphaBuffer();
		var sz = 2;
		var start = (self.paths.length - 1)*self.pointsPerPath;
		for(var i=0; i<self.pointsPerPath; ++i)
		{
			var index = start + i;
			pos[index*3+0] = points[i].x;
			pos[index*3+1] = points[i].y;
			pos[index*3+2] = points[i].z;
			s[index] = sz;
			c[index*3+0] = color.r;
			c[index*3+1] = color.g;
			c[index*3+2] = color.b;
			a[index] = 0;

			var sindex = start + i + a.length/2;
			pos[sindex*3+0] = points[i].x;
			pos[sindex*3+1] = points[i].y;
			pos[sindex*3+2] = 0;
			s[sindex] = sz;
			c[sindex*3+0] = 0;
			c[sindex*3+1] = 0;
			c[sindex*3+2] = 0;
			a[sindex] = 0;
		}

		if(updateNow)
		{
			particles.updatePositions();
			particles.updateColors();
			particles.updateAlphas();
			particles.updateSizes();
		}
	},

	updateAll: function(duration){
		var self = this;
		duration = duration || 0;
		var particles = self.layer.particles;
		var pos = particles.getPositionBuffer();
		var c = particles.getColorBuffer();
		var s = particles.getSizeBuffer();
		var a = particles.getAlphaBuffer();

		particles.updatePositions(duration);
		particles.updateColors(duration);
		particles.updateAlphas(duration);
		particles.updateSizes(duration);
	},

	animate: function(){
		var self = this;
		if(!self.animating)
			return Promise.resolve()

		return Promise.resolve()
		.then(self.animatePaths.bind(self))
		.then(self.animateEnds.bind(self))
		.then(function(){
			return adax.wait(2000)
		})
		.then(self.animate.bind(self))
	},

	animatePaths: function(){
		var self = this;
		return new Promise(function(resolve, reject){
			var particles = self.layer.particles;
			var s = particles.getSizeBuffer();
			var a = particles.getAlphaBuffer();

			var duration = 1000;
			var tween = new TWEEN.Tween({v:0})
			.to( {v:1}, duration )
			//.easing( TWEEN.Easing.Cubic.Out )
			.onUpdate(function(){
				if(!self.animating)
					tween.stop();
				var progress = this.v;
				var ci = Math.round(self.pointsPerPath*progress);
				self.paths.forEach(function(path, index){
					var value = path[3];//[src, dst, color, 1]
					if(value > 0)
					{
						var pi = index*self.pointsPerPath;
						for(var i=0; i<self.pointsPerPath; ++i)
						{
							var sz;
							var alpha;
							if(i > ci)
							{
								// ahead
								sz = 2;
								alpha = 0.5;
							}
							else if(i == ci)
							{
								sz = self.sFactor*value;
								alpha = 0.8;
							}
							else
							{
								if(ci-i <= 0)
								{
									sz = 2;
									alpha = 0.5;
								}
								else
								{
									sz = 2 + self.sFactor*value/(ci-i)
									alpha = 0.5 + 0.55*value/(ci-i)
								}
							}
							s[pi+i] = sz;
							a[pi+i] = alpha;

							s[pi+i + a.length/2] = sz*0.75;
							a[pi+i + a.length/2] = alpha*0.2;
						}
					}
				})
				particles.updateSizes();
				particles.updateAlphas();
			})
			.onComplete(function(){
				resolve();
			})
			.start();
		})
	},

	animateEnds: function(){
		var self = this;
		return new Promise(function(resolve, reject){
			var particles = self.layer.particles;
			var s = particles.getSizeBuffer();
			var a = particles.getAlphaBuffer();

			var duration = 300;
			var tween = new TWEEN.Tween({v:0})
			.to( {v:1}, duration )
			//.easing( TWEEN.Easing.Cubic.Out )
			.onUpdate(function(){
				if(!self.animating)
					tween.stop();
				var progress = this.v;
				self.paths.forEach(function(path, index){
					var value = path[3];//[src, dst, color, 1]
					if(value > 0)
					{
						var pi = index*self.pointsPerPath;
						a[pi+self.pointsPerPath-1] = 1*(1 - progress);
						s[pi+self.pointsPerPath-1] = self.sFactor*value + 10*progress;
					}
				})
				particles.updateSizes();
				particles.updateAlphas();
			})
			.onComplete(function(){
				resolve();
			})
			.start();
		})
	},

	setAnimate: function(flag){
		if(this.animating == flag)
			return;
		
		this.animating = flag;
		if(this.animating)
			this.animate();
	},
}

