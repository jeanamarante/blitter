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

&nbsp;

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

__distScript__

Reserved target for declaring where the minified client-side script is written.

__options.useObjectURLs__  
Type: `Boolean`  
Default: `false`

More efficient handling of image data by creating an object URL for each data URI. Blobs are created only when using object URLs.

&nbsp;

## Client-Side

__blit-id__

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
└─── user-profile
     │   user-profile-admin.png
     └─  user-profile-member.png
```

__HTML Page__

Always load blitter after all of the img elements using blit-ids have been parsed. It's not a bad idea to load buffers before loading other scripts.

```html
<html>
<head>
    <title>Blitter Demo</title>
</head>
<body>
    <img blit-id="menu-hamburger-icon">
    <ul>
        <li><img blit-id="user-profile-admin"></li>
        <li><img blit-id="user-profile-member"></li>
    </ul>
    <script src="js/vendor/blitter.min.js"></script>
    <script src="js/vendor/demo-buffer.blit.js"></script>
</body>
</html>
```

&nbsp;

## API

__hasMIME__

```js
hasMIME (id: String) : Boolean
```

__getMIME__

```js
getMIME (id: String) : String
```

__hasBlob__

```js
hasBlob (id: String) : Boolean
```

__getBlob__

```js
getBlob (id: String) : Blob
```

__hasImageData__

```js
hasImageData (id: String) : Boolean
```

__getImageData__

```js
getImageData (id: String) : String

// Example
let img = new Image();

img.setAttribute('src', BLITTER.getImageData('shape-rectangle'));

document.body.appendChild(img);
```

__isUsingObjectURLs__

```js
isUsingObjectURLs () : Boolean
```

__useObjectURLs__

```js
// You should never call this method directly.
useObjectURLs ()
```

__parseBuffer__

```js
// You should never call this method directly.
parseBuffer (buffer: Array)
```
