var Mesh = require("./mesh");
var Entity = require("./entity");

function Country(data, name, colour) {
	this.mesh = null;
	this.entity = null;

	this.name = name;
	this.colour = colour;
	this.data = data;

	this.points = this.data["vertices"];
	this.indices = [];
};

Country.prototype.constructBuffers = function(gl, program) {
	this.mesh = new Mesh(gl, program);

	if(this.points.length % 2) {
		console.log("invalid number of points");
		return;
	};

	for(var i = 0; i < this.points.length; i += 2) {
		var x = this.points[i];
		var y = this.points[i + 1];
		
		var phi = +(90.0 - x) * Math.PI / 180.0;
	    var the = +(180.0 - y) * Math.PI / 180.0;
		
		var wx = Math.sin(the) * Math.sin(phi) * -1;
	    var wz = Math.cos(the) * Math.sin(phi);
	    var wy = Math.cos(phi);


		this.mesh.addVertex(wx * 0.98, wy * 0.98, wz * 0.98);
		this.mesh.addNormal(0,1,0);
	};

	//Construct indices
	for(var i = 0; i < this.data["triangles"].length; i++) {
		this.indices[i] = this.data["triangles"][i];
	};

	this.mesh.addIndices(this.indices);

	this.mesh.construct(gl);	
};

Country.prototype.constructEntity = function(gl, program) {
	this.entity = new Entity(gl, program);
	this.entity.bindMesh(this.mesh);

	this.entity.applyCustomUniforms([
		["colour", this.colour],
		["selected", false]		
	]);
};

module.exports = Country;

