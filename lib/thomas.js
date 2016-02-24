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
	this.renderBuffer = null;
	
	this.framebuffers = {

	};

	this.programs = {};

	this.countries = {};
	
	this.viewMatrix = mat4.create();
	this.projectionMatrix = mat4.create();
	
	this.globeRotationMatrix = mat4.create();

	this.mouseState = false;
	
	this.colourPicked = new Uint8Array(4);
	
	this.currentlySelectedCountry = {
		name: "Narnia"
	};

	this.globe = null;

	this.time = 0.0;

	this.camX = 0;
	this.camY = 0;
	this.camZ = 5;

	this.rotX = 0;
	this.rotY = 0;
	this.rotZ = 0;

	this.dX = 0;
	this.dY = 0;
	this.dZ = 0;

  	this.FSIZE = 4;
};

//Creates a WebGL context bound to specified canvas id
//canvas_id: id of canvas to be used
Thomas.prototype.setup = function(canvas_id) {
	if(canvas_id) {
		this.gl = twgl.getWebGLContext(document.getElementById("c"), {preserveDrawingBuffer: true});
		
		this.gl.enable(this.gl.BLEND);
    	this.gl.enable(this.gl.DEPTH_TEST);

		this.renderBuffer = this.gl.createRenderbuffer();

		twgl.resizeCanvasToDisplaySize(this.gl.canvas);

		this.bindRenderbuffer(this.renderBuffer);
		this.createFramebuffer("pick", this.gl.canvas.width, this.gl.canvas.height);
		this.setupRenderbuffer(this.renderBuffer, this.gl.canvas.width, this.gl.canvas.height);
		this.unbindFramebuffer();

		this.textures = {};

		// this.setOrtho();
		this.setProjection();
		
		this.setView();

		this.setupPrograms();
		this.setUniforms();
		this.loadTextures();
		this.bindHandlers();

		var globe_vertices = twgl.primitives.createSphereVertices(0.99,50,50);
		var midpointVertices = twgl.primitives.createSphereVertices(0.01,100,100);
	
		var rotMat = mat4.create();
		mat4.rotateX(rotMat, rotMat, Math.PI*0.5*-1);

		var debugPlaneVertices = twgl.primitives.createPlaneVertices(2.0, 1.0, 1.0, 1.0, rotMat);
		 
		var globe = new Mesh(this.gl, this.programs["default"], this.gl.TRIANGLES, globe_vertices.position, globe_vertices.indices, globe_vertices.normal, globe_vertices.texcoord)
    	globe.construct(this.gl);	

    	var midpointVerticesMesh = new Mesh(this.gl, this.programs["default"], this.gl.TRIANGLES, midpointVertices.position, midpointVertices.indices, midpointVertices.normal)
    	midpointVerticesMesh.construct(this.gl);

    	var debugPlaneMesh = new Mesh(this.gl, this.programs["default"], this.gl.TRIANGLES, debugPlaneVertices.position, debugPlaneVertices.indices, debugPlaneVertices.normal, debugPlaneVertices.texcoord)
    	debugPlaneMesh.construct(this.gl);
    
    	this.globe = new Entity(this.gl, this.programs["default"]);
		this.globe.bindMesh(globe);

		this.midPointRussia = new Entity(this.gl, this.programs["default"]);
		this.midPointRussia.bindMesh(midpointVerticesMesh);

		this.debugPlane = new Entity(this.gl, this.programs["default"]);
		this.debugPlane.bindMesh(debugPlaneMesh);

		mat4.translate(this.debugPlane.model, this.debugPlane.model, [-2.0, 0.9, 0.0])

		this.globe.applyCustomUniforms([
			["colour", [50, 15, 255]],
			["selected", false],
			["tex", this.textures.water],		
			["isTextured", true],
			["offScreen", false]	
		]);


		this.debugPlane.applyCustomUniforms([
			["colour", [50, 15, 15]],
			["selected", false],
			["tex", this.framebuffers["pick"].texture],		
			["isTextured", true],
			["offScreen", false]
		]);


		this.midPointRussia.applyCustomUniforms([
			["colour", [255, 0, 255]],
			["selected", false],
			["isTextured", false],
			["offScreen", false]
		]);
		
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

	document.addEventListener('touchmove', this.mouseMove.bind(this), false);
	document.addEventListener('touchstart', this.mouseDown.bind(this), false);
	document.addEventListener('touchend', this.touchEnd.bind(this), false);
};

Thomas.prototype.genCountries = function() {
	var indexCounter = 0;
	for(var i in country_data) {
		indexCounter++;

		var country_colour = null;

		var continent = country_data[i]["data"]["cont"];
		
		if(continent == "NA") {
			country_colour = new Float32Array(this.genColour(indexCounter, 100000));
		} else if(continent == "AF") {
			country_colour = new Float32Array(this.genColour(indexCounter, 39015));
		} else if(continent == "OC") {
			country_colour = new Float32Array(this.genColour(indexCounter, 11581375));
		} else if(continent == "EU") {
			country_colour = new Float32Array(this.genColour(indexCounter, 351900));
		} else {
			country_colour = new Float32Array(this.genColour(indexCounter, 1));
		}
		
		
		var country = new Country(country_data[i], i, country_colour);
		
		country.texture = this.textures.canada;
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

	this.bindFramebuffer(this.framebuffers["pick"].framebuffer);
		this.gl.readPixels(this.mouseX, this.gl.canvas.height - this.mouseY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.colourPicked);
	this.unbindFramebuffer();

	this.currentlySelectedCountry = this.countries["" + this.colourPicked[0] + this.colourPicked[1] +  this.colourPicked[2]] || { name:"Narnia", continent: "Narnia"}


	document.getElementById("country_name").textContent = this.currentlySelectedCountry.name || "Narnia";
	document.getElementById("country_info").textContent = "Continent: " + this.currentlySelectedCountry.continent || "Narnia";

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
	
	if(e.touches == undefined) {
		this.pickCountry(this.mouseX, this.mouseY);
	};
};

Thomas.prototype.touchEnd = function(e) {
	//this.mouseState = false;
	if(this.camAccelX == 0) {
		this.pickCountry(this.mouseX, this.mouseY);	
	};


};

Thomas.prototype.mouseDown = function(e) {
	this.mouseState = true;

	if(e.touches == undefined) {
		this.mouseX = e.clientX;
		this.mouseY = e.clientY;
		
		

		this.dX = 0;
		this.dY = 0;
		return;
	};

	this.mouseX = e.touches[0].pageX;
	this.mouseY = e.touches[0].pageY;



	this.dX = 0;
	this.dY = 0;
};

Thomas.prototype.mouseMove = function(e) {
  	e.preventDefault();
  	if(!this.mouseState) return;
  	if(e.touches == undefined) {
 		
	  	var curX = e.clientX;
	    var curY = e.clientY;

	    var dX = curX - this.mouseX;
	    var dY = curY - this.mouseY;

	    this.dX = dX;
	    this.dY = dY;

	    this.dX *= 2 * Math.PI / this.gl.canvas.width;
	    this.dY *= 2 * Math.PI / this.gl.canvas.height;
	   // this.setCamera(dX * 0.5, dY * 0.5, 0);
	    
	    this.mouseX = curX;
	    this.mouseY = curY;

    	this.updateGlobeRotation(this.dX, this.dY);
	    return;
  	};

  	var curX = e.touches[0].pageX;
    var curY = e.touches[0].pageY;

    var dX = curX - this.mouseX;
    var dY = curY - this.mouseY;


   	this.dX = dX;
    this.dY = dY;

    this.dX *= 2 * Math.PI / this.gl.canvas.width;
	this.dY *= 2 * Math.PI / this.gl.canvas.height;

    this.mouseX = curX;
    this.mouseY = curY;

    this.updateGlobeRotation(this.dX, this.dY);
};

Thomas.prototype.updateGlobeRotation = function(dx, dy) {
	mat4.identity(this.globeRotationMatrix, this.globeRotationMatrix);
    mat4.rotate(this.globeRotationMatrix, this.globeRotationMatrix, this.dX, [0, 1, 0]);
    mat4.rotate(this.globeRotationMatrix, this.globeRotationMatrix, this.dY, [1, 0, 0]);
};

Thomas.prototype.rotateEarth = function(dx, dy) {
	this.updateGlobeRotation(this.dX, this.dY);

	mat4.multiply(this.globe.model, this.globeRotationMatrix, this.globe.model);

	mat4.multiply(this.midPointRussia.model, this.globeRotationMatrix, this.midPointRussia.model);	
	mat4.translate(this.midPointRussia.model, this.midPointRussia.model, [0, 0, 0]);

	for(var i in this.countries) {
		var country = this.countries[i];
		if(country.name == this.currentlySelectedCountry.name) {
			mat4.multiply(this.midPointRussia.model, this.globeRotationMatrix, this.midPointRussia.model);	
			mat4.translate(this.midPointRussia.model, this.midPointRussia.model, [country.midpoint[0], country.midpoint[1], country.midpoint[2]]);	
		};

		mat4.multiply(country.entity.model, this.globeRotationMatrix, country.entity.model);	
	};	
};

Thomas.prototype.setCamera = function(x, y, z) {
	this.camX -= x;
	this.camY += y;
	this.camZ = 5;
};

Thomas.prototype.setOrtho = function() {
	var aspect = window.innerWidth / window.innerHeight;
	mat4.ortho(this.projectionMatrix, -1.0, 1.0, -1.0, 1.0, -1.0, 1000000);
};

Thomas.prototype.setProjection = function(width, height) {

	var aspect = window.innerWidth / window.innerHeight;
	mat4.perspective(this.projectionMatrix, 30 * Math.PI / 180, aspect, 1.0, 100.0);
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
		},
		water: {
			src: "images/ocean.png",
			wrap: gl.REPEAT,
			mag: gl.NEAREST
		},
		canada: {
			src: "images/canada.jpg"
		}
	});
};

