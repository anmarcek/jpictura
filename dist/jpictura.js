function heightCalculator(getItemsWidthForHeightFunc, logFunc, opts) {
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

        if (rMax * ho > desiredItemsWidth) {
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
 * jPictura v1.1.3
 * https://github.com/anmarcek/jpictura.git
 *
 * Copyright (c) 2014-2016 Anton Marček
 * Released under the MIT license
 *
 * Date: 2016-02-05T09:11:54.688Z
 */

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
            lastInRow: nameInLowerCase + '-last-in-row'
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
        waitForImages: true,
        heightCalculator: heightCalculator,
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
        $items.addClass('invisible');

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

        $items.find(options.selectors.image).each(function () {
            var image = new Image();
            image.src = $(this).attr('src');
            image.onload = imageLoadedCallback();
        });

        function imageLoadedCallback() {
            if (++loadedImagesCount === $items.size()) {
                callback($container, $items, options);
            }
        }
    }

    function createGalleryFromItems($container, $items, options) {
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
        var itemsWidthDelta = itemsWidth - itemsSpaceWidth;

        var rowSortedFromWidest = row.slice(0);
        rowSortedFromWidest.sort(function ($item1, $item2) {
            return getItemWidthForHeight($item2, height, options) - getItemWidthForHeight($item1, height, options);
        });

        var unassignedItemsWidthDelta = itemsWidthDelta;

        for (var j = 0; j < rowSortedFromWidest.length; j++) {
            var $item = rowSortedFromWidest[j];

            var itemWidth = getItemWidthForHeight($item, height, options);
            var delta;
            if (unassignedItemsWidthDelta >= 0) {
                delta = Math.ceil(itemWidth / itemsSpaceWidth * itemsWidthDelta);
                if (unassignedItemsWidthDelta < delta) {
                    delta = unassignedItemsWidthDelta;
                }
                unassignedItemsWidthDelta -= delta;
            } else {
                delta = 0;
            }
            itemWidth = Math.floor(itemWidth) - delta; 

            $item.width(itemWidth);
            $item.height(height);

            $item.removeClass('invisible');

            var isFirstInRow = $item === row[0];
            var isLastInRow = $item === row[row.length - 1];

            $item.toggleClass(options.classes.lastRow, isLastRow);
            $item.toggleClass(options.classes.firstInRow, isFirstInRow);
            $item.toggleClass(options.classes.lastInRow, isLastInRow);

            if (options.layout.applyRowPadding) {
                if (isFirstInRow) {
                    $item.css('margin-left', options.layout.rowPadding + 'px');
                }
                if (isLastInRow) {
                    $item.css('margin-right', options.layout.rowPadding + 'px');
                }
            }

            if (options.layout.applyItemSpacing) {
                if (!isLastInRow) {
                    $item.css('margin-right', options.layout.itemSpacing + 'px');
                }

                if (!isLastRow) {
                    $item.css('margin-bottom', options.layout.itemSpacing + 'px');
                }
            }

            var imageWidthIfStretchedByHeight = getItemWidthHeightRatio($item, false, options) * height;
            if (imageWidthIfStretchedByHeight >= itemWidth) {
                $item.addClass('stretch-by-height');
            } else {
                $item.addClass('stretch-by-width');
            }
            if (Math.abs(imageWidthIfStretchedByHeight - itemWidth) > options.layout.croppingEpsilon) {
                $item.addClass('cropped-if-stretched');
            }

            var $img = $item.find(options.selectors.image);

            if (Math.abs($img.width() - itemWidth) > 1) {
                $img.addClass('horizontal-misfit');
            }

            if (Math.abs($img.height() - height) > 1) {
                $img.addClass('vertical-misfit');
            }
        }
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
        return (itemsWidth);
    }

    function getItemsSpaceWidth(row, rowWidth, options) {
        return (rowWidth - ((row.length - 1) * options.layout.itemSpacing));
    }

    function getItemWidthForHeight($item, height, options) {
        var width = getItemWidthHeightRatio($item, true, options) * height;
        return (width);
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