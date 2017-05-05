function SourceImgs() {
    this.imgs = {};
}

SourceImgs.prototype = {
    load: function (url, onCompleteHandler) {
        var img = document.createElement('img');
        img.onload = function () {
            this.imgs[url] = img;
            onCompleteHandler(img);

        }.bind(this);
        img.src = url;
    },
    get: function (url, onCompleteHandler) {
        var img = this.imgs[url];
        if (img === undefined) {
            this.load(url, onCompleteHandler);
        }
        else {
            onCompleteHandler(img);
        }
    }
}


