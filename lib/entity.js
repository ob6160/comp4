var twgl = window.twgl;
var mat4 = require('gl-matrix').mat4;
var vec3 = require('gl-matrix').vec3;

function Entity(gl, programwrap) {
  this.gl = gl;

  this.model = mat4.create();
  this.inc = 0;

  this.program = programwrap.program;
  this.programwrap = programwrap;

  this.uniforms = {
    model: this.model
  };

};

Entity.prototype.bindMesh = function(mesh) {
  this.mesh = mesh;
};

Entity.prototype.render = function() {
  mat4.identity(this.model, this.model);
  this.inc+=0.01
  mat4.rotate(this.model, this.model, this.inc, [0,1,0]);
  this.mesh.render();
};

Entity.prototype.applyCustomUniforms = function(customUniforms) {
  for (var i = 0; i < customUniforms.length; i++) {
    this.uniforms[customUniforms[i][0]] = customUniforms[i][1];
  };
};

Entity.prototype.setCustomUniforms = function() {
  //Set uniforms
  twgl.setUniforms(this.programwrap, this.uniforms);
};

module.exports = Entity;
