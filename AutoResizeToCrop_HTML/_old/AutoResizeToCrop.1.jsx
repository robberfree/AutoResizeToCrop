#target photoshop

//@include 'lib/json2.js'

var doc = app.activeDocument;
var dataUrl = Folder.desktop.fsName + '/AutoResizeToCrop/AutoResizeToCrop_HTML/data/data.json';
var templateDir = Folder.desktop.fsName + '/AutoResizeToCrop/AutoResizeToCrop_HTML/images/templates/';
var sourceDir = Folder.desktop.fsName + '/AutoResizeToCrop/AutoResizeToCrop_HTML/images/sources/';
var imgType = '.png';

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
            var sourceHasClippingMask = hasClippingMask(source);
            var templateIndex;
            if (sourceHasClippingMask) {
                if (layers.length < 3) {
                    alert('选定的组内至少包含两个有效图层', '包含正确数量的图层');
                    return;
                }
                templateIndex = 2;
            }
            else {
                templateIndex = 1;
            }

            var sourceBounds = getBoundsWithoutMask(source);
            var formatSourceBounds = formatBounds(sourceBounds);

            var template = layers[templateIndex];
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

            var templateName = 'template_' + getNameFormatByDate() + imgType;
            var templateUrl = templateDir + templateName;
            formatTemplateBounds = exportLayer(template, templateUrl);

            var sourceName = source.name + imgType;
            var sourceUrl = sourceDir + sourceName;
            exportSmartObject(source, sourceUrl);

            var data = {
                bannerWidth: doc.width.value,
                bannerHeight: doc.height.value,
                templateBounds: formatTemplateBounds,
                sourceBounds: formatSourceBounds,
                templateName: templateName,
                sourceName: sourceName
            }
            writeJSON(data, dataUrl);

            alert('数据已经导出到AutoResizeToCrop_HTML', '数据导出');
        }
    }
}

function getNameFormatByDate() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDay();
    var hour = now.getHours();
    var min = now.getMinutes();
    var sec = now.getSeconds();

    return year + '_' + month + '_' + day + '_' + hour + '_' + min + '_' + sec;
}

function writeJSON(obj, filePath) {
    var text = JSON.stringify(obj);
    var file = new File(filePath);
    file.open('w');
    file.write(text);
    file.close();
}

function hasClippingMask(layer) {
    doc.activeLayer = layer;

    try {//尝试释放clippingMask
        releaseClippingMask();
    }
    catch (e) {
        return false;
    }

    createClippingMask();

    return true;
}

function createClippingMask() {//应用clippingMask
    var idGrpL = charIDToTypeID("GrpL");
    var desc8392 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref2370 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref2370.putEnumerated(idLyr, idOrdn, idTrgt);
    desc8392.putReference(idnull, ref2370);
    executeAction(idGrpL, desc8392, DialogModes.NO);
}

function releaseClippingMask() {
    var idUngr = charIDToTypeID("Ungr");
    var desc8391 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref2369 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref2369.putEnumerated(idLyr, idOrdn, idTrgt);
    desc8391.putReference(idnull, ref2369);
    executeAction(idUngr, desc8391, DialogModes.NO);
}

function getBoundsWithoutMask(layer) {
    var layerMaskDensity = layer.layerMaskDensity;
    var vectorMaskDensity = layer.vectorMaskDensity;

    try {
        layer.layerMaskDensity = 0;
    }
    catch (e) { }
    try {
        layer.vectorMaskDensity = 0;
    }
    catch (e) { }
    try {
        doc.activeLayer = layer;
        releaseClippingMask();
    }
    catch (e) { }

    var bounds = layer.bounds;

    try {
        layer.layerMaskDensity = layerMaskDensity;
    }
    catch (e) { }
    try {
        layer.vectorMaskDensity = vectorMaskDensity;
    }
    catch (e) { }
    try {
        createClippingMask();
    }
    catch (e) { }

    return bounds;
}

function valueBounds(bounds) {
    var left = bounds[0].value;
    var top = bounds[1].value;
    var right = bounds[2].value;
    var bottom = bounds[3].value;
    return [left, top, right, bottom];
}

function formatBounds(bounds, needValueBounds) {
    needValueBounds = needValueBounds === undefined ? true : needValueBounds;
    if (needValueBounds)
        bounds = valueBounds(bounds);
    return {
        x: bounds[0],
        y: bounds[1],
        w: bounds[2] - bounds[0],
        h: bounds[3] - bounds[1]
    }
}

function contains(boundsP, boundsC) {
    return boundsC[0] >= boundsP[0] &&
        boundsC[1] >= boundsP[1] &&
        boundsC[2] <= boundsP[2] &&
        boundsC[3] <= boundsP[3]
}

function trimBouns(boundsP, boundsC) {
    var left = boundsP[0];
    var top = boundsP[1];
    var right = boundsP[2];
    var bottom = boundsP[3];
    if (boundsC[0] > boundsP[0] && boundsC[0] < boundsP[2])
        left = boundsC[0];
    if (boundsC[1] > boundsP[1] && boundsC[1] < boundsP[3])
        top = boundsC[1];
    if (boundsC[2] > boundsP[0] && boundsC[2] < boundsP[2])
        right = boundsC[2];
    if (boundsC[3] > boundsP[1] && boundsC[3] < boundsP[3])
        bottom = boundsC[3];

    return [left, top, right, bottom];
}

//导出图层到指定地址
function exportLayer(layer, url) {
    var duplicateLayer = layer.duplicate();//复制图层

    var emptyLayer = doc.artLayers.add();//新建空白图层
    emptyLayer.move(duplicateLayer, ElementPlacement.PLACEAFTER);

    duplicateLayer = duplicateLayer.merge();//复制的图层向下合并 

    var boundsC = valueBounds(duplicateLayer.bounds);
    var boundsP = [0, 0, doc.width.value, doc.height.value];
    var templateBounds = trimBouns(boundsP, boundsC);
    templateBounds = formatBounds(templateBounds, false);

    duplicateLayer.copy();//ctrl+c

    var templateDoc = app.documents.add(templateBounds.w, templateBounds.h, 72);//ctrl+n

    templateDoc.paste();//ctrl+v

    savePNG(templateDoc, url);//save

    templateDoc.close(SaveOptions.DONOTSAVECHANGES);//恢复如初
    duplicateLayer.remove();

    return templateBounds;
}

function savePNG(doc, url) {
    var file = new File(url);
    var options = new PNGSaveOptions();
    doc.saveAs(file, options, true, Extension.LOWERCASE);
}
//导出智能对象的内容到指定地址
function exportSmartObject2(layer, url) {
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

function exportSmartObject(layer, url) {
    doc.activeLayer = layer;
    //编辑内容
    var idplacedLayerEditContents = stringIDToTypeID("placedLayerEditContents");
    var desc2937 = new ActionDescriptor();
    executeAction(idplacedLayerEditContents, desc2937, DialogModes.NO);
    //引用sourceDoc
    var sourceDoc = app.activeDocument;
    //检测sourceDoc的dpi,确保为72
    var resolution = sourceDoc.resolution;
    if (resolution != 72) {
        var width = 72 / resolution * sourceDoc.width.value;
        var height = 72 / resolution * sourceDoc.height.value;
        sourceDoc.resizeImage(width, height, 72);
    }
    //存储sourceImage
    savePNG(sourceDoc, url)
    //关闭sourceDoc
    sourceDoc.close(SaveOptions.DONOTSAVECHANGES);
}