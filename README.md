# jPictura

jPictura is a simple jQuery plugin for alignment of images.

## Table of contents

* [Quick start](#quick-start)
* [Options](#options)

## Quick start

### Installation

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

Create a target gallery element with divs inside, one for each image. Skippr targets div tags with class ```item``` (can be changed in the options [](#options)) inside of the selected element.

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

Whether the images should be stretched to fully fill the space of the respective gallery item or not. Stretching an image beyond its actual width/height decreases the image quality.

```javascript
$(document).ready(function(){
    $("#my-gallery").jpictura({ layout: { stretchImages: false } });
});
```