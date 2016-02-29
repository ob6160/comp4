var Mesh = require("./mesh");
var Entity = require("./entity");
var Util = require("./util");

function Country(data, name, colour) {
	this.mesh = null;
	this.entity = null;

	this.name = name;
	this.colour = colour;
	this.data = data;
	this.midpoint = null;

	this.points = this.data["vertices"];
	this.continent = this.data["data"].cont;
	this.triangleIndices = [];
	this.polygonIndices = [];
};

Country.prototype.constructBuffers = function(gl, program) {
	this.mesh = new Mesh(gl, program, gl.TRIANGLES);

	if(this.points.length % 2) {
		console.log("invalid number of points");
		return;
	};


	var lowX = this.points[0];
	var lowY = this.points[1];
	var highX = this.points[0];
	var highY = this.points[1];
	for(var i = 2; i < this.points.length; i += 2) {
		var x = this.points[i];
		var y = this.points[i+1];
		
		var x1 = this.points[i];
		var y1 = this.points[i+1];

		if(x < lowX) lowX = x;
		if(y < lowY) lowY = y;
	
		if(x1 > highX) highX = x1;
		if(y1 > highY) highY = y1;

	}

	var tX = lowX;
	lowX = highX;
	highX = tX;

	for(var i = 0; i < this.points.length; i += 2) {
		var x = this.points[i];
		var y = this.points[i + 1];
		
	 	var triangulated = Util.triangulatePoint(x, y);

		this.mesh.addVertex(triangulated[0], triangulated[1], triangulated[2]);
		this.mesh.addNormal(0,1,0);
		
		this.mesh.addTexcoord(Math.abs((x-highX)/Math.abs(highX-lowX)), Math.abs((y-highY)/Math.abs(highY-lowY)));
	};


	//Construct indices
	for(var i = 0; i < this.data["triangles"].length; i++) {
		this.triangleIndices[i] = this.data["triangles"][i];
	};



	this.midpoint = Util.triangulatePoint(lowX + (highX - lowX) / 2, lowY + (highY - lowY) / 2);
	// var majorityPoints = [];
	// var longest = 0;
	// for(var i = 0; i < this.data["polygons"].length; i++) {
	// 	var poly_choice = this.data["polygons"][i];
	// 	longest = poly_choice[0];
	// 	for(var j = 1; j < poly_choice.length; j++) {
	// 		var poly_poly = poly_choice[j];
	// 		if(poly_poly.length > longest.length) {
	// 			longest = poly_poly;
	// 		}
	// 	};


	// };


	// for(var j = 0; j < longest.length; j++) {
	// 	var index = longest[j];
	// 	majorityPoints.push(this.points[index]);
	// 	majorityPoints.push(this.points[index+1]);
	// };

	// // var largest = [this.data["polygons"][0].length, this.data["polygons"][0]];
	// // for(var i = 0; i < this.data["polygons"].length; i++) {
	// // 	if(this.data["polygons"][i].length > largest[0]) {
	// // 		largest = [this.data["polygons"][i].length, this.data["polygons"][i]];
	// // 	};
	// // }

	// //Calculate midpoint
	// var calculatedMidpoint = Util.midpointPolygon(this.points, this.data["triangles"]);
	// var triangulatedMidpoint = Util.triangulatePoint(calculatedMidpoint[0], calculatedMidpoint[1]);
	// this.midpoint = triangulatedMidpoint;

	this.mesh.addIndices(this.triangleIndices);

	this.mesh.construct(gl);	
};

Country.prototype.constructEntity = function(gl, program) {
	this.entity = new Entity(gl, program);
	this.entity.bindMesh(this.mesh);

	this.entity.applyCustomUniforms([
		["colour", this.colour],
		["selected", false],
		["isTextured", true],
		["tex", this.texture],
		["offScreen", false],
		["water", false]	
	]);
};

module.exports = Country;

