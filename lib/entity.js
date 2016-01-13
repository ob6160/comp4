var renderable = require("./renderable.js");
var vec2 = require("./vector2d.js");

function Entity(position, dimensions) {
  this.renderable = null;
  this.position = position;
  this.dimensions = dimensions;

};

Entity.prototype.update = function() {

};

Entity.prototype.render = function() {
	this.renderable.setCustomUniforms();
	this.renderable.render();
};

Entity.prototype.finalizeBuffers = function(gl) {
  this.renderable.initBuffers(gl);
  this.renderable.setCustomUniforms();
};

//Create a new instance of Renderable with the supplied gl context + program
Entity.prototype.createRenderable = function(gl, programWrap) {
  this.renderable = new renderable(gl, programWrap);
};

Entity.prototype.bindRenderable = function(renderable) {
  this.renderable = renderable;
};



module.exports = Entity;
