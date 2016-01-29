var twgl = window.twgl;
var mat4 = require('gl-matrix').mat4;
var vec3 = require('gl-matrix').vec3;
var vec4 = require('gl-matrix').vec4;
var vec2 = require("./vector2d.js");
var Entity = require("./entity.js");
var Mesh = require("./mesh.js");
var Polygon = require("./polygon.js");

var country_data = require("./country_data.js");

function Thomas() {
	this.gl = null;
	this.programs = {};

	this.viewMatrix = mat4.create();
	this.projectionMatrix = mat4.create();

	this.colorPicked = new Uint8Array(4);

  	this.FSIZE = new Float32Array().BYTES_PER_ELEMENT;
};



var testEntity = null;
var testMesh = null;
var countries = {};
//Creates a WebGL context bound to specified canvas id
//canvas_id: id of canvas to be used
Thomas.prototype.setup = function(canvas_id) {
	if(canvas_id) {
		this.gl = twgl.getWebGLContext(document.getElementById("c"), {preserveDrawingBuffer: true});
		twgl.resizeCanvasToDisplaySize(this.gl.canvas);

		this.textures = {};

		this.setProjection();
		this.setView();

		this.setupPrograms();
		this.setUniforms();
		this.loadTextures();

		window.addEventListener('resize', this.resizeEvent.bind(this), false);
    	document.addEventListener('click', this.mouseEvent.bind(this), false);

 
    	var countrylist = Object.keys(country_data);
    	for(var i = 0; i < countrylist.length; i++) {
    		var Poly = new Polygon(country_data[countrylist[i]]);
    		Poly.constructBuffers(this.gl, this.programs["default"])	

    		var countryEntity = new Entity(this.gl, this.programs["default"]);
			countryEntity.bindMesh(Poly.mesh);
			var colour = [i/255, i/255, i/255];
			countryEntity.applyCustomUniforms([
				["colour", colour]			
			]);
    		countries[colour[0]+colour[1]+colour[2]] = (countryEntity);
    	}
    	
		return [null, this.gl];
	} else {
		return ["Specify a canvas id", null];
	};
};

Thomas.prototype.resizeEvent = function() {
   // this.setOrtho();
	this.setProjection();
}

Thomas.prototype.mouseEvent = function(e) {

	this.mouseX = (e.clientX);
	this.mouseY = (e.clientY);

	this.gl.readPixels(this.mouseX, this.gl.canvas.height - this.mouseY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.colorPicked);
	this.currentlySelectedCountry = countries[this.colorPicked[0]/255+this.colorPicked[1]/255+this.colorPicked[2]/255];
	
	var colour = [Math.random(), Math.random(), Math.random()];


	for(var i in countries) {
		countries[i].applyCustomUniforms([
			["selected", false]			
		])
	}

 	this.currentlySelectedCountry.applyCustomUniforms([
		["selected", true]			
	])
}

Thomas.prototype.setOrtho = function() {
	var aspect = window.innerWidth / window.innerHeight;
	mat4.ortho(this.projectionMatrix, -aspect, aspect, -1.0, 1.0, -1.0, 1000000);
};

Thomas.prototype.setProjection = function() {
	var aspect = window.innerWidth / window.innerHeight;
	mat4.perspective(this.projectionMatrix, 60 * Math.PI / 180, aspect, 0.5, 1000);
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

	this.setView();
    this.setUniforms();
};

Thomas.prototype.setupPrograms = function() {
	this.setupProgram("default", "vs-default", "fs-default");
};

Thomas.prototype.render = function() {
	this.clearContext();

	for(var i in countries) {
		countries[i].render();
		countries[i].setCustomUniforms();
	}

	requestAnimationFrame(this.render.bind(this));
}
var jf = 0;
Thomas.prototype.setView = function() {
	var camX = 0.0;
	var camY = 0.0;
	var camZ = 200.0;
	
	mat4.lookAt(this.viewMatrix, [camX, camY, camZ], [0, 0, 0], [0,1,0]);
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
