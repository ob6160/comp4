var Mesh = require("./mesh");

//points: [x, y, x, y, x, y,...]
function Polygon(data) {
	this.mesh = null;
	this.data = data;
	this.points = data["vertices"];
	this.indices = [];

	this.colour = 0;
};

Polygon.prototype.constructBuffers = function(gl, program) {
	this.mesh = new Mesh(gl, program);

	if(this.points.length % 2) {
		console.log("invalid number of points in dis polygon!!!!");
		return;
	};

	for(var i = 0; i < this.points.length; i += 2) {
		var x = this.points[i];
		var y = this.points[i + 1];
	
		this.mesh.addVertex(x, y, 0);
		this.mesh.addNormal(0,1,0);
	};

	//Construct indices
	for(var i = 0; i < this.data["triangles"].length; i++) {
		this.indices[i] = this.data["triangles"][i];
	};

	this.mesh.addIndices(this.indices);

	this.mesh.construct(gl);	
};

module.exports = Polygon;

