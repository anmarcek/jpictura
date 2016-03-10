/*!
 * jPictura v@VERSION
 * https://github.com/anmarcek/jpictura.git
 *
 * Copyright (c) 2014-@YEAR Anton Marček
 * Released under the MIT license
 *
 * Date: @DATE
 */

var jpictura = jpictura || {};

//TODO AnMa Important: Check if multiple and fast browser window resizes do not lead to a deadlock.
//TODO AnMa Important: Implement real responsivness which watches the container width instead of the window width.
//TODO AnMa Important: Turn off responsive event handlers while gallery redraw is in progress.
//TODO AnMa Important: Update the readme file.
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
            invisible: nameInLowerCase + '-invisible',
            hidden: nameInLowerCase + '-hidden',
            offContentFlow: nameInLowerCase + '-off-content-flow'
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
            //TODO AnMa Important: Recheck fade-in functionality.
            fadeInItems: false
        },
        responsive: {
            enabled: true,
            onWindowWidthResize: true,
            onContainerWidthResize: false,
            delayAlgorithm: 'debounce',
            delay: 200
        },
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

        $container.toggleClass('stretch-images', options.layout.stretchImages);
        $container.toggleClass('center-images', options.layout.centerImages);
        $container.toggleClass('disable-cropping-images', !options.layout.allowCropping);
        $container.toggleClass('fade-in-items', options.effects.fadeInItems);

        var $items = $container.find(options.selectors.item);
        $items.addClass(options.classes.item);

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
        var delayedRedrawGallery;
        if (options.responsive.delayAlgorithm === 'debounce') {
            delayedRedrawGallery = jpictura.debounce(function () {
                redrawGallery($container, $items, options);
            }, options.responsive.delay);
        } else if (options.responsive.delayAlgorithm === 'throttle') {
            delayedRedrawGallery = jpictura.throttle(function () {
                redrawGallery($container, $items, options);
            }, options.responsive.delay, false, true);
        } else {
            throw 'The specified delay algorithm \'' + options.responsive.delayAlgorithm + '\' is not supported.';
        }

        jpictura.offWindowWidthResize(nameInLowerCase);
        if (options.responsive.enabled) {
            jpictura.onWindowWidthResize(nameInLowerCase, delayedRedrawGallery);
        }

        delayedRedrawGallery();
    }

    //TODO AnMa Important: Refactor.
    function redrawGallery($container, $items, options) {
        var startTime = new Date().getTime();

        var i = 0;
        var tryAgain;
        var containerWidths = [];

        do {
            $items.addClass(options.classes.invisible);
            $items.addClass(options.classes.hidden);

            var containerWidthBefore = getContainerWidth($container);
            containerWidths.push(containerWidthBefore);

            var leaveSpaceForScrollBar = false;
            if (containerWidths.length >= 3) {
                var previousContainerWidthBefore = containerWidths[containerWidths.length - 3];
                var previousContainerWidthAfter = containerWidths[containerWidths.length - 2];
                if ((previousContainerWidthBefore > previousContainerWidthAfter) && (previousContainerWidthBefore === containerWidthBefore)) {
                    containerWidthBefore = previousContainerWidthAfter;
                    leaveSpaceForScrollBar = true;
                }
            }

            tryRedrawGallery(containerWidthBefore, $items, options);

            var containerWidthAfter = getContainerWidth($container);
            containerWidths.push(containerWidthAfter);

            tryAgain = false;
            if (containerWidthBefore !== containerWidthAfter) {
                var realContainerWidthBefore = containerWidths[containerWidths.length - 2];
                tryAgain = !leaveSpaceForScrollBar || realContainerWidthBefore !== containerWidthAfter;
            }
        } while (tryAgain && (++i <= 10));

        var endTime = new Date().getTime();
        if (options.debug) {
            log('Gallery redrawn in ' + (endTime - startTime) + ' milliseconds.');
        }
    }

    function tryRedrawGallery(availableWidth, $items, options) {
        var row = [];
        var rowWidth = availableWidth - 2 * options.layout.rowPadding;
        var heightCalculator = new options.heightCalculator(getItemsWidthForHeight, log, options);

        $items.each(function () {
            var $item = $(this);

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
                        revealRow(row, rowWidth, currentRowHeight, false, options);
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
        removeCoveringClasses($item, options);
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

    function removeCoveringClasses($item, options) {
        $item.removeClass(options.classes.invisible);
        $item.removeClass(options.classes.hidden);
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
        var width = getItemNaturalWidth($item, options);
        var height = getItemNaturalHeight($item, options);
        var ratio = width / height;
        return ratio;
    }

    function setItemWidthHeightRatio($item, ratio) {
        var ratioDataKey = nameInLowerCase + '-ratio';
        $item.data(ratioDataKey, ratio);
    }

    function getItemNaturalWidth($item, options) {
        var widthDataKey = nameInLowerCase + '-width';
        var width = $item.data(widthDataKey);

        if (width === undefined) {
            var $image = $item.find(options.selectors.image);
            width = $image.prop('naturalWidth');
            $item.data(widthDataKey, width);
        }

        return width;
    }

    function getItemNaturalHeight($item, options) {
        var heightDataKey = nameInLowerCase + '-height';
        var height = $item.data(heightDataKey);

        if (height === undefined) {
            var $image = $item.find(options.selectors.image);
            height = $image.prop('naturalHeight');
            $item.data(heightDataKey, height);
        }

        return height;
    }

    function getContainerWidth($container) {
        return $container.width();
    }

    function log(message) {
        window.console && console.log(name + ': ' + message);
    }

}(jQuery));