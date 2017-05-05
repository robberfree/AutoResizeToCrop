var Util = {
    fixedFloat: function (num, digits) {
        digits = digits === undefined ? 4 : digits;
        return parseFloat(num.toFixed(digits));
    }
}