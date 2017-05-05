function TemplateMatch(templateImg, templateCanvas, sourceImg, sourceCanvas, data) {
    this.scaleDuration = CONFIG.scaleDuration || 0.01;
    this.scaleStep = 0.0001;
    this.positionDuration = CONFIG.positionDuration || 5;

    this.data = data;

    this.initTemplate(templateImg, templateCanvas);
    this.initSource(sourceImg, sourceCanvas);
}

TemplateMatch.prototype = {
    initTemplate: function (templateImg, templateCanvas) {
        this.templateWidth = templateCanvas.width = templateImg.width;
        this.templateHeight = templateCanvas.height = templateImg.height;

        templateCanvas.style.left = this.data.templateBounds.x + "px";
        templateCanvas.style.top = this.data.templateBounds.y + 'px';

        this.templateGrays = new Grays(this.drawImg(templateCanvas.getContext('2d'), templateImg, 1, true));
    },
    initSource: function (sourceImg, sourceCanvas) {
        sourceCanvas.width = sourceImg.width;
        sourceCanvas.height = sourceImg.height;

        this.sourceImg = sourceImg;
        this.sourceCanvas = sourceCanvas;
        this.sourceContext = sourceCanvas.getContext('2d');
    },
    //计算大图的缩放范围
    caculateScale: function () {
        var scaleWidth = Util.fixedFloat(this.data.sourceBounds.w / this.sourceImg.width);
        var scaleHeight = Util.fixedFloat(this.data.sourceBounds.h / this.sourceImg.height);
        if (Math.abs(scaleWidth - scaleHeight) > 0.001) {
            alert('大图似乎没有锁定缩放比例');
        }

        var scaleMin = scaleWidth - this.scaleDuration;
        scaleMin = scaleMin <= 0 ? this.scaleStep : scaleMin;
        scaleMin = Util.fixedFloat(scaleMin);

        var scaleMax = scaleWidth + this.scaleDuration;
        scaleMax = scaleMax > 1 ? 1 : scaleMax;
        scaleMax = Util.fixedFloat(scaleMax);

        return {
            min: scaleMin,
            init: scaleWidth,
            max: scaleMax
        }
    },
    matchTemplateScales: function () {
        var scale = this.caculateScale();

        //计算已经在ps里对图的结果，作为计算的基准数据
        var result = this.matchTemplateScale(scale.init);

        for (var s = scale.min; s <= scale.max; s += this.scaleStep) {
            s = Util.fixedFloat(s);
            if (s === scale.init)
                continue;

            var resultScale = this.matchTemplateScale(s);

            if (resultScale.differences < result.differences) {
                result = resultScale;
            }
        }

        result.x = data.templateBounds.x - result.x;
        result.y = data.templateBounds.y - result.y;

        //绘制最优解
        this.drawImg(this.sourceContext, this.sourceImg, result.scale);
        this.sourceCanvas.style.left = result.x + 'px';
        this.sourceCanvas.style.top = result.y + 'px';

        return result;
    },
    matchTemplateScale: function (scale) {
        var sourceImageData = this.drawImg(this.sourceContext, this.sourceImg, scale, true);

        var result = this.matchTemplate(sourceImageData);
        result.scale = scale;

        return result;
    },
    matchTemplate: function (sourceImageData) {
        var result = {
            x: -1,
            y: -1,
            differences: Infinity,
        }
        //模版图像在原图像匹配时，可以放置的x轴和y轴位置
        var position = this.caculatePosition(sourceImageData.width, sourceImageData.height);
        if (position !== false) {
            var sourceGrays = new Grays(sourceImageData, {
                minX: position.minX,
                maxX: position.maxX + this.templateWidth - 1,
                minY: position.minY,
                maxY: position.maxY + this.templateHeight - 1
            });

            for (var x = position.minX; x <= position.maxX; x++) {
                for (var y = position.minY; y <= position.maxY; y++) {
                    //以(x,y)位置做一次匹配
                    var differences = 0;
                    LOOP_XY: for (var i = 0; i < this.templateHeight; i++) {
                        for (var j = 0; j < this.templateWidth; j++) {
                            var templateGray = this.templateGrays.get(j, i);
                            var sourceGray = sourceGrays.get(j + x, i + y);

                            var difference = this.caculateGrayDifference(templateGray, sourceGray);
                            differences += difference;

                            if (differences >= result.differences) {//此时没有继续计算的必要了
                                break LOOP_XY;
                            }
                        }
                    }
                    if (differences < result.differences) {
                        result.differences = differences;
                        result.x = x;
                        result.y = y;
                    }
                }
            }
        }

        return result;
    },
    caculateGrayDifference: function (gray1, gray2) {
        var offsetGray = gray1 - gray2;
        return offsetGray * offsetGray;
    },
    //计算大图在特定缩放值下的起始位置范围
    caculatePosition: function (sourceWidth, sourceHeight) {
        //方法1
        var minX = 0;
        var maxX = sourceWidth - this.templateWidth;
        var minY = 0;
        var maxY = sourceHeight - this.templateHeight;

        //源图像矩形框>模版图像矩形框
        if (maxX < 0 || maxY < 0)
            return false;

        //方法2进一步修正，提高计算效率
        var ratioX = (this.data.templateBounds.x - this.data.sourceBounds.x) / this.data.sourceBounds.w;
        var ratioY = (this.data.templateBounds.y - this.data.sourceBounds.y) / this.data.sourceBounds.h;
        if (ratioX >= 0 && ratioY >= 0) {
            var x = Math.round(ratioX * sourceWidth);
            var y = Math.round(ratioY * sourceHeight);
            var minX2 = x - this.positionDuration;
            var maxX2 = x + this.positionDuration;
            var minY2 = y - this.positionDuration;
            var maxY2 = y + this.positionDuration;

            //综合方法1和方法2
            minX = Math.max(minX, minX2);
            maxX = Math.min(maxX, maxX2);
            minY = Math.max(minY, minY2);
            maxY = Math.min(maxY, maxY2);
        }

        return {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY,
        }
    },
    drawImg: function (context, img, scale, returnImageData) {
        scale = scale === undefined ? 1 : scale;
        returnImageData = returnImageData === undefined ? false : returnImageData;

        context.save();//存储未应用scale（）之前的状态，scale（）基于上一次的scale（），重要

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        context.scale(scale, scale);
        context.drawImage(img, 0, 0);

        context.restore();//恢复状态

        if (returnImageData) {
            return context.getImageData(0, 0, img.width * scale, img.height * scale);
        }
    }

}