/*!
 * jPictura v@VERSION
 * https://github.com/anmarcek/jpictura.git
 *
 * Copyright (c) 2014-@YEAR Anton Marček
 * Released under the MIT license
 *
 * Date: @DATE
 */

(function ($) {

    $.fn.jpictura = function (options) {
        var opts = $.extend({}, $.fn.jpictura.defaults, options);

        this.each(function () {
            createGallery($(this), opts);
        });

        return (this);
    };

    var name = 'jPictura';
    var nameInLowerCase = name.toLowerCase();

    $.fn.jpictura.defaults = {
        containerCssClass: nameInLowerCase,
        itemCssClass: nameInLowerCase + '-item',
        lastRowCssClass: nameInLowerCase + '-last-row',
        firstInRowCssClass: nameInLowerCase + '-first-in-row',
        lastInRowCssClass: nameInLowerCase + '-last-in-row',
        imageCssClass: nameInLowerCase + '-image',
        itemSelector: '.item',
        imageSelector: 'img',
        rowPadding: 0,
        itemSpacing: 0,
        applyItemSpacing: true,
        optimum: 180,
        minWidthHeightRatio: 1 / 3,
        maxWidthHeightRatio: 3,
        guessingAlgorithm: {
            epsilon: 0.01,
            maxIterationCount: 100
        },
        waitForImages: true,
        fadeInItems: false,
        stretchImages: true,
        centerImages: true,
        justifyLastRow: false,
        debug: false,
        heightCalculator: heightCalculator
    };

    $.fn.jpictura.evaluate = function (height, options) {
        return (Math.abs(height - options.optimum));
    };

    function createGallery($container, options) {
        $container.addClass(options.containerCssClass);
        if (options.fadeInItems) {
            $container.addClass('fade-in-items');
        }
        if (options.stretchImages) {
            $container.addClass('stretch-images');
        }
        if (options.centerImages) {
            $container.addClass('center-images');
        }

        var $items = $container.find(options.itemSelector);
        $items.addClass(options.itemCssClass);
        $items.addClass('invisible');

        var $images = $items.find(options.imageSelector);
        $images.addClass(options.imageCssClass);

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

        $items.find(options.imageSelector).each(function () {
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
        var rowWidth = $container.width() - options.rowPadding;
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

        var lastRowHeight = (!rowIsFull(row, rowWidth, options) && !options.justifyLastRow)
            ? options.optimum
            : getRowHeight(row, rowWidth, heightCalculator, options);
        revealRow(row, rowWidth, lastRowHeight, true, options);

        var endTime = new Date().getTime();
        if (options.debug) {
            log('Gallery created in ' + (endTime - startTime) + ' milliseconds.');
        }
    }

    function rowIsFull(row, rowWidth, options) {
        var usedRowWidth = (row.length - 1) * options.itemSpacing;
        for (var i = 0; i < row.length; i++) {
            usedRowWidth += getItemWidthForHeight(row[i], options.optimum, options);
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

            $item.toggleClass(options.lastRowCssClass, isLastRow);
            $item.toggleClass(options.firstInRowCssClass, isFirstInRow);
            $item.toggleClass(options.lastInRowCssClass, isLastInRow);

            if (options.applyItemSpacing) {
                if (!isLastInRow) {
                    $item.css('margin-right', options.itemSpacing + 'px');
                }

                $item.css('margin-bottom', options.itemSpacing + 'px');
            }

            if (options.centerImages) {
                var $img = $item.find(options.imageSelector);

                if (Math.abs(itemWidth - $img.width()) > 1) {
                    $img.addClass('centered-horizontally');
                }

                if (Math.abs(height - $img.height()) > 1) {
                    $img.addClass('centered-vertically');
                }
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
        return (rowWidth - ((row.length - 1) * options.itemSpacing));
    }

    function getItemWidthForHeight($item, height, options) {
        var width = getItemWidthHeightRatio($item, options) * height;
        return (width);
    }

    function getItemHeightWidthRatio($item, options) {
        return (1 / getItemWidthHeightRatio($item, options));
    }

    function getItemWidthHeightRatio($item, options) {
        var ratioDataKey = nameInLowerCase + '-ratio';
        var ratio = $item.data(ratioDataKey);

        if (ratio === undefined) {
            ratio = calculateItemWidthHeightRatio($item, options);
            $item.data(ratioDataKey, ratio);
        }

        if (ratio <= options.minWidthHeightRatio) {
            return (options.minWidthHeightRatio);
        } else if (ratio >= options.maxWidthHeightRatio) {
            return (options.maxWidthHeightRatio);
        } else {
            return (ratio);
        }
    }

    function calculateItemWidthHeightRatio($item, options)
    {
        var width = $item.data(nameInLowerCase + '-width');
        var height = $item.data(nameInLowerCase + '-height');

        if (width === undefined || height === undefined) {
            var $image = $item.find(options.imageSelector);
            width = $image.prop('naturalWidth');
            height = $image.prop('naturalHeight');
        }

        var ratio = width / height;
        return ratio;
    }

    function getVariables($container) {
        return $container.data(nameInLowerCase);
    }

    function setVariables($container, variables) {
        $container.data(nameInLowerCase, variables);
    }

    function log(message) {
        window.console && console.log(name + ': ' + message);
    }

}(jQuery));