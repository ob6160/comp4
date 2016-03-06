var twgl = window.twgl;
var mat4 = require('gl-matrix').mat4;
var vec3 = require('gl-matrix').vec3;

function Entity(gl) {
  this.gl = gl;

  this.model = mat4.create();
  this.inc = 0;

  this.program = null;
  this.programwrap = null;

  this.uniforms = {
    model: this.model
  };

};

Entity.prototype.bindMesh = function(mesh) {
  this.mesh = mesh;

  this.program = mesh.program;
  this.programwrap = mesh.programWrap;
};

Entity.prototype.render = function() {
  this.mesh.render();
};

Entity.prototype.applyCustomUniforms = function(customUniforms) {
  for (var i = 0; i < customUniforms.length; i++) {
    this.uniforms[customUniforms[i][0]] = customUniforms[i][1];
  };
};

Entity.prototype.setUniform = function(uniformKey, data) {
  this.uniforms[uniformKey] = data;
};

Entity.prototype.setCustomUniforms = function() {
  //Set uniforms
  // console.log(this.uniforms);
  
  twgl.setUniforms(this.programwrap, this.uniforms);
};

module.exports = Entity;
