function Timer(text, bar) {
    this.text = text;
    this.bar = bar;
    this.unitBySecond = 10;
}

Timer.prototype = {
    start: function () {
        this.startTime = Date.now();
    },
    stop: function () {
        this.setIndicator(Date.now() - this.startTime);
    },
    setIndicator: function (offsetTime) {
        var offsetScondTime = Util.fixedFloat(offsetTime / 1000);
        var width = offsetScondTime * this.unitBySecond;
        if (width < 1) {
            width = 1;
        }
        this.text.textContent = offsetScondTime + 'S';
        this.bar.style.width = width + 'px';

    }
}