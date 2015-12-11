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

		this.setProjection();
		this.setView();

		this.setupPrograms();
		this.setUniforms();
		this.clearContext(0);

		//TODO: make separate buffer class
	  mainPlanet = new Entity(new vec2(0.0, 0.0, new vec2(100.0, 100.0)));

		mainPlanet.bindRenderable(this.gl, this.programs["default"])
		mainPlanet.renderable.addPrimitive(twgl.primitives.createSphereVertices(2.0, 4.0, 4.0));
		mainPlanet.finalizeBuffers(this.gl);

		console.log(mainPlanet);
		for(var i = 0; i < 10000; i++) {
			var testEntity = new Entity(new vec2(0.0, 0.0), new vec2(100.0, 100.0));
			testEntity.bindRenderable(this.gl, this.programs["default"]);
			testEntity.renderable.vao = mainPlanet.renderable.vao;
			testEntity.renderable.offset = mainPlanet.renderable.offset;
			testEntity.renderable.setCustomUniforms();
			testEntity.vel = new vec2(Math.random()*10, Math.random()*10);
			entities.push(testEntity);
		}



		return [null, this.gl];
	} else {
		return ["Specify a canvas id", null];
	};
};

Thomas.prototype.setOrtho = function() {
  var aspect = this.gl.canvas.width / this.gl.canvas.height;
  mat4.ortho(this.projectionMatrix, -aspect, aspect, -1.0, 1.0, -1.0, 100);
};

Thomas.prototype.setProjection = function() {
	var aspect = this.gl.canvas.width / this.gl.canvas.height;
	mat4.perspective(this.projectionMatrix, 30 * Math.PI / 180, aspect, 0.5, 100000000);
}

Thomas.prototype.clearContext = function() {
    twgl.resizeCanvasToDisplaySize(this.gl.canvas);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0.0, 0.7, 0.8, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.BLEND);
		// this.gl.enable(this.gl.CULL_FACE);
		// this.gl.cullFace(this.gl.BACK)
    this.gl.enable(this.gl.DEPTH_TEST);
  //  this.setOrtho();
		this.setProjection();

		this.setView();
    this.setUniforms();
};

Thomas.prototype.setupPrograms = function() {
	this.setupProgram("default", "vs-default", "fs-default");
};

Thomas.prototype.render = function() {
	this.clearContext();

	for(var i = 0; i < 10000; i++) {
		entities[i].renderable.render();
		var ent = entities[i];
		mat4.identity(entities[i].renderable.model);
		mat4.translate(entities[i].renderable.model, entities[i].renderable.model, [i/50,Math.sin(jf + i * 0.001)*10.0,i % 100]);

		entities[i].renderable.setCustomUniforms();
	}
	requestAnimationFrame(this.render.bind(this));
}
var jf = 0;
Thomas.prototype.setView = function() {
	var camX = -50.0;
	var camY = -10.0
	var camZ = -50.0;
	jf+=0.01;
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