Thomas.prototype.clearContext = function() {
    twgl.resizeCanvasToDisplaySize(this.gl.canvas);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

	this.setView();
    this.setUniforms();
};

Thomas.prototype.setupTexture = function(textureref, mag, min, wraps, wrapt, width, height) {
	mag = mag || this.gl.NEAREST;
	min = min || this.gl.NEAREST;
	wraps = wraps || this.gl.CLAMP_TO_EDGE;
	wrapt = wrapt || this.gl.CLAMP_TO_EDGE;

	this.gl.bindTexture(this.gl.TEXTURE_2D, textureref);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, mag);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, min);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wraps);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrapt);
	this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
};

Thomas.prototype.createFramebuffer = function(name, width, height) {
	var emptyFramebuffer = {
		texture: this.gl.createTexture(),
		framebuffer: this.gl.createFramebuffer()
	};

	this.setupTexture(emptyFramebuffer.texture, this.gl.NEAREST, this.gl.NEAREST, this.gl.CLAMP_TO_EDGE, this.gl.CLAMP_TO_EDGE, width, height);

	this.bindFramebuffer(emptyFramebuffer.framebuffer);
	this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, emptyFramebuffer.texture, 0);
	this.gl.bindTexture(this.gl.TEXTURE_2D, emptyFramebuffer.texture);

	this.gl.clear(this.gl.DEPTH_BUFFER_BIT);


	this.framebuffers[name] = emptyFramebuffer;
};

