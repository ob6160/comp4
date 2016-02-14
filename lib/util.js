module.exports = {
	//Points: [x, y, x, y, ...]
	midpointPolygon: function(points, indices) {
		var sumX = 0.0;
		var sumY = 0.0;
		var area = 0.0;
		for(var i = 0; i < points.length - 2; i += 2) {
			// var ii = indices[i];
			// var iii = indices[i+1];
			var p1 = [points[i], points[i+1]];
			var p2 = [points[i+2], points[i+3]];

			sumX += ((p1[0] + p2[0]) * ((p1[0] * p2[1]) - (p2[0] * p1[1])));
			sumY += ((p1[1] + p2[1]) * ((p1[0] * p2[1]) - (p2[0] * p1[1])));

			area += ((p1[0] * p2[1]) - (p2[0] * p1[1]));
		};

		area *= 0.5;

		sumX /= (6*area);
		sumY /= (6*area);
		return [sumX, sumY];
	},
	triangulatePoint: function(x, y) {
		var phi = +(90.0 - y) * Math.PI / 180.0;
	    var the = +(180.0 - x) * Math.PI / 180.0;
		
		var wx = Math.sin(the) * Math.sin(phi) * -1;
	    var wz = Math.cos(the) * Math.sin(phi);
	    var wy = Math.cos(phi);

	    return [wx, wy, wz];
	}
};