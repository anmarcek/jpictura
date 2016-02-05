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

jpictura.onWindowWidthResize = function (callback) {
    var $window = $(window);
    var lastWindowWidth = $window.width();
    $window.resize(function () {
        var windowWidth = $window.width();
        if (lastWindowWidth !== windowWidth) {
            callback();
            lastWindowWidth = windowWidth;
        }
    });
};
var jpictura = jpictura || {};

jpictura.heightCalculator = function (getItemsWidthForHeightFunc, logFunc, opts) {
    var log = logFunc;
    var getItemsWidthForHeight = getItemsWidthForHeightFunc;
    var options = opts;

    var minHeight;
    var maxHeight;
    var pivotHeight;

    this.getHeight = function (row, desiredItemsWidth) {
        if (row.length === 0) {
            return (0);
        }

        initialize(desiredItemsWidth);

        var height = calculateHeight(row, desiredItemsWidth);
        height = roundHeight(height, row, desiredItemsWidth);

        return height;
    };

    function initialize(desiredItemsWidth) {
        setInitialMinHeight(desiredItemsWidth);
        setInitialMaxHeight(desiredItemsWidth);
        setPivotHeight();
    }

    function setInitialMinHeight(desiredItemsWidth) {
        var epsilon = 0;
        var ho = options.layout.idealRowHeight;
        var rMax = options.layout.maxWidthHeightRatio;
        minHeight = desiredItemsWidth / (((desiredItemsWidth - epsilon) / ho) + rMax);
    }

    function setInitialMaxHeight(desiredItemsWidth) {
        var epsilon = 0;
        var ho = options.layout.idealRowHeight;
        var rMax = options.layout.maxWidthHeightRatio;

        if (rMax * ho >= desiredItemsWidth) {
            if (options.debug) {
                log("The max width/height ratio " + rMax + " is too big for row width " + desiredItemsWidth + "px.");
            }
            maxHeight = desiredItemsWidth * rMax;
        } else {
            maxHeight = desiredItemsWidth / (((desiredItemsWidth + epsilon) / ho) - rMax);
        }
    }

    function calculateHeight(row, desiredItemsWidth) {
        var i = 0;
        var itemsWidth;
        var continueApproximation;

        do {
            itemsWidth = getItemsWidthForHeight(row, pivotHeight, false, options);

            if (itemsWidth > desiredItemsWidth) {
                maxHeight = pivotHeight;
            } else {
                minHeight = pivotHeight;
            }
            setPivotHeight(minHeight, maxHeight);

            continueApproximation = false;
            if (desiredItemsWidth < itemsWidth) {
                continueApproximation = true;
            }
            if ((desiredItemsWidth - itemsWidth) > options.algorithm.epsilon) {
                continueApproximation = true;
            }
            if ((++i) >= options.algorithm.maxIterationCount) {
                continueApproximation = false;
            }
        } while (continueApproximation);

        if ((i >= options.algorithm.maxIterationCount) && (options.debug)) {
            log('Max ' + i + ' iterations reached. Current precision: ' + (desiredItemsWidth - itemsWidth) + '.');
        }

        return pivotHeight;
    }

    function setPivotHeight() {
        pivotHeight = (minHeight + maxHeight) / 2;
    }

    function roundHeight(height, row, desiredItemsWidth) {
        height = Math.floor(height);

        var itemsWidth;
        do {
            itemsWidth = getItemsWidthForHeight(row, height, true, options);
        } while (itemsWidth < desiredItemsWidth && height++);

        return height;
    }
}
/*!
 * jPictura v1.1.9
 * https://github.com/anmarcek/jpictura.git
 *
 * Copyright (c) 2014-2016 Anton Marček
 * Released under the MIT license
 *
 * Date: 2016-02-05T15:14:47.916Z
 */

var jpictura = jpictura || {};

