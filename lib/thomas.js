var twgl = window.twgl;
var mat4 = require('gl-matrix').mat4;
var vec3 = require('gl-matrix').vec3;
var vec4 = require('gl-matrix').vec4;

var vec2 = require("./vector2d.js");
var Entity = require("./entity.js");
var Mesh = require("./mesh.js");
var Country = require("./country.js");

var country_data = require("./country_data.js");

function Thomas() {
	this.gl = null;
	this.programs = {};

	this.viewMatrix = mat4.create();
	this.projectionMatrix = mat4.create();

	this.colourPicked = new Uint8Array(4);

	this.camX = 0;
	this.camY = 0;
	this.camZ = 200;

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
    	document.addEventListener('mouseup', this.mouseUp.bind(this), false);
    	document.addEventListener('mousedown', this.mouseDown.bind(this), false);
    	document.addEventListener('mousemove', this.mouseMove.bind(this), false);

 
    	var countrylist = Object.keys(country_data);
    	for(var i = 0; i < countrylist.length; i++) {
    		var newCountry = new Country(country_data[countrylist[i]]);
    		newCountry.constructBuffers(this.gl, this.programs["default"])	

    		var countryEntity = new Entity(this.gl, this.programs["default"]);
			countryEntity.bindMesh(newCountry.mesh);

			var colour = [i % 255 / 255,  Math.floor(i/255) / 255, Math.floor(i/(255*255)) / 255];
			
			countryEntity.applyCustomUniforms([
				["colour", colour]			
			]);

    		countries[colour[0] * 255 + colour[1] * 255 + colour[2] * 255] = countryEntity;
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

var mouseDown = false;
Thomas.prototype.mouseUp = function(e) {
	mouseDown = false;
	

	this.gl.readPixels(this.mouseX, this.gl.canvas.height - this.mouseY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.colourPicked);
	this.currentlySelectedCountry = countries[this.colourPicked[0]+this.colourPicked[1]+this.colourPicked[2]];

	for(var i in countries) {
		countries[i].applyCustomUniforms([
			["selected", false]			
		])
	}

 	this.currentlySelectedCountry.applyCustomUniforms([
		["selected", true]			
	]);
};

Thomas.prototype.mouseDown = function(e) {

	mouseDown = true;
	this.mouseX = e.clientX;
	this.mouseY = e.clientY;
	console.log("lol")
};

Thomas.prototype.mouseMove = function(e) {
  	if(!mouseDown) return;
  	var curX = e.clientX;
    var curY = e.clientY;

    var dX = curX - this.mouseX;
    var dY = curY - this.mouseY;

    this.setCamera(dX * 0.5, dY * 0.5, 0);
    
    this.mouseX = curX;
    this.mouseY = curY;

};

Thomas.prototype.setCamera = function(x, y, z) {
	this.camX -= x;
	this.camY += y;
	this.camZ = 100;
};

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

Thomas.prototype.setView = function() {
	mat4.lookAt(this.viewMatrix, [0, 0, this.camZ], [this.camX, this.camY, -100], [0,1,0]);
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
