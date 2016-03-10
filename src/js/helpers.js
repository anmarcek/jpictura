var jpictura = jpictura || {};

jpictura.debounce = function (func, wait, immediate) {
    var timeout;

    return function () {
        var context = this;
        var args = arguments;

        var later = function () {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };

        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
};

jpictura.throttle = function (func, wait, leading, trailing) {
    var timeout;
    var context;
    var args;
    var result;
    var previous = 0;

    leading = leading ? leading : false;
    trailing = trailing ? trailing : true;

    var later = function () {
        previous = leading === false ? 0 : new Date().getTime();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) {
            context = null;
            args = null;
        }
    };

    return function () {
        var now = new Date().getTime();

        if (!previous && leading === false) {
            previous = now;
        }
        var remaining = wait - (now - previous);

        context = this;
        args = arguments;

        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout) {
                context = null;
                args = null;
            }
        } else if (!timeout && trailing !== false) {
            timeout = setTimeout(later, remaining);
        }

        return result;
    };
};

jpictura.offWindowWidthResize = function (eventNamespace) {
    $(window).off('.' + eventNamespace);
};

jpictura.onWindowWidthResize = function (eventNamespace, callback) {
    var $window = $(window);
    var lastWindowWidth = $window.width();
    $window.on('resize.' + eventNamespace, function () {
        var windowWidth = $window.width();
        if (lastWindowWidth !== windowWidth) {
            callback();
            lastWindowWidth = windowWidth;
        }
    });
};