(function ($) {

    $.fn.jpictura = function (options) {
        var opts = $.extend(true, {}, $.fn.jpictura.defaults, options);

        this.each(function () {
            createGallery($(this), opts);
        });

        return (this);
    };

    var name = 'jPictura';
    var nameInLowerCase = name.toLowerCase();

    $.fn.jpictura.defaults = {
        selectors: {
            item: '.item',
            image: 'img'
        },
        classes: {
            container: nameInLowerCase,
            item: nameInLowerCase + '-item',
            image: nameInLowerCase + '-image',
            lastRow: nameInLowerCase + '-last-row',
            firstInRow: nameInLowerCase + '-first-in-row',
            lastInRow: nameInLowerCase + '-last-in-row',
            invisible: nameInLowerCase + '-invisible'
        },
        layout: {
            rowPadding: 0,
            applyRowPadding: true,
            itemSpacing: 5,
            applyItemSpacing: true,
            idealRowHeight: 180,
            minWidthHeightRatio: 1 / 3,
            maxWidthHeightRatio: 3,
            stretchImages: true,
            allowCropping: true,
            croppingEpsilon: 3,
            centerImages: true,
            justifyLastRow: false
        },
        effects: {
            fadeInItems: false
        },
        responsive: true,
        waitForImages: true,
        heightCalculator: jpictura.heightCalculator,
        algorithm: {
            epsilon: 0.01,
            maxIterationCount: 100
        },
        debug: false
    };

    $.fn.jpictura.evaluate = function (height, options) {
        return (Math.abs(height - options.layout.idealRowHeight));
    };

    function createGallery($container, options) {
        $container.addClass(options.classes.container);
        if (options.layout.stretchImages) {
            $container.addClass('stretch-images');
        }
        if (options.layout.centerImages) {
            $container.addClass('center-images');
        }
        if (!options.layout.allowCropping) {
            $container.addClass('disable-cropping-images');
        }
        if (options.effects.fadeInItems) {
            $container.addClass('fade-in-items');
        }

        var $items = $container.find(options.selectors.item);
        $items.addClass(options.classes.item);
        $items.addClass(options.classes.invisible);

        var $images = $items.find(options.selectors.image);
        $images.addClass(options.classes.image);

        waitForImagesIfRequired($container, $items, options, createGalleryFromItems);
    }

    function waitForImagesIfRequired($container, $items, options, callback) {
        if (options.waitForImages) {
            waitForImages($container, $items, options, callback);
        } else {
            callback($container, $items, options);
        }
    }

    function waitForImages($container, $items, options, callback) {
        var loadedImagesCount = 0;

        $items.each(function () {
            var $item = $(this);
            var $image = $item.find(options.selectors.image);

            var image = new Image();
            image.src = $image.attr('src');
            $(image).load(function () {
                imageLoadedCallback($item, image);
            });
        });

        function imageLoadedCallback($item, image) {
            var ratio = image.width / image.height;
            setItemWidthHeightRatio($item, ratio);

            if (++loadedImagesCount === $items.size()) {
                callback($container, $items, options);
            }
        }
    }

    function createGalleryFromItems($container, $items, options) {
        //TODO AnMa Important: Consider throttle instead of debounce - or make it configurable.
        var debouncedRedrawGallery = jpictura.debounce(function () {
            redrawGallery($container, $items, options);
        }, 250);

        if (options.responsive) {
            jpictura.onWindowWidthResize(debouncedRedrawGallery);
        }

        debouncedRedrawGallery();
    }

    function redrawGallery($container, $items, options) {
        var startTime = new Date().getTime();

        var itemsCount = $items.size();

        var row = [];
        var rowWidth = $container.width() - 2 * options.layout.rowPadding;
        var heightCalculator = new options.heightCalculator(getItemsWidthForHeight, log, options);

        $items.each(function (itemIndex) {
            var $item = $(this);
            var isLastItem = ((itemIndex + 1) === itemsCount);

            if (row.length === 0) {
                row.push($item);
            } else {
                var rowWithNewItem = row.slice(0);
                rowWithNewItem.push($item);

                if (!rowIsFull(rowWithNewItem, rowWidth, options)) {
                    row.push($item);
                } else {
                    var currentRowHeight = getRowHeight(row, rowWidth, heightCalculator, options);
                    var rowWithNewItemHeight = getRowHeight(rowWithNewItem, rowWidth, heightCalculator, options);
                    var currentRowPenalty = $.fn.jpictura.evaluate(currentRowHeight, options);
                    var rowWithNewItemPenalty = $.fn.jpictura.evaluate(rowWithNewItemHeight, options);
                    if (currentRowPenalty > rowWithNewItemPenalty) {
                        row.push($item);
                    } else {
                        revealRow(row, rowWidth, currentRowHeight, isLastItem, options);
                        row = [];
                        row.push($item);
                    }
                }
            }
        });

        var lastRowHeight = (!rowIsFull(row, rowWidth, options) && !options.layout.justifyLastRow)
            ? options.layout.idealRowHeight
            : getRowHeight(row, rowWidth, heightCalculator, options);
        revealRow(row, rowWidth, lastRowHeight, true, options);

        var endTime = new Date().getTime();
        if (options.debug) {
            log('Gallery created in ' + (endTime - startTime) + ' milliseconds.');
        }
    }

    function rowIsFull(row, rowWidth, options) {
        var usedRowWidth = (row.length - 1) * options.layout.itemSpacing;
        for (var i = 0; i < row.length; i++) {
            usedRowWidth += getItemWidthForHeight(row[i], options.layout.idealRowHeight, options);
        }
        return (usedRowWidth > rowWidth);
    }

    function getRowHeight(row, rowWidth, heightCalculator, options) {
        var desiredItemsWidth = getItemsSpaceWidth(row, rowWidth, options);
        var height = heightCalculator.getHeight(row, desiredItemsWidth);
        return height;
    }

    function revealRow(row, width, height, isLastRow, options) {
        var itemsWidth = getItemsWidthForHeight(row, height, true, options);
        var itemsSpaceWidth = getItemsSpaceWidth(row, width, options);

        var rowInfo = {
            row: row,
            width: width,
            height: height,
            isLastRow: isLastRow,
            itemsSpaceWidth: itemsSpaceWidth,
            itemsWidthDelta: itemsWidth - itemsSpaceWidth,
            unassignedItemsWidthDelta: itemsWidth - itemsSpaceWidth
        };

        var rowSortedFromWidestItem = getRowSortedFromWidestItem(row, options);
        for (var i = 0; i < rowSortedFromWidestItem.length; i++) {
            revealItem(rowSortedFromWidestItem[i], rowInfo, options);
        }
    }

    function getRowSortedFromWidestItem(row, options) {
        var rowSortedFromWidestItem = row.slice(0);

        rowSortedFromWidestItem.sort(function ($item1, $item2) {
            return getItemWidthHeightRatio($item2, true, options) - getItemWidthHeightRatio($item1, true, options);
        });

        return rowSortedFromWidestItem;
    }

    function revealItem($item, rowInfo, options) {
        var row = rowInfo.row;

        var isLastRow = rowInfo.isLastRow;
        var isFirstInRow = $item === row[0];
        var isLastInRow = $item === row[row.length - 1];
        var itemWidth = getItemWidth($item, rowInfo, options);
        var itemHeight = rowInfo.height;

        var $img = $item.find(options.selectors.image);

        addWidthHeightStyles($item, itemWidth, itemHeight);
        removeInvisibilityClass($item, options);
        addGridPositionClasses($item, isLastRow, isFirstInRow, isLastInRow, options);
        addRowPaddingStyles($item, isFirstInRow, isLastInRow, options);
        addItemSpacingStyles($item, isLastInRow, isLastRow, options);
        addStretchingClasses($item, itemWidth, itemHeight, options);
        addMisfitClasses($img, itemWidth, itemHeight, options);
    }

    function getItemWidth($item, rowInfo, options) {
        var rawItemWidth = getItemWidthForHeight($item, rowInfo.height, options);
        var delta = subtractWidthDeltaForItem(rawItemWidth, rowInfo);
        var itemWidth = Math.floor(rawItemWidth) - delta;
        return itemWidth;
    }

    function subtractWidthDeltaForItem(itemWidth, rowInfo) {
        if (rowInfo.unassignedItemsWidthDelta <= 0) {
            return 0;
        }

        var delta = Math.ceil(itemWidth / rowInfo.itemsSpaceWidth * rowInfo.itemsWidthDelta);
        if (rowInfo.unassignedItemsWidthDelta < delta) {
            delta = rowInfo.unassignedItemsWidthDelta;
        }

        rowInfo.unassignedItemsWidthDelta -= delta;

        return delta;            
    }

    function addWidthHeightStyles($item, itemWidth, itemHeight) {
        $item.width(itemWidth);
        $item.height(itemHeight);
    }

    function removeInvisibilityClass($item, options) {
        $item.removeClass(options.classes.invisible);
    }

    function addGridPositionClasses($item, isLastRow, isFirstInRow, isLastInRow, options) {
        $item.toggleClass(options.classes.lastRow, isLastRow);
        $item.toggleClass(options.classes.firstInRow, isFirstInRow);
        $item.toggleClass(options.classes.lastInRow, isLastInRow);
    }

    function addRowPaddingStyles($item, isFirstInRow, isLastInRow, options) {
        if (!options.layout.applyRowPadding) {
            return;
        }

        $item.css('margin-left', (isFirstInRow ? options.layout.rowPadding : 0) + 'px');
        $item.css('margin-right', (isLastInRow ? options.layout.rowPadding : 0) + 'px');
    }

    function addItemSpacingStyles($item, isLastInRow, isLastRow, options) {
        if (!options.layout.applyItemSpacing) {
            return;
        }

        $item.css('margin-right', (!isLastInRow ? options.layout.itemSpacing : 0) + 'px');
        $item.css('margin-bottom', (!isLastRow ? options.layout.itemSpacing : 0) + 'px');
    }

    function addStretchingClasses($item, itemWidth, itemHeight, options) {
        var imageWidthIfStretchedByHeight = getItemWidthHeightRatio($item, false, options) * itemHeight;

        $item.toggleClass('stretch-by-height', imageWidthIfStretchedByHeight >= itemWidth);
        $item.toggleClass('stretch-by-width', imageWidthIfStretchedByHeight < itemWidth);

        var croppedIfStretched = isImageCroppedIfStretched(imageWidthIfStretchedByHeight, itemWidth, options);
        $item.toggleClass('cropped-if-stretched', croppedIfStretched);
    }

    function addMisfitClasses($img, itemWidth, itemHeight) {
        $img.toggleClass('horizontal-misfit', isImageHorizontallyMisfit($img, itemWidth));
        $img.toggleClass('vertical-misfit', isImageVerticallyMisfit($img, itemHeight));
    }

    function isImageCroppedIfStretched(imageWidthIfStretchedByHeight, itemWidth, options) {
        return Math.abs(imageWidthIfStretchedByHeight - itemWidth) > options.layout.croppingEpsilon;
    }

    function isImageHorizontallyMisfit($img, itemWidth) {
        return Math.abs($img.width() - itemWidth) > 1;
    }

    function isImageVerticallyMisfit($img, itemHeight) {
        return Math.abs($img.height() - itemHeight) > 1;
    }

    function getItemsWidthForHeight(row, height, floorItemWidths, options) {
        var itemsWidth = 0;
        for (var i = 0; i < row.length; i++) {
            var itemWidth = getItemWidthForHeight(row[i], height, options);
            if (floorItemWidths) {
                itemWidth = Math.floor(itemWidth);
            }
            itemsWidth += itemWidth;
        }
        return itemsWidth;
    }

    function getItemsSpaceWidth(row, rowWidth, options) {
        return (rowWidth - ((row.length - 1) * options.layout.itemSpacing));
    }

    function getItemWidthForHeight($item, height, options) {
        var width = getItemWidthHeightRatio($item, true, options) * height;
        return width;
    }

    function getItemWidthHeightRatio($item, normalized, options) {
        var ratioDataKey = nameInLowerCase + '-ratio';
        var ratio = $item.data(ratioDataKey);

        if (ratio === undefined) {
            ratio = calculateItemWidthHeightRatio($item, options);
            $item.data(ratioDataKey, ratio);
        }

        if (normalized) {
            if (ratio <= options.layout.minWidthHeightRatio) {
                return options.layout.minWidthHeightRatio;
            }
            if (ratio >= options.layout.maxWidthHeightRatio) {
                return options.layout.maxWidthHeightRatio;
            }
        }

        return (ratio);
    }

    function calculateItemWidthHeightRatio($item, options)
    {
        var width = $item.data(nameInLowerCase + '-width');
        var height = $item.data(nameInLowerCase + '-height');

        if (width === undefined || height === undefined) {
            var $image = $item.find(options.selectors.image);
            width = $image.prop('naturalWidth');
            height = $image.prop('naturalHeight');
        }

        var ratio = width / height;
        return ratio;
    }

    function setItemWidthHeightRatio($item, ratio) {
        var ratioDataKey = nameInLowerCase + '-ratio';
        $item.data(ratioDataKey, ratio);
    }

//    function getVariables($container) {
//        return $container.data(nameInLowerCase);
//    }
//
//    function setVariables($container, variables) {
//        $container.data(nameInLowerCase, variables);
//    }

    function log(message) {
        window.console && console.log(name + ': ' + message);
    }

}(jQuery));