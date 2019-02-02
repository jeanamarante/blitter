> # blitter
> Sprite Sheet Helper for the Web

&nbsp;

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install blitter --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('blitter');
```

&ensp;

## Task

_Run this task with the_ `grunt blitter` _command._

Task targets, files and options may be specified according to the Grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

&nbsp;

### Description

blitter is a task that helps reduce the amount of HTTP requests for images in websites, and provide an easier way to work with images by not having to deal with CSS backgrounds.

&nbsp;

### Usage Example

```js
grunt.config.init({
    blitter: {
        distScript: {
            dest: 'dist/vendor/blitter.min.js',
        },
        home: {
            src: ['media/img/blit/demo/'], // Must be directories.
            dest: 'dist/vendor/demo-buffer.blit.js',
            options: {
                useObjectURLs: true
            }
        }
    }
});
```

#### distScript

Reserved target for declaring where the minified client-side script is written.

#### options.useObjectURLs
Type: `Boolean`  
Default: `false`

More efficient handling of image data by creating an object URL for each data URI. Blobs are created only when using object URLs.

&ensp;

## Client-Side

#### blit-id

blit-ids are declared as attributes inside ```<img>``` elements. They serve as references to the image data you want to render. File names without their extension are used as blit-ids. All file names must be unique, if not the image elements will render the image data tied to the blit-id that got stored first.

```
srcDir
├─── menu
│    │   menu-drop-down-icon.svg
│    └─  menu-hamburger-icon.svg
│
├─── shape
│    │   shape-triangle.svg
│    └─  shape-rectangle.svg
│
└─── file-system
     │   file-system-directory.svg
     └─  file-system-file.svg
```

#### HTML Page

Always load blitter after all of the img elements using blit-ids have been parsed. It's not a bad idea to load buffers before loading other scripts.

```html
<html>
<head>
    <title>Blitter Demo</title>
</head>
<body>
    <img blit-id="example-icon">
    <ul>
        <li><img blit-id="example-sub-icon-one"></li>
        <li><img blit-id="example-sub-icon-two"></li>
    </ul>
    <script src="js/blitter.min.js"></script>
    <script src="js/demo-buffer.blit.js"></script>
</body>
</html>
```

&ensp;

## API

#### hasMIME

_hasMIME (id: String) : Boolean_

#### getMIME

_getMIME (id: String) : String_

#### hasBlob

_hasBlob (id: String) : Boolean_

#### getBlob

_getBlob (id: String) : Blob_

#### hasImageData

_hasImageData(id: String) : Boolean_

#### getImageData

_getImageData (id: String) : String_

```js
var img = new Image();
var data = BLITTER.getImageData('example-icon');

img.setAttribute('src', data);

document.body.appendChild(img);
```

#### isUsingObjectURLs

_isUsingObjectURLs () : Boolean_

#### useObjectURLs

_useObjectURLs ()_

You should never call this method directly.

#### parseBuffer

_parseBuffer (buffer: Array)_

You should never call this method directly.
