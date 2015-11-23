var twgl = window.twgl;
var mat4 = require('gl-matrix').mat4;
var vec3 = require('gl-matrix').vec3;
var vec2 = require("./vector2d.js");
var renderable = require("./renderable.js");

var heightmap = require("./heightmap_1.js");
var terrain = require("./terrain.js");

function Thomas() {
	this.gl = null;
	this.programs = {};

	this.viewMatrix = mat4.create();
	this.projectionMatrix = mat4.create();

  this.FSIZE = new Float32Array().BYTES_PER_ELEMENT;
};


var testTerrain = null;
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

		var hite = [];
		for(var x = 0; x < 200; x++) {
			hite[x] = [];
			for(var y = 0; y < 200; y++) {
				hite[x][y] = Math.sin(x) * 100;
			}
		}

	//	testTerrain = new terrain(null,null,hite);
		testTerrain = new terrain(0,0,heightmap);
		testTerrain.bindRenderable(this.gl, this.programs["default"]);
		testTerrain.constructBuffers(this.gl);
		console.log(testTerrain);

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
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.BACK)
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

	testTerrain.renderable.setCustomUniforms();
	testTerrain.renderable.render();

	requestAnimationFrame(this.render.bind(this));
}

Thomas.prototype.setView = function() {
	var camX = -500;
	var camY = 200;
	var camZ = -500;

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
