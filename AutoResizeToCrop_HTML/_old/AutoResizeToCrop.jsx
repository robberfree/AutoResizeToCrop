#target photoshop

//@include 'lib/json2.js'

var doc = app.activeDocument;
var templateOutputPath = Folder.desktop.fsName + '/AutoResizeToCrop/AutoResizeToCrop_HTML/images/template.png';
var dataOutputPath = Folder.desktop.fsName + '/AutoResizeToCrop/AutoResizeToCrop_HTML/data/data.json';
var sourceDir = Folder.desktop.fsName + '/AutoResizeToCrop/AutoResizeToCrop_HTML/images/sources/';

main();
//读取选定的图层
function main() {
    var selectGroup = doc.activeLayer;
    if (selectGroup === undefined || selectGroup.typename !== 'LayerSet') {
        alert('请选定一个组', '选定一个组');
        return;
    }
    else {
        var layers = selectGroup.layers;
        if (layers.length < 2) {
            alert('选定的组内至少包含两个图层', '包含正确数量的图层');
            return;
        }
        else {
            var source = layers[0];
            var sourceBounds = source.bounds;
            var formatSourceBounds = formatBounds(sourceBounds);

            var template = layers[1];
            var templateBounds = template.bounds;
            var formatTemplateBounds = formatBounds(templateBounds);

            if (formatSourceBounds.w === 0 || formatSourceBounds.h === 0) {
                alert('大图不能为空', '图层不能为空');
                return;
            }
            if (formatTemplateBounds.w === 0 || formatTemplateBounds.h === 0) {
                alert('切图不能为空', '图层不能为空');
                return;
            }
            if (!contains(sourceBounds, templateBounds)) {
                alert('已对图状态：切图尺寸 > 大图尺寸,请检查', '大图的尺寸不满足切图');
                return;
            }


            var visibleStates = readVisible();//所有图层和组的初始显示状态

            exportLayer(template, templateOutputPath);

            var sourceName = source.name + '.jpg';
            var sourceUrl = sourceDir + sourceName;
            exportSmartObject(source, sourceUrl);

            setVisible(visibleStates);

            var data = {
                bannerWidth: doc.width.value,
                bannerHeight: doc.height.value,
                templateBounds: formatTemplateBounds,
                sourceBounds: formatSourceBounds,
                sourceName: sourceName
            }

            writeJSON(data, dataOutputPath);

            alert('数据已经导出到AutoResizeToCrop_HTML', '数据导出');
        }
    }
}

function writeJSON(obj, filePath) {
    var text = JSON.stringify(obj);
    var file = new File(filePath);
    file.open('w');
    file.write(text);
    file.close();
}

function contains(boundsP, boundsC) {
    return boundsC[0] >= boundsP[0] &&
        boundsC[1] >= boundsP[1] &&
        boundsC[2] <= boundsP[2] &&
        boundsC[3] <= boundsP[3]
}

function valueBounds(bounds) {
    var left = bounds[0].value;
    var top = bounds[1].value;
    var right = bounds[2].value;
    var bottom = bounds[3].value;
    return [left, top, right, bottom];
}

function formatBounds(bounds) {
    bounds = valueBounds(bounds);
    return {
        x: bounds[0],
        y: bounds[1],
        w: bounds[2] - bounds[0],
        h: bounds[3] - bounds[1]
    }
}

//导出指定图层到指定路径
function exportLayer(layer, filePath) {
    var docW = doc.width.value;
    var docH = doc.height.value;

    var bounds = layer.bounds;
    var vBounds = valueBounds(bounds);
    var reverseBounds = [
        -vBounds[0],
        -vBounds[1],
        docW - vBounds[0],
        docH - vBounds[1]
    ]

    doc.crop(bounds);
    onlyVisible(layer);
    savePNG(filePath);

    doc.crop(reverseBounds);
}

function savePNG(filePath) {
    var file = new File(filePath);
    var options = new PNGSaveOptions();
    doc.saveAs(file, options, true, Extension.LOWERCASE);
}
//导出sourceImage
function exportSmartObject(layer, url) {
    doc.activeLayer = layer;

    //导出内容
    var idplacedLayerExportContents = stringIDToTypeID("placedLayerExportContents");
    var desc233 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    desc233.putPath(idnull, new File(url));
    executeAction(idplacedLayerExportContents, desc233, DialogModes.NO);
    //在ps里打开图片
    var sourceDoc = app.open(new File(url), OpenDocumentType.JPEG, false);
    //检测sourceDoc的dpi,确保为72
    var resolution = sourceDoc.resolution;
    if (resolution != 72) {
        var width = 72 / resolution * sourceDoc.width.value;
        var height = 72 / resolution * sourceDoc.height.value;
        sourceDoc.resizeImage(width, height, 72);

        sourceDoc.save();
    }
    //关闭sourceDoc
    sourceDoc.close();
}

/**
 * 读取所有图层、组的显示状态
 */
function readVisible() {
    var layers = [];
    var visibles = [];

    readGroupVisible(doc);

    function readGroupVisible(group) {
        var lys = group.layers;
        var len = lys.length;
        for (var i = 0; i < len; i++) {
            var layer = lys[i];
            var visible = layer.visible;

            layers.push(layer);
            visibles.push(visible);

            if (layer.typename === 'LayerSet') {
                readGroupVisible(layer);
            }
        }
    }

    return {
        layers: layers,
        visibles: visibles
    };

}

/**
 * 设置所有图层、组的显示状态
 */
function setVisible(visibleStates) {
    var layers = visibleStates.layers;
    var visibles = visibleStates.visibles;
    var len = layers.length;
    for (var i = 0; i < len; i++) {
        var layer = layers[i];
        var visible = visibles[i];
        layer.visible = visible;
    }
}

/**
 * 仅让该layer显示,
 */
function onlyVisible(layer) {
    readGroupVisible(doc);

    function readGroupVisible(group) {
        var lys = group.layers;
        var len = lys.length;
        for (var i = 0; i < len; i++) {
            var layer = lys[i];

            if (layer.typename === 'ArtLayer') {
                layer.visible = false;
            }
            else if (layer.typename === 'LayerSet') {
                readGroupVisible(layer);
            }
        }
    }

    layer.visible = true;
}