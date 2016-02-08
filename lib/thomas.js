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

	this.countries = {};
	this.viewMatrix = mat4.create();
	this.projectionMatrix = mat4.create();
	this.mouseState = false;
	this.colourPicked = new Uint8Array(4);
	this.globe = null;
	this.camX = 0;
	this.camY = 0;
	this.camZ = 200;

  	this.FSIZE = new Float32Array().BYTES_PER_ELEMENT;
};

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
		this.bindHandlers();

		var globe_vertices = twgl.primitives.createSphereVertices(10,10,10);

		this.globe = new Mesh(this.gl, this.programs["default"], this.gl.TRIANGLES, globe_vertices.position, globe_vertices.indices, globe_vertices.normal)
    	this.globe.construct(this.gl);
    	this.genCountries();

		return [null, this.gl];
	} else {
		return ["Specify a canvas id", null];
	};
};

Thomas.prototype.bindHandlers = function() {
	window.addEventListener('resize', this.resizeEvent.bind(this), false);
	document.addEventListener('mouseup', this.mouseUp.bind(this), false);
	document.addEventListener('mousedown', this.mouseDown.bind(this), false);
	document.addEventListener('mousemove', this.mouseMove.bind(this), false);
};

Thomas.prototype.genCountries = function() {
	var indexCounter = 0;
	for(var i in country_data) {
		indexCounter++;

		var country_colour = new Float32Array(this.genColour(indexCounter, 10));
		var country = new Country(country_data[i], i, country_colour);

		country.constructBuffers(this.gl, this.programs["default"]);
		country.constructEntity(this.gl, this.programs["default"]);

		this.countries["" + country_colour[0] + country_colour[1] + country_colour[2]] = country;
	}
};

Thomas.prototype.genColour = function(index, offset) {
	index += offset;

	var red = index % 256;
	var green = ~~(index / 256) % 256;
	var blue = ~~(index / (256*256)) % 256;

	return [red, green, blue];
};

Thomas.prototype.pickCountry = function(x, y) {
	this.gl.readPixels(this.mouseX, this.gl.canvas.height - this.mouseY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.colourPicked);
	this.currentlySelectedCountry = this.countries["" + this.colourPicked[0] + this.colourPicked[1] +  this.colourPicked[2]];

	document.getElementById("country_name").textContent = this.currentlySelectedCountry.name;

	for(var i in this.countries) {
		this.countries[i].entity.applyCustomUniforms([
			["selected", false]		
		]);
	}

 	this.currentlySelectedCountry.entity.applyCustomUniforms([
		["selected", true]			
	]);
};

Thomas.prototype.resizeEvent = function() {
   // this.setOrtho();
	this.setProjection();
}

Thomas.prototype.mouseUp = function(e) {
	this.mouseState = false;
};

Thomas.prototype.mouseDown = function(e) {
	this.mouseState = true;

	this.mouseX = e.clientX;
	this.mouseY = e.clientY;

	this.pickCountry(this.mouseX, this.mouseY);
};

Thomas.prototype.mouseMove = function(e) {
  	if(!this.mouseState) return;
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
	this.camZ = 10;
};

Thomas.prototype.setOrtho = function() {
	var aspect = window.innerWidth / window.innerHeight;
	mat4.ortho(this.projectionMatrix, -aspect, aspect, -1.0, 1.0, -1.0, 1000000);
};

Thomas.prototype.setProjection = function() {
	var aspect = window.innerWidth / window.innerHeight;
	mat4.perspective(this.projectionMatrix, 30 * Math.PI / 180, aspect, 0.5, 1000);
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

	//this.globe.render();
	for(var i in this.countries) {

		this.countries[i].entity.setCustomUniforms();
		this.countries[i].entity.render();
		
	}

	requestAnimationFrame(this.render.bind(this));
}
var ff = 0;
Thomas.prototype.setView = function() {
	ff += 0.01;
	mat4.lookAt(this.viewMatrix, [Math.cos(ff) * 2, 0, this.camZ + Math.sin(ff) * 2], [this.camX, this.camY, -100], [0,1,0]);
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
