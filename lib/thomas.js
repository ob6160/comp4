var twgl = window.twgl;
var mat4 = require('gl-matrix').mat4;
var vec3 = require('gl-matrix').vec3;
var vec4 = require('gl-matrix').vec4;

var vec2 = require("./vector2d.js");
var Entity = require("./entity.js");
var Mesh = require("./mesh.js");
var Country = require("./country.js");

var country_data = require("./country_data.js");
var country_code_data = require("./country_code_data.js");



function Thomas() {
	this.gl = null;
	this.renderBuffer = null;
	
	this.framebuffers = {};

	this.textures = {};

	this.programs = {};

	this.countries = {};
	
	this.viewMatrix = mat4.create();
	this.projectionMatrix = mat4.create();
	
	this.currentProjection = "Perspective";

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
	this.camZ = 10;

	this.lookX = 0;
	this.lookY = 0;
	this.lookZ = 0;

	this.rotX = 0;
	this.rotY = 0;
	this.rotZ = 0;

	this.dX = 0;
	this.dY = 0;
	this.dZ = 0;

	this.scrollDelta = 0;

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

		this.setupOptions();

		twgl.resizeCanvasToDisplaySize(this.gl.canvas);

		this.bindRenderbuffer(this.renderBuffer);
		this.createFramebuffer("pick", 1920, 1080);
		this.setupRenderbuffer(this.renderBuffer, 1920, 1080);
		this.unbindFramebuffer();

		this.setProjection(this.currentProjection);	

		this.setupPrograms();
		this.setUniforms("default");


		this.loadTextures();
		this.bindHandlers();

		this.setupScene();
		
    	this.genCountries();

		this.setView();

		return [null, this.gl];
	} else {
		return ["Specify a canvas id", null];
	};
};

Thomas.prototype.setupOptions = function() {
	this.options = {
		projectionType: "Perspective",
		renderMode: "TRIANGLES",
		countryTextures: false,
		moon: true,
		lookAt: vec3.create(),
		pickUnderCrosshair: true

	};

	window.options = this.options;
};

Thomas.prototype.setupScene = function() {
	var globe_vertices = twgl.primitives.createSphereVertices(0.99,100,100);
	var moon_vertices = twgl.primitives.createSphereVertices(0.2,100,100);
	
	var crosshair_vertices = {
		position: {
			data: [		
				-1.0, 0.1,
				1.0, -0.1,
				-1.0, -0.1,
				1.0, 0.1,

				0.1, 1.0,
				-0.1, -1.0,
				0.1, -1.0,
				-0.1, 1.0
			],
			numComponents: 2
		},
		indices: [
			0,1,2,
			0,3,1,
			4,5,6,
			4,7,5
		],
		normal: [
			0,0,0,
			0,0,0,
			0,0,0,
			0,0,0,
			0,0,0,
			0,0,0,
			0,0,0,
			0,0,0
		]
	};

	var globe = new Mesh(this.gl, this.programs["default"], this.gl[this.options.renderMode], globe_vertices.position, globe_vertices.indices, globe_vertices.normal, globe_vertices.texcoord)
	globe.construct(this.gl);	

	var moon = new Mesh(this.gl, this.programs["default"], this.gl[this.options.renderMode], moon_vertices.position, moon_vertices.indices, moon_vertices.normal, moon_vertices.texcoord)
	moon.construct(this.gl);	

	var crosshair = new Mesh(this.gl, this.programs["default"], this.gl.TRIANGLES, crosshair_vertices.position, crosshair_vertices.indices, crosshair_vertices.normal);
	crosshair.construct(this.gl);

	this.globe = new Entity(this.gl);
	this.globe.bindMesh(globe);	

	this.moon = new Entity(this.gl);
	this.moon.bindMesh(moon);

	this.crosshair = new Entity(this.gl);
	this.crosshair.bindMesh(crosshair);


	mat4.translate(this.moon.model, this.moon.model, [2.0, 0.0, 0.0]);

	this.crosshair.applyCustomUniforms([
		["colour", [255, 255, 255]],
		["selected", false],
		["hud", true],
		["tex", null],
		["isTextured", false],
		["offScreen", false],
		["water", false]	
	]);

	this.globe.applyCustomUniforms([
		["colour", [50, 15, 255]],
		["selected", false],
		["hud", false],
		["tex", this.textures.water],		
		["isTextured", true],
		["offScreen", false],
		["water", true]	
	]);

	this.moon.applyCustomUniforms([
		["colour", [50, 15, 255]],
		["selected", false],
		["hud", false],
		["tex", this.textures.moon],		
		["isTextured", true],
		["offScreen", false],
		["water", false]	
	]);
};


