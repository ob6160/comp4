function vec2(x, y) {
    this.x = x;
    this.y = y;
}

vec2.prototype.multiply = function(vec) {
    if (vec instanceof vec2) {
        this.x *= vec.x;
        this.y *= vec.y;
    } else {
        this.x *= vec;
        this.y *= vec;
    }

    return new vec2(this.x, this.y);
};

vec2.prototype.subtract = function(vec) {
    if (vec instanceof vec2) {
        this.x -= vec.x;
        this.y -= vec.y;
    } else {
        this.x -= vec;
        this.y -= vec;
    }
    return new vec2(this.x, this.y);
};

vec2.prototype.add = function(vec) {
    if (vec instanceof vec2) {
        this.x += vec.x;
        this.y += vec.y;
    } else {
        this.x += vec;
        this.y += vec;
    }
    return new vec2(this.x, this.y);
};

vec2.prototype.divide = function(vec) {
    if (vec instanceof vec2) {
        this.x /= vec.x;
        this.y /= vec.y;
    } else {
        this.x /= vec;
        this.y /= vec;
    }
    return new vec2(this.x, this.y);
};

vec2.prototype.distance = function(vec) {
    var dist = Math.sqrt(((this.x - vec.x) * (this.x - vec.x)) + ((this.y - vec.y) * (this.y - vec.y)));
    return dist;
};

module.exports = vec2;