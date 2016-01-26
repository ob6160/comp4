var renderable = require("./renderable.js");


//heightmap optional
function Terrain(width, height, heightmap) {
  this.width = width;
  this.height = height;

  this.renderable = null;
  this.heightmap = heightmap || null;

  //Asume it's a square for now
  if(this.heightmap) {
    this.width = this.heightmap.length;
    this.height = this.heightmap[0].length;
  };

};

Terrain.prototype.constructBuffers = function(gl) {
  for(var j = 0; j < this.width; j++) {
    for(var i = 0; i < this.height; i++) {
        //*0.5 to centre
        this.renderable.addVertex(i - (this.width - 1) / 2, this.heightmap[this.height-1-j][i], j - (this.height - 1) / 2);
        this.renderable.addNormal(0,1,0);
    };
  };

  //6 indices for each item in the array
  var indices = new Array(3 * 2 * (this.width - 1) * (this.height - 1));
	var vertIndex = 0;

	for (var i = 0; i < this.height - 1; i++) {
		for (var j = 0; j < this.width - 1; j++) {
			var t = j + i * this.width;
			indices[vertIndex++] = (t + this.width + 1);
			indices[vertIndex++] = (t + 1);
			indices[vertIndex++] = t;
      
			indices[vertIndex++] = (t + this.width);
			indices[vertIndex++] = (t + this.width + 1);
			indices[vertIndex++] = t;
		};
	};

  this.renderable.addIndices(indices);

  this.finalizeBuffers(gl);
};

Terrain.prototype.finalizeBuffers = function(gl) {
  this.renderable.initBuffers(gl);
  this.renderable.setCustomUniforms();
};

Terrain.prototype.bindRenderable = function(gl, programWrap) {
  this.renderable = new renderable(gl, programWrap);
};



module.exports = Terrain;