Thomas.prototype.bindHandlers = function() {
	window.addEventListener('resize', this.resizeEvent.bind(this), false);
	document.addEventListener('mouseup', this.mouseUp.bind(this), false);
	document.addEventListener('mousedown', this.mouseDown.bind(this), false);
	document.addEventListener('mousemove', this.mouseMove.bind(this), false);

	document.addEventListener('mousewheel', this.mouseWheel.bind(this), false);
	document.addEventListener('contextmenu', this.contextHandle.bind(this), false);

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
		
		// country.texture = twgl.createTexture(this.gl, {
		// 	src: "/images/flags/" + country_code_data(country.name).toLowerCase() + ".png"
		// }, function() {});
		country.texture = this.textures.terrain;

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
		this.gl.readPixels(x, this.gl.canvas.height - y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.colourPicked);
	this.unbindFramebuffer();

	if(this.colourPicked[0] == 128 && this.colourPicked[1] == 229 && this.colourPicked[2] == 51) {
		return;
	}

	var newCountry = this.countries["" + this.colourPicked[0] + this.colourPicked[1] +  this.colourPicked[2]] || { name: "Narnia" };

	if(newCountry.name != this.currentlySelectedCountry.name) {
		this.currentlySelectedCountry = newCountry;
		document.getElementById("country_name").textContent = this.currentlySelectedCountry.name;
		document.getElementById("country_info").textContent = "Continent: " + this.currentlySelectedCountry.continent;

		for(var i in this.countries) {
			this.countries[i].entity.applyCustomUniforms([
				["selected", false]		
			]);
		};

		if(this.currentlySelectedCountry.entity) {
			this.currentlySelectedCountry.entity.applyCustomUniforms([
				["selected", true]			
			]);	
		} else {
			document.getElementById("country_name").textContent = "Narnia";
			document.getElementById("country_info").textContent = "LOL";
		}
	}
};

Thomas.prototype.resizeEvent = function() {
	this.setProjection(this.currentProjection);
};

Thomas.prototype.mouseUp = function(e) {
	this.mouseState = false;

	if(e.touches == undefined && this.dX == 0) {
		this.pickCountry(this.mouseX, this.mouseY);
	};
};

Thomas.prototype.touchEnd = function(e) {
	//this.mouseState = false;
	if(this.camAccelX == 0) {
		this.pickCountry(this.mouseX, this.mouseY);	
	};


};

