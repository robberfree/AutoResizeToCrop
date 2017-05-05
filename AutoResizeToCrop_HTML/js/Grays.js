function Grays(imageData, position) {
    this.width = imageData.width;
    this.height = imageData.height;
    this.data = imageData.data;

    if (position === undefined) {
        position = {
            minX: 0,
            maxX: this.width - 1,
            minY: 0,
            maxY: this.height - 1
        }
    }

    this.grays = new Array(this.width * (position.maxY + 1));//this.grays=[]，对于插值数组，读取速度太慢

    this.convertImageDataToGrays(position);
}

Grays.prototype = {
    convertImageDataToGrays: function (position) {
        for (var i = position.minY; i <= position.maxY; i++) {
            for (var j = position.minX; j <= position.maxX; j++) {
                var k = i * this.width + j;
                var m = k * 4;
                var gray = this.convertRgbToGray(this.data[m], this.data[m + 1], this.data[m + 2]);
                this.grays[k] = gray;
            }
        }
    },
    convertRgbToGray: function (r, g, b) {
        return (r * 0.299 + g * 0.587 + b * 0.114);//并不会比位运算慢
    },
    get: function (x, y) {
        var index = y * this.width + x;
        return this.grays[index];
    }
}