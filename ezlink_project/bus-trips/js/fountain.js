function Fountain(parent, pos, value, color){
	var f = 100;
	var spread = 5;

	this.container = new THREE.Object3D();
	this.container.scale.set(1/f, 1/f, 1/f);
	parent.add(this.container);

	var dist = pos.length();

	this.shadow = new SPE.Group({
		texture: {
			value: THREE.ImageUtils.loadTexture('data/smokeparticle.png')
		}
	});
	this.shadow.addEmitter( new SPE.Emitter({
		maxAge: {
			value: 1
		},
		position: {
			value: new THREE.Vector3(0, 0, 0),
			spread: new THREE.Vector3( 1, 1, 0 )
		},

		acceleration: {
			value: new THREE.Vector3(0, 0, 0),
			spread: new THREE.Vector3( spread, spread, 0 )
		},

		velocity: {
			value: new THREE.Vector3(pos.x*f, pos.y*f, 0),
			spread: new THREE.Vector3(spread, spread, 0)
		},

		color: {
			value: [ new THREE.Color('#333') ]
		},

		size: {
			value: 0.05
		},

		particleCount: Math.round(value*0.5)
	}) );
	this.shadow.mesh.position.set(0, 0, 1)
	this.shadow.mesh.material.blending = THREE.SubtractiveBlending;
	this.container.add(this.shadow.mesh)


	this.particles = new SPE.Group({
		texture: {
			value: THREE.ImageUtils.loadTexture('data/smokeparticle.png')
		}
	});
	this.particles.addEmitter( new SPE.Emitter({
		maxAge: {
			value: 1
		},
		position: {
			value: new THREE.Vector3(0, 0, 0),
			spread: new THREE.Vector3( 1, 1, 0 )
		},

		acceleration: {
			value: new THREE.Vector3(0, 0, -1.0*dist*f),
			spread: new THREE.Vector3( spread, spread, 0 )
		},

		velocity: {
			value: new THREE.Vector3(pos.x*f, pos.y*f, dist*f),
			spread: new THREE.Vector3(spread, spread, 0)
		},

		color: {
			value: [ new THREE.Color('white'), color ]
		},

		size: {
			value: 0.05
		},

		particleCount: value
	}) );
	this.particles.mesh.material.blending = THREE.AdditiveBlending;
	this.container.add(this.particles.mesh)

}

Fountain.prototype = {
	constructor: Fountain,
}

