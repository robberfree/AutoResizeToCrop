var loadStartTime = Date.now();

var data;
var scaleDuration = 0.01;
var scaleStep = 0.0001;
var positionDuration = 5;

var sourceImgs = new SourceImgs();
var sourceImg;

var templateImg;
var templateGrays;
var templateWidth;
var templateHeight;

window.addEventListener('load', loadHandler);
function loadHandler() {
    console.log('加载完成', (Date.now() - loadStartTime) / 1000);

    loadData('../data/data.json', loadedDataHandler);
}

function loadData(url, onCompleteHandler) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            var data = JSON.parse(request.responseText);
            onCompleteHandler(data);
        } else {
            console.log('We reached our target server, but it returned an error');
        }
    };

    request.onerror = function () {
        console.log('There was a connection error of some sort');
    };

    request.send();
}

function loadedDataHandler(_data) {
    data = _data;
    setupBanner();

    loadSourceImg('../images/sources/source.png', function () {
        loadTemplateImg('../images/template.png', function () {
            drawTemplate();

            var startTime = Date.now();

            var result = matchTemplateScales();

            console.log((Date.now() - startTime) / 1000, result);
        });
    });
}

function setupBanner() {
    var banner = document.querySelector('.banner');
    banner.style.width = data.bannerWidth + 'px';
    banner.style.height = data.bannerHeight + 'px';
}

function loadSourceImg(url, onCompleteHandler) {
    sourceImgs.get(url, function (img) {
        sourceImg = img;

        onCompleteHandler();
    });
}

function loadTemplateImg(url, onCompleteHandler) {
    var img = document.createElement('img');
    img.onload = function () {
        templateImg = img;

        onCompleteHandler();
    }
    img.src = url;
}

function drawTemplate() {
    var canvas = document.querySelector('.template-canvas');
    canvas.width = templateWidth = templateImg.width;
    canvas.height = templateHeight = templateImg.height;
    canvas.style.left = data.templateBounds.x + "px";
    canvas.style.top = data.templateBounds.y + 'px';

    var context = canvas.getContext('2d');
    context.drawImage(templateImg, 0, 0);

    templateGrays = new Grays(context.getImageData(0, 0, templateWidth, templateHeight));
}

function matchTemplateScales() {
    var canvas = document.querySelector('.source-canvas');
    canvas.width = sourceImg.width;
    canvas.height = sourceImg.height;

    context = canvas.getContext('2d');

    var scale = caculateScale();

    //计算已经在ps里对图的结果，作为计算的基准数据
    var result = matchTemplateScale(context, sourceImg, scale.init);


    for (var s = scale.min; s <= scale.max; s += scaleStep) {
        s = fixedFloat(s);
        if (s === scale.init)
            continue;

        var resultScale = matchTemplateScale(context, sourceImg, s);
        console.log(resultScale);
        if (resultScale.differences < result.differences) {
            result = resultScale;
        }
    }

    result.x = data.templateBounds.x - result.x;
    result.y = data.templateBounds.y - result.y;

    //绘制最优解
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    context.scale(result.scale, result.scale);
    context.drawImage(sourceImg, 0, 0);
    canvas.style.left = result.x + 'px';
    canvas.style.top = result.y + 'px';

    return result;
}

function matchTemplateScale(sourceContext, sourceImg, scale) {

    sourceContext.save();//存储未应用scale（）之前的状态，scale（）基于上一次的scale（），重要

    sourceContext.clearRect(0, 0, sourceContext.canvas.width, sourceContext.canvas.height);
    sourceContext.scale(scale, scale);
    sourceContext.drawImage(sourceImg, 0, 0);

    var sourceImageData = sourceContext.getImageData(0, 0, sourceImg.width * scale, sourceImg.height * scale);

    sourceContext.restore();//恢复状态

    var result = matchTemplate(sourceImageData);
    result.scale = scale;

    return result;
}

function matchTemplate(sourceImageData) {
    var result = {
        x: -1,
        y: -1,
        differences: Infinity,
    }
    //模版图像在原图像匹配时，可以放置的x轴和y轴位置
    var position = caculatePosition(sourceImageData.width, sourceImageData.height);
    console.log(position);
    if (position !== false) {
        var sourceGrays = new Grays(sourceImageData, {
            minX: position.minX,
            maxX: position.maxX + templateWidth - 1,
            minY: position.minY,
            maxY: position.maxY + templateHeight - 1
        });

        for (var x = position.minX; x <= position.maxX; x++) {
            for (var y = position.minY; y <= position.maxY; y++) {
                //以(x,y)位置做一次匹配
                var differences = 0;
                LOOP_XY: for (var i = 0; i < templateHeight; i++) {
                    for (var j = 0; j < templateWidth; j++) {
                        var templateGray = templateGrays.get(j, i);
                        var sourceGray = sourceGrays.get(j + x, i + y);

                        var difference = caculateGrayDifference(templateGray, sourceGray);
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
}

function caculateGrayDifference(gray1, gray2) {
    var offsetGray = gray1 - gray2;
    return offsetGray * offsetGray;
}

//计算大图的缩放范围
function caculateScale() {
    var scaleWidth = fixedFloat((data.sourceBounds.w / sourceImg.width));
    var scaleHeight = fixedFloat((data.sourceBounds.h / sourceImg.height));

    if (Math.abs(scaleWidth - scaleHeight) > 0.001) {
        alert('ps里的大图似乎没有锁定缩放比例');
    }

    var scaleMin = scaleWidth - scaleDuration;
    scaleMin = scaleMin <= 0 ? scaleStep : scaleMin;
    scaleMin = fixedFloat(scaleMin);

    var scaleMax = scaleWidth + scaleDuration;
    scaleMax = scaleMax > 1 ? 1 : scaleMax;
    scaleMax = fixedFloat(scaleMax);

    return {
        min: scaleMin,
        init: scaleWidth,
        max: scaleMax
    }
}

//计算大图在特定缩放值下的起始位置范围
function caculatePosition(sourceWidth, sourceHeight) {
    //方法1
    var minX = 0;
    var maxX = sourceWidth - templateWidth;
    var minY = 0;
    var maxY = sourceHeight - templateHeight;

    //源图像矩形框>模版图像矩形框
    if (maxX < 0 || maxY < 0)
        return false;

    //方法2进一步修正，提高计算效率
    var ratioX = (data.templateBounds.x - data.sourceBounds.x) / data.sourceBounds.w;
    var ratioY = (data.templateBounds.y - data.sourceBounds.y) / data.sourceBounds.h;
    if (ratioX >= 0 && ratioY >= 0) {
        var x = Math.round(ratioX * sourceWidth);
        var y = Math.round(ratioY * sourceHeight);
        var minX2 = x - positionDuration;
        var maxX2 = x + positionDuration;
        var minY2 = y - positionDuration;
        var maxY2 = y + positionDuration;

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
}

function fixedFloat(num, digits) {
    digits = digits === undefined ? 4 : digits;
    return parseFloat(num.toFixed(digits));
}