Thomas.prototype.unbindFramebuffer = function() {
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
};

Thomas.prototype.bindFramebuffer = function(fbo) {
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
};


Thomas.prototype.bindRenderbuffer = function(renderbuffer) {
	this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
};

Thomas.prototype.setupRenderbuffer = function(renderbuffer, width, height) {
	this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);  
	this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, renderbuffer);
	if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) != this.gl.FRAMEBUFFER_COMPLETE) {
   		console.error("Framebuffer config is crap!");
	};
};


Thomas.prototype.setupPrograms = function() {
	this.setupProgram("default", "vs-default", "fs-default");
};

Thomas.prototype.render = function() {
	if(!this.mouseState) {
		this.dX *= 0.95;
		this.dY *= 0.95;
	};

	this.rotateEarth(this.dX, this.dY);

	this.bindFramebuffer(this.framebuffers["pick"].framebuffer);
		this.setProjection();
		this.clearContext();

	    for(var i in this.countries) {
			this.countries[i].entity.setUniform("offScreen", true);
			this.countries[i].entity.setCustomUniforms();
			this.countries[i].entity.render();
		}

	this.unbindFramebuffer();

	this.setProjection();
	this.clearContext();

    for(var i in this.countries) {
		this.countries[i].entity.setUniform("offScreen", false);
		//this.countries[i].entity.setUniform("isTextured", false);
		this.countries[i].entity.setCustomUniforms();
		this.countries[i].entity.render();
	}

	this.globe.setCustomUniforms();
	this.globe.render();

	this.debugPlane.setCustomUniforms();
	this.debugPlane.render();

	this.time += 1;

	requestAnimationFrame(this.render.bind(this));
};

Thomas.prototype.setView = function() {
	// mat4.lookAt(this.viewMatrix, [0, 0, this.camZ], [this.camX, this.camY, -100], [0,1,0]);
	mat4.lookAt(this.viewMatrix, [this.camX, this.camY, this.camZ], [0, 0, 0], [0,1,0]);
};

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

		var time = this.gl.getUniformLocation(program, 'time');
		this.gl.uniform1f(time, this.time)
	};
};

Thomas.prototype.setupScene = function() {

};

module.exports = Thomas;
