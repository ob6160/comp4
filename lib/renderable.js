var twgl = window.twgl;
var mat4 = require('gl-matrix').mat4;
var vec3 = require('gl-matrix').vec3;

function Renderable(gl, programwrap, program) {
  this.gl = gl;
  this.vertexBuffer = null;
  this.indexBuffer = null;
  this.vertexNormalBuffer = null;

  this.vao = null;

  this.model = mat4.create();
  this.inc = 0;

  this.program = program;
  this.programwrap = programwrap;

  this.offset = 0;

  //Access VAO extension
  this.ext = gl.getExtension("OES_vertex_array_object");

  this.uniforms = {
    model: this.model
  };

  this.attribs = {
    a_position: gl.getAttribLocation(this.program, 'a_position'),
    a_normal: gl.getAttribLocation(this.program, 'a_normal'),
    vertices: [],
    indices: [],
    normals: []
  };
};

Renderable.prototype.addQuad = function() {
  //  x,  y, z
  // var base_quad = [-0.5, 0.5, 0.0, -0.5, -0.5, 0.0,
  //   0.5, -0.5, 0.0,
  //   0.5, 0.5, 0.0,
  //   0.1, 0.2, 0.0
  // ];
  //
  // var base_quad_indices = [
  //   0, 1, 2, 2, 3, 0,
  // ];
  //
  // var base_quad = [-1, -1, -1,
  //   1, -1, -1, -1, 1, -1,
  //   1, 1, -1, -1, -1, 1,
  //   1, -1, 1, -1, 1, 1,
  //   1, 1, 1,
  // ];
  // var base_quad_indices = [
  //   0, 1, 1, 3, 3, 2, 2, 0,
  //   4, 5, 5, 7, 7, 6, 6, 4,
  //   0, 4, 1, 5, 2, 6, 3, 7,
  // ];



   var test_sphere = twgl.primitives.createSphereVertices(1,256,256);
  //var test_sphere = twgl.primitives.createCubeVertices(1);
  var base_quad = test_sphere.position;
  var base_quad_indices = test_sphere.indices;
  var base_quad_normals = test_sphere.normal;

  for (var i = 0; i < base_quad_indices.length; i++) {
    this.attribs.indices.push(base_quad_indices[i]);
  };

  for (var i = 0; i < base_quad.length; i++) {
    this.attribs.vertices.push(base_quad[i]);
  };

  for (var i = 0; i < base_quad_normals.length; i++) {
    this.attribs.normals.push(base_quad_normals[i]);
  }

  this.offset += base_quad_indices.length;
};

Renderable.prototype.bind = function() {
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
};

Renderable.prototype.render = function() {
  var gl = this.gl;
  gl.useProgram(this.program);

  //Render
  this.ext.bindVertexArrayOES(this.vao);
    mat4.identity(this.model);
  gl.drawElements(gl.TRIANGLES, this.offset, gl.UNSIGNED_SHORT, 0);

  this.setCustomUniforms();
  mat4.identity(this.model);
  mat4.translate(this.model, this.model, [Math.sin(this.inc)*5,0,Math.cos(this.inc)*5]);
  gl.drawElements(gl.TRIANGLES, this.offset, gl.UNSIGNED_SHORT, 0);
  this.ext.bindVertexArrayOES(null);
};

Renderable.prototype.applyCustomUniforms = function(customUniforms) {
  for (var i = 0; i < customUniforms.length; i++) {
    this.uniforms[customUniforms[i][0]] = customUniforms[i][1];
  };
};

Renderable.prototype.setCustomUniforms = function() {
  //Set uniforms
  twgl.setUniforms(this.programwrap, this.uniforms);
};

Renderable.prototype.initBuffers = function(gl) {
  //Bind vertex information to vertices buffer.
  var vertices = new Float32Array(this.attribs["vertices"]);

  //Bind program
  gl.useProgram(this.program);

  //Init and bind VAO
  this.vao = this.ext.createVertexArrayOES();
  this.ext.bindVertexArrayOES(this.vao);

  //Setup normal buffer
  this.vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.attribs.normals), gl.STATIC_DRAW);

  //Setup normal attributes
  gl.enableVertexAttribArray(this.attribs.a_normal);
  gl.vertexAttribPointer(this.attribs.a_normal, 3, gl.FLOAT, false, 0, 0);

  //Setup vertex buffer
  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  //Set vertex attributes
  gl.enableVertexAttribArray(this.attribs.a_position);
  gl.vertexAttribPointer(this.attribs.a_position, 3, gl.FLOAT, false, 0, 0);

  //Setup index buffer
  this.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.attribs.indices), gl.STATIC_DRAW);


  //Unbind VAO
  this.ext.bindVertexArrayOES(null);

  //Unbind index and vertex buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};


module.exports = Renderable;
