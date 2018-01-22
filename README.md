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

blitter is a task that generates sprite sheets for websites. The goals for blitter are to:

* Reduce the amount of HTTP/HTTPS requests for images.
* Provide an easier way to work with sprites by not having to deal with CSS backgrounds.

&nbsp;

### Usage Example

```js
grunt.config.init({
    blitter: {
        distScript: {
            dest: 'dist/js/blitter.min.js',
            inline: false
        },
        home: {
            src: 'img/home/',
            dest: 'pug/home/sprite-buffer.pug',
            inline: true
        },
        blog: {
            src: 'img/blog/',
            dest: 'js/blog/sprite-buffer.js',
            inline: false
        }
    }
});
```

### distScript

Task reserved for the client-side script to be written in dest file. inline will wrap the Javascript inside a ```<script>``` tag. Good idea to use when trying to inline HTML in a template engine.

### src

Path to directory where all image files will be recursively searched and merged into a single sprite buffer.

Blitter only recognizes these file types: ```['.png', '.svg', '.gif', '.jpg', '.jpeg']```

### dest

Path for file containing the sprite buffer.

### inline

If set to true, the sprite buffer will be wrapped around a ```<script>``` tag.

&nbsp;

### Client-Side Example

```html
<html>
<head>
    <title>Blitter Demo</title>
</head>
<body>
    <img blit-id="example-icon">
    <ul>
        <li><img blit-id="computer-one"></li>
        <li><img blit-id="computer-two"></li>
    </ul>

    <!-- Declare blitter.js after all the img elements using blit-ids. -->
    <script src="js/blitter.min.js"></script>

    <!-- Prior to loading sprites, call this method first if you want to use Object URLs. -->
    <script> BLITTER.useObjectURLs(); </script>

    <!-- Its a good idea to load sprites before declaring other js scripts. -->
    <script src="js/sprite-buffer.js"></script>
</body>
</html>
```

### blit-id

blit-ids are declared as attributes inside ```<img>``` tags. They serve as pointers to the frame you want to render. File names are used for blit-ids. For example, if you have a file in the src directory named example-icon.svg, the blit-id for that file will be example-icon.

### BLITTER.hasImageData

Check if frame exists.

_hasImageData(id: String);_

### BLITTER.useObjectURLs

Call this method to save memory on big apps.

_useObjectURLs();_

### BLITTER.loadSpriteBuffer

You should never call this method directly. All generated sprite buffers invoke this method by default.

_loadSpriteBuffer(buffer: Object);_

### BLITTER.getImageData

Get frames after load event fires.

_getImageData(id: String);_

```js
var img = new Image();
var data = BLITTER.getImageData('example-icon');

img.setAttribute('src', data);

document.body.appendChild(img);
```
