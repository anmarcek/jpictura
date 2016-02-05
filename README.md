# jPictura

jPictura is a simple jQuery plugin for responsive alignment of images.

## Table of contents

* [Quick start](#quick-start)
* [Options](#options)

## Quick start

### Installation

* [Download the latest release](/jpictura.zip?raw=true).
* Install with [npm](https://www.npmjs.com): `npm install jpictura`.

The following two files have to be used in your solution:

```
jpictura/
└── dist/
    ├── css/
    │   └── jpictura.min.css
    └── jpictura.min.js
```

### Setup

Include ```jpictura.min.css``` inside of your head tag and ```jpictura.min.js``` just before the closing body tag. Be sure to include jQuery before jpictura.min.js.

```html
<head>
    <title>Your Intergalactic Website</title>        
    <link rel="stylesheet" href="jpictura/dist/css/jpictura.min.css">
</head>
<body>
        
    <script src="http://code.jquery.com/jquery-2.2.0.min.js"></script>
    <script src="jpictura/dist/jpictura.min.js"></script>
</body>
```

Create a target gallery element with divs inside, one for each image. jPictura targets div tags with class `item` (can be changed in the [options](#options)) inside of the selected element.

```html
<div id="my-gallery">
    <div class="item"><img src="foo.png" /></div>
    <div class="item"><img src="bar.png" /></div>
</div>
```

### Initialization

Simply select the gallery element and call the ```jpictura``` method. It is that simple!

```javascript
$(document).ready(function(){
    $("#my-gallery").jpictura();
});
```

## Options

Customize your gallery by passing an options object as a single parameter to the ```jpictura``` method.

```javascript
$(document).ready(function(){
    $("#my-gallery").jpictura({ layout: { itemSpacing: 5, justifyLastRow: false } });
});
```

The complete options object looks like this:

```javascript
var options = {
    selectors: {
        item: '.item',
        image: 'img'
    },
    classes: {
        container: 'jpictura',
        item: 'jpictura-item',
        image: 'jpictura-image',
        lastRow: 'jpictura-last-row',
        firstInRow: 'jpictura-first-in-row',
        lastInRow: 'jpictura-last-in-row'
    },
    layout: {
        rowPadding: 0,
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
```

The options are described in details in the following sections.

***

### selectors.item

A jQuery selector that is used to locate the gallery items within the container.

```html
<div id="my-gallery">
    <a href=""><img src="foo.png" /></a>
    <a href=""><img src="bar.png" /></a>
</div>

$(document).ready(function(){
    $("#my-gallery").jpictura({ selectors: { item: 'a' } });
});
```

***

### selectors.image

A jQuery selector that is used to locate the images within the gallery items.

```html
<div id="my-gallery">
    <div class="item"><img src="ANOTHER IMAGE" /><img class="chosen-image" src="foo.png" /></div>
    <div class="item"><img src="ANOTHER IMAGE" /><img class="chosen-image" src="bar.png" /></div>
</div>

$(document).ready(function(){
    $("#my-gallery").jpictura({ selectors: { image: '.chosen-image' } });
});
```

***

### classes

CSS classes that are automatically applied by the plugin to specific elements.

:warning: **The CSS classes are used internally by the plugin's CSS. Chaning one of them may cause the plugin to misbehave.**

| Option | Description |
| --- | --- |
| `classes.container` | CSS class applied to the gallery container (the element which the jpictura was applied to). |
| `classes.item` | CSS class applied to the gallery items. |
| `classes.image` | CSS class applied to the images. |
| `classes.lastRow` | CSS class applied to the gallery items in the last row. |
| `classes.firstInRow` | CSS class applied to first gallery item in each row. |
| `classes.lastInRow` | CSS class applied to last gallery item in each row. |

***

### layout.rowPadding

Specifies the amount of blank space at the start and at the end of each row.

![Test](/docs/gallery-2.png)

```javascript
$(document).ready(function(){
    $("#my-gallery").jpictura({ layout: { rowPadding: 5 } });
});
```

The row padding is achieved by applying margin to the gallery items. The property is closely related to property `layout.applyRowPadding`. If `layout.applyRowPadding` was false, the margin would not be applied. However the width/height of the gallery items would be still calculated as if the margin was there. This advanced set up allows you to write custom CSS for proper image alignment - e.g. using flex box. 

***

### layout.itemSpacing

Specifies the amount of blank space between the gallery items.

![Test](/docs/gallery-3.png)

```javascript
$(document).ready(function(){
    $("#my-gallery").jpictura({ layout: { itemSpacing: 5 } });
});
```

The spacing is achieved by applying margin to the gallery items. The property is closely related to property `layout.applyItemSpacing`. If `layout.applyItemSpacing` was false, the margin would not be applied. However the width/height of the gallery items would be still calculated as if the margin was there. This advanced set up allows you to write custom CSS for proper image alignment - e.g. using flex box. 

***

### layout.idealRowHeight

The desired row height. The application will try to arrange the gallery item so the heights of the rows are as close as possible to the `layout.idealRowHeight` value.

![Test](/docs/gallery-4.png)

```javascript
$(document).ready(function(){
    $("#my-gallery").jpictura({ layout: { idealRowHeight: 80 } });
});
```

***

### layout.stretchImages

Whether the images should be stretched to fully fill the space of the respective gallery item or not. However, stretching an image beyond its actual width/height decreases the image quality.

**Without stretching**

![Test](/docs/gallery-5.png)

```javascript
$(document).ready(function(){
    $("#my-gallery").jpictura({ layout: { stretchImages: false } });
});
```

**With stretching**

![Test](/docs/gallery-6.png)

```javascript
$(document).ready(function(){
    $("#my-gallery").jpictura({ layout: { stretchImages: true } });
});
```

***

### layout.allowCropping

Images whose aspect ratio is beyond the specified limits (smaller than `layout.minWidthHeightRatio` or bigger than `layout.maxWidthHeightRatio`) might not fit their gallery items very well - in other words, the aspect ratio of the calculated gallery item might differ from the aspect ratio of the contained image. Therefore if the image is stretched to fill in the entire space of its gallery item, the image will be cropped - either at the top/bottom (the image is too high) or at the sides (the image is too wide). To prevent cropping of images with non-standard aspect ratios, set the property `layout.allowCropping` to `false`.

**With cropping**

![Test](/docs/gallery-7.png)

```javascript
$(document).ready(function () {
    $("#my-gallery").jpictura({ layout: { stretchImages: true, allowCropping: true } });
});
```

**Without cropping**

![Test](/docs/gallery-8.png)

```javascript
$(document).ready(function () {
    $("#my-gallery").jpictura({ layout: { stretchImages: true, allowCropping: false } });
});
```

:bulb: You may notice that the rectangular red image was stretched to fill in the given space because its aspect ratio is within limits and no cropping occured. The image with water polo players on the other hand was not stretched due to the fact it would be cropped in such a case.

***

### layout.centerImages

Whether the images should be centered within the given space defined by their gallery items or not.

```javascript
$(document).ready(function () {
    $("#my-gallery").jpictura({ layout: { centerImages: false } });
});
```

***

### layout.justifyLastRow

Whether the images in the last row should be justified (i.e. - stretched to take the full width of the row or not). If the property is set to `false`, the images in the last row may still take the full width of the row if they are wide enough, but they will not be forced to do so if they are not wide enough.

**Without justification**

![Test](/docs/gallery-9.png)

```javascript
$(document).ready(function () {
    $("#my-gallery").jpictura({ layout: { justifyLastRow: false } });
});
```

**With justification**

![Test](/docs/gallery-10.png)

```javascript
$(document).ready(function () {
    $("#my-gallery").jpictura({ layout: { justifyLastRow: true } });
});
```

***

### effects.fadeInItems

If true, the gallery items will smoothly fade in once they are loaded - instead of simple appearing on the screen.

```javascript
$(document).ready(function () {
    $("#my-gallery").jpictura({ effects: { fadeInItems: true } });
});
```

***

### responsive

If true, the gallery is redrawn every time the window width changes.

***

### waitForImages

If true, the plugin waits until all images are loaded and only then performs the calculations and displays the gallery. The images cannot be processed any sooner because the knowledge of their nutural widths and heights is crucial.

However it is possible to speed up loading of the gallery if the image dimensions are known. In this case it is possible to apply data parameters on the gallery item HTML tags and specify the image dimensions (in pixels) so the plugin does not have to wait for the images and can start processing the gallery as soon as DOM is ready.

```html
<div id="my-gallery">
    <div class="item"><img data-jpictura-width="300" data-jpictura-height="200" src="foo.png" /></div>
    <div class="item"><img data-jpictura-width="200" data-jpictura-height="300" src="bar.png" /></div>
</div>

$(document).ready(function () {
    $("#my-gallery").jpictura({ waitForImages: false });
});
```

***

### heightCalculator

This property allows you to supply your own algorthim which is supposed to calculate row height for the given row (array of gallery items which should appear in a single row).

***

### algorithm

Options used by the `heightCalculator` algorithm.

***

### debug

If true, the plugin will log useful messages to the console.