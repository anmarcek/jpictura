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
    $("#my-gallery").jpictura({ itemSpacing: 5, justifyLastRow: false });
});
```

Full list of options is described below.

### Coming soon.