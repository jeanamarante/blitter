var path = require('path');

/**
 * Only images are allowed to be added into files list.
 *
 * @function isInvalidFile
 * @param {String} file
 * @param {Object} stats
 * @return {Boolean}
 * @api private
 */

function isInvalidFile (file, stats) {
    // Do not block access to sub directories.
    if (stats.isDirectory()) { return false; }

    switch (path.extname(file)) {
        case '.svg':
        case '.png':
        case '.gif':
        case '.jpg':
        case '.jpeg':
            return false;

        default:
            return true;
    }
}

/**
 * Grab all of the images in the src directory recursively.
 *
 * @function recurseSrc
 * @param {Object} grunt
 * @param {Object} task
 * @api private
 */

function recurseSrc (grunt, task) {
    var done = task.async();

    require('recursive-readdir')(task.data.src, [isInvalidFile], function (err, files) {
        done();

        createSpriteBuffer(grunt, task, files);
    });
}

/**
 * Create dataURIs from files and place them inside the sprite buffer.
 * Refer to client-side script to see how the buffer is parsed.
 *
 * @function createSpriteBuffer
 * @param {Object} grunt
 * @param {Object} task
 * @param {Array} files
 * @api private
 */

function createSpriteBuffer (grunt, task, files) {
    var buffer = {};
    var dataURI = require('datauri');

    for (var i = 0, max = files.length; i < max; i++) {
        var filePath = files[i];
        var fileName = path.parse(filePath).name;

        var uri = new dataURI(filePath);

        buffer[fileName] = [uri.mimetype, uri.content];
    }

    writeDest(grunt, task, buffer);
}

/**
 * Write buffer into dest file. The buffer is wrapped by the client-side
 * load method and HTML <script> tag if it is inlined.
 *
 * @function writeDest
 * @param {Object} grunt
 * @param {Object} task
 * @param {Object} buffer
 * @api private
 */

function writeDest (grunt, task, buffer) {
    var content = 'BLITTER.loadSpriteBuffer(' + JSON.stringify(buffer) + ');';

    if (Boolean(task.data.inline)) {
        content = '<script type="text/javascript">' + content + '</script>';
    }

    grunt.file.write(task.data.dest, content);
}

module.exports = function (grunt) {
    grunt.registerMultiTask('blitter', function () {
        if (grunt.task.current.target === 'distScript') {
            require('./lib/dist-script.js').writeFile(grunt, this, '../../dist/blitter.min.js');
        } else {
            recurseSrc(grunt, this);
        }
    });
};
