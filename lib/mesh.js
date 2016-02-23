function Mesh(gl, program, renderMode, vertices, indices, normals, texcoord) {
  this.vertices = vertices || [];
  this.indices = indices || [];
  this.normals = normals || [];
  this.texcoord = texcoord || null;

  this.vertexBuffer = null;
  this.indexBuffer = null;
  this.texcoordBuffer = null;
  this.vertexNormalBuffer = null;

  this.fbos = [];
  this.programWrap = program;
  this.program = this.programWrap.program;

  this.attribs = {
    a_position: gl.getAttribLocation(this.program, 'a_position'),
    a_normal: gl.getAttribLocation(this.program, 'a_normal'),
    a_texcoord: gl.getAttribLocation(this.program, 'a_texcoord')
  }

  this.vao = null;

  this.renderMode = renderMode || gl.TRIANGLES;

  //Access VAO extension
  this.ext = gl.getExtension("OES_vertex_array_object");
  //Check for 32bit index array support
  this.index32Bit = gl.getExtension("OES_element_index_uint");

  this.gl = gl;

  //this.construct(this.gl);
}

Mesh.prototype.attachFBO = function(fbo) {
  this.fbos.push(fbo);
};

Mesh.prototype.bindFramebuffer = function(fbo) {
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
  this.gl.viewport(0,0,this.gl.canvas.width,this.gl.canvas.height);
};

Mesh.prototype.unbindFramebuffer = function() {
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  this.gl.viewport(0,0,this.gl.canvas.width,this.gl.canvas.height);
};


Mesh.prototype.render = function(fbotest) {
  this.gl.useProgram(this.program);

  this.ext.bindVertexArrayOES(this.vao);

  this.drawElements();

  this.ext.bindVertexArrayOES(null);
};

Mesh.prototype.drawElements = function() {
    if (this.index32Bit) {
      this.gl.drawElements(this.renderMode, this.indices.length, this.gl.UNSIGNED_INT, 0);
    } else {
      this.gl.drawElements(this.renderMode, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
    };
};

Mesh.prototype.addVertex = function(x, y, z) {
  this.vertices.push(x);
  this.vertices.push(y);
  this.vertices.push(z);
};

Mesh.prototype.addTexcoord = function(x, y) {
  if(!this.texcoord) {
    this.texcoord = [];
  };

  this.texcoord.push(x);
  this.texcoord.push(y);
};

Mesh.prototype.addNormal = function(x, y, z) {
  this.normals.push(x);
  this.normals.push(y);
  this.normals.push(z);
};

Mesh.prototype.addIndices = function(indices) {
  for(var i = 0; i < indices.length; i++) {
    this.indices.push(indices[i]);
  };
};

Mesh.prototype.construct = function(gl) {
  //Bind vertex information to vertices buffer.
  var vertices = new Float32Array(this.vertices);

  //Bind program
  gl.useProgram(this.program);
  //Init and bind VAO
  this.vao = this.ext.createVertexArrayOES();
  this.ext.bindVertexArrayOES(this.vao);

  //Setup normal buffer
  this.vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

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

  if(this.texcoord) {
    //Setup texcoord buffer
    this.texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texcoord), gl.STATIC_DRAW);

    //Setup texcoord attributes
    gl.enableVertexAttribArray(this.attribs.a_texcoord);
    gl.vertexAttribPointer(this.attribs.a_texcoord, 2, gl.FLOAT, false, 0, 0);
  };

  //Setup index buffer
  this.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  if (this.index32Bit) {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);
  } else {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
  }

  //Unbind VAO
  this.ext.bindVertexArrayOES(null);

  //Unbind index and vertex buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

};

module.exports = Mesh;