Thomas.prototype.mouseWheel = function(e) {
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	this.scrollDelta -= delta * 0.1;



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

Thomas.prototype.contextHandle = function(e) {
	e.preventDefault();
};

Thomas.prototype.mouseMove = function(e) {
  //	e.preventDefault();
  	if(!this.mouseState) return;
  		
  	if(e.button == 2) {
  		var curX = e.clientX;
	    var curY = e.clientY;

	    var dX = curX - this.mouseX;
	    var dY = curY - this.mouseY;

	    dX *= -2 * Math.PI / this.gl.canvas.width;
	    dY *= 2 * Math.PI / this.gl.canvas.height;
		this.options.lookAt[0] += dX;
		this.options.lookAt[1] += dY;

		this.mouseX = curX;
	    this.mouseY = curY;
  		return;
  	};

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

	// mat4.identity(this.midPointRussia.model, this.midPointRussia.model)

	for(var i in this.countries) {
		var country = this.countries[i];
		if(country.name == this.currentlySelectedCountry.name) {
			// mat4.multiply(this.midPointRussia.model, this.globeRotationMatrix, this.midPointRussia.model);	
			// mat4.translate(this.midPointRussia.model, this.midPointRussia.model, [country.midpoint[0], country.midpoint[1], country.midpoint[2]]);	
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
	this.currentProjection = "Orthographic";
	var aspect = window.innerWidth / window.innerHeight;
	mat4.ortho(this.projectionMatrix, -aspect, aspect, -1.0, 1.0, -1.0, 1000);
	//mat4.ortho(this.projectionMatrix, 0, this.gl.canvas.width, this.gl.canvas.height, 0.0, -1.0, 1000000);
};

Thomas.prototype.setPerspective = function() {
	this.currentProjection = "Perspective";
	var aspect = window.innerWidth / window.innerHeight;
	mat4.perspective(this.projectionMatrix, 30 * Math.PI / 180, aspect, 1.0, 100.0);
};

Thomas.prototype.setProjection = function(type) {
	switch(type) {
		case "Perspective":
			this.setPerspective();
			break;
		case "Orthographic":
			this.setOrtho();
			break;
		default:
			break;
	};

};

Thomas.prototype.loadTextures = function() {
	var gl = this.gl;
	this.textures = twgl.createTextures(gl, {
		water: {
			src: "images/sea.jpg",
			// wrap: gl.REPEAT,
			// mag: gl.NEAREST
		},
		terrain: {
			src: "images/terrain.jpg"
		},
		moon: {
			src: "images/moontex.jpg"
		}
	});
};

Thomas.prototype.clearContext = function() {
    twgl.resizeCanvasToDisplaySize(this.gl.canvas);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

	this.setView();
    this.setUniforms("default");
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
	this.gl.bindTexture(this.gl.TEXTURE_2D, emptyFramebuffer.texture);
	this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, emptyFramebuffer.texture, 0);
	


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
	this.setupProgram("default", "vs-default", "fs-default", {
		u_projection: this.projectionMatrix,
		time: this.time,
		u_view: this.viewMatrix
	});
	// this.setupProgram("gui", "vs-gui", "fs-gui", {
	// 	u_projectiono: this.projectionMatrix,
	// });
};

Thomas.prototype.render = function() {
	if(!this.mouseState) {
		this.dX *= 0.95;
		this.dY *= 0.95;
		this.scrollDelta *= 0.80;
		this.camZ += this.scrollDelta;
	};

	if(this.options.pickUnderCrosshair) {
		this.pickCountry(this.gl.canvas.width / 2, this.gl.canvas.height / 2);
	}

	if(this.currentProjection != this.options.projectionType) {
		this.currentProjection = this.options.projectionType;
		this.resizeEvent();
	};


	this.rotateEarth(this.dX, this.dY);

	this.bindFramebuffer(this.framebuffers["pick"].framebuffer);
		this.clearContext();

	    for(var i in this.countries) {
			this.countries[i].entity.setUniform("offScreen", true);
			this.countries[i].mesh.setRenderMode(this.gl.TRIANGLES);
			this.countries[i].entity.setCustomUniforms();
			this.countries[i].entity.render();
		}

	this.unbindFramebuffer();

	this.clearContext();
	

    for(var i in this.countries) {
		this.countries[i].entity.setUniform("offScreen", false);
		this.countries[i].entity.setUniform("isTextured", this.options.countryTextures);
		this.countries[i].mesh.setRenderMode(this.gl[this.options.renderMode]);
		this.countries[i].entity.setCustomUniforms();
		this.countries[i].entity.render();
	}

	this.globe.setCustomUniforms();
	this.globe.mesh.setRenderMode(this.gl[this.options.renderMode]);
	this.globe.render();

	this.moon.setCustomUniforms();
	mat4.identity(this.moon.model, this.moon.model);
	mat4.translate(this.moon.model, this.moon.model, [Math.cos(this.time) * 2, Math.cos(this.time) * 2, Math.sin(this.time) * 2]);
	mat4.rotate(this.moon.model, this.moon.model, this.time, [0.0, 1.0, 0.0]);	

	if(this.options.moon) {
		this.moon.mesh.setRenderMode(this.gl[this.options.renderMode]);
		this.moon.render();
	};
	
	this.setProjection("Orthographic");
	
	mat4.identity(this.crosshair.model, this.crosshair.model);
	var crossScale = 0.01;
	mat4.translate(this.crosshair.model, this.crosshair.model, [0, 0, -1])
	mat4.scale(this.crosshair.model, this.crosshair.model, [crossScale, crossScale, crossScale]);

	this.crosshair.setCustomUniforms();
	this.crosshair.render();
	
	
	this.time += 0.01;

	requestAnimationFrame(this.render.bind(this));
};

Thomas.prototype.setView = function(program) {
	mat4.lookAt(this.viewMatrix, [this.camX, this.camY, this.camZ], this.options.lookAt, [0,1,0]);
	

};

Thomas.prototype.setupProgram = function(name, vs, fs, uniforms) {
	this.programs[name] = twgl.createProgramInfo(this.gl, [vs, fs]);
	this.programs[name].uniforms = uniforms;
};

Thomas.prototype.setUniforms = function(programName) {
	var program = this.programs[programName];

	twgl.setUniforms(program, program.uniforms);
};


module.exports = Thomas;
