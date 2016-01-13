var twgl = window.twgl;
var mat4 = require('gl-matrix').mat4;
var vec3 = require('gl-matrix').vec3;
var vec2 = require("./vector2d.js");
var Renderable = require("./renderable.js");
var Entity = require("./entity.js");

function Thomas() {
	this.gl = null;
	this.programs = {};

	this.viewMatrix = mat4.create();
	this.projectionMatrix = mat4.create();

  	this.FSIZE = new Float32Array().BYTES_PER_ELEMENT;
};


var entities = [];
var mainPlanet = null;
//Creates a WebGL context bound to specified canvas id
//canvas_id: id of canvas to be used
Thomas.prototype.setup = function(canvas_id) {
	if(canvas_id) {
		this.gl = twgl.getWebGLContext(document.getElementById("c"));
		twgl.resizeCanvasToDisplaySize(this.gl.canvas);

		this.textures = {};

		this.setProjection();
		this.setView();

		this.setupPrograms();
		this.setUniforms();
		this.loadTextures();

		this.clearContext(0);

		//TODO: make separate buffer class
	  	mainPlanet = new Entity(new vec2(0.0, 0.0, new vec2(100.0, 100.0)));

		mainPlanet.createRenderable(this.gl, this.programs["default"])
		mainPlanet.renderable.addPrimitive(twgl.primitives.createSphereVertices(1.0, 32.0, 32.0));
		
		mainPlanet.renderable.applyCustomUniforms([
			["tex", this.textures.earth]
		]);
	
		mainPlanet.renderable.setCustomUniforms();
		mainPlanet.finalizeBuffers(this.gl);

		for(var i = 0; i < 10; i++) {
			var testEntity = new Entity(new vec2(0, 0), new vec2(100.0, 100.0));
			testEntity.bindRenderable(mainPlanet.renderable);
			entities.push(testEntity);
		}


		return [null, this.gl];
	} else {
		return ["Specify a canvas id", null];
	};
};

Thomas.prototype.setOrtho = function() {
  var aspect = this.gl.canvas.width / this.gl.canvas.height;
  mat4.ortho(this.projectionMatrix, -aspect, aspect, -1.0, 1.0, -1.0, 1000000);
};

Thomas.prototype.setProjection = function() {
	var aspect = this.gl.canvas.width / this.gl.canvas.height;
	mat4.perspective(this.projectionMatrix, 30 * Math.PI / 180, aspect, 0.5, 100000000);
};

Thomas.prototype.loadTextures = function() {
	var gl = this.gl;
	this.textures = twgl.createTextures(gl, {
		earth: {
			src: "images/earth.jpg",
			mag: gl.NEAREST
		},
		earthnight: {
			src: "images/earth_at_night.jpg",
			mag: gl.NEAREST
		}
	});
}

Thomas.prototype.clearContext = function() {
    twgl.resizeCanvasToDisplaySize(this.gl.canvas);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.BLEND);

    this.gl.enable(this.gl.DEPTH_TEST);
    //this.setOrtho();
	this.setProjection();

	this.setView();
    this.setUniforms();
};

Thomas.prototype.setupPrograms = function() {
	this.setupProgram("default", "vs-default", "fs-default");
};

Thomas.prototype.render = function() {
	this.clearContext();


	for(var i = 0; i < 3; i++) {
		entities[i].renderable.render();
		var ent = entities[i];
		mat4.identity(entities[i].renderable.model);

		// ent.vel.x = Math.cos(i + jf) * 5;
		// ent.vel.y = Math.sin(i + jf) * 5;
		// ent.position.x = ent.vel.x;
		// ent.position.y = ent.vel.y;

		mat4.translate(entities[i].renderable.model, entities[i].renderable.model, [ent.position.x, 0, ent.position.y]);
		mat4.rotateY(entities[i].renderable.model, entities[i].renderable.model, jf);
		//mat4.rotateZ(entities[i].renderable.model, entities[i].renderable.model, jf*2);
		//mat4.rotateX(entities[i].renderable.model, entities[i].renderable.model, jf*2);

		entities[i].renderable.setCustomUniforms();
	}

	requestAnimationFrame(this.render.bind(this));
}
var jf = 0;
Thomas.prototype.setView = function() {
	var camX = 0.0;
	var camY = 0.0
	var camZ = 10.0;
	jf += 0.01;
	mat4.lookAt(this.viewMatrix, [camX, camY, camZ], [0,0,0], [0,1,0]);
}

Thomas.prototype.setupProgram = function(name, vs, fs) {
	this.programs[name] = twgl.createProgramInfo(this.gl, [vs, fs]);
};

Thomas.prototype.resizeScreen = function(w, h) {

};

Thomas.prototype.setUniforms = function() {
	for(var prog in this.programs) {
		var program = this.programs[prog].program;
		this.gl.useProgram(program);

		var u_projection = this.gl.getUniformLocation(program, 'u_projection');
		this.gl.uniformMatrix4fv(u_projection, false, this.projectionMatrix);

		var u_view = this.gl.getUniformLocation(program, 'u_view');
		this.gl.uniformMatrix4fv(u_view, false, this.viewMatrix);
	};
};

Thomas.prototype.setupScene = function() {

};

module.exports = Thomas;
