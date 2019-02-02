const path = require('path');
const klaw = require('klaw-sync');
const isImage = require('is-image');
const DataURI = require('datauri');

/**
 * Ignore everything except directories and image files.
 *
 * @function canFilter
 * @param {Object} data
 * @return {Boolean}
 * @api private
 */

function canFilter (data) {
    return data.stats.isDirectory() || isImage(data.path);
}

/**
 * Match all image files in src directories.
 *
 * @function recurseSrcDirectories
 * @param {Object} grunt
 * @param {Object} fileData
 * @param {Object} options
 * @api private
 */

function recurseSrcDirectories (grunt, fileData, options) {
    let matches = [];

    for (let i = 0, iMax = fileData.src.length; i < iMax; i++) {
        let src = fileData.src[i];

        if (typeof src !== 'string') {
            throw new TypeError('src must be a string.');
        }

        src = path.resolve(src);

        if (!grunt.file.isDir(src)) {
            throw new Error(src + ' must be a directory.');
        }

        let files = [];

        try {
            files = klaw(src, {
                nodir: true,
                filter: canFilter,
                traverseAll: true
            });
        } catch (err) {
            throw err;
        }

        for (let j = 0, jMax = files.length; j < jMax; j++) {
            matches.push(files[i].path);
        }
    }

    createBuffer(grunt, fileData, options, matches);
}

/**
 * Create dataURIs from all image files and place them inside the buffer
 * with their respective id and MIME.
 *
 * @function createBuffer
 * @param {Object} grunt
 * @param {Object} fileData
 * @param {Object} options
 * @param {Array} matches
 * @api private
 */

function createBuffer (grunt, fileData, options, matches) {
    let buffer = [];

    for (let i = 0, max = matches.length; i < max; i++) {
        let match = matches[i];
        let uri = new DataURI(match);

        buffer.push(path.parse(match).name, uri.mimetype, uri.content);
    }

    writeBufferToDest(grunt, fileData, options, buffer);
}

/**
 * @function writeBufferToDest
 * @param {Object} grunt
 * @param {Object} fileData
 * @param {Object} options
 * @param {Array} buffer
 * @api private
 */

function writeBufferToDest (grunt, fileData, options, buffer) {
    if (typeof fileData.dest !== 'string') {
        throw new TypeError('dest must be a string.');
    }

    let content = '';

    // Prepend useObjectURLs invocation after parsing buffer.
    if (Boolean(options.useObjectURLs)) {
        content += 'BLITTER.useObjectURLs();';
    }

    // Wrap the buffer inside the parseBuffer method invocation.
    content = 'BLITTER.parseBuffer(' + JSON.stringify(buffer) + ');';

    grunt.file.write(path.resolve(fileData.dest), content);
}

/**
 * Read dist script and uglify it to dest.
 *
 * @function uglifyDistScript
 * @param {Object} grunt
 * @param {Object} fileData
 * @param {Object} options
 * @api public
 */

function uglifyDistScript (grunt, fileData, options) {
    let distScriptPath = path.resolve(__dirname, '../dist/blitter.js');

    if (!grunt.file.isFile(distScriptPath)) {
        throw new Error('blitter.js must be a file in node_modules/blitter/dist/');
    } else if (typeof fileData.dest !== 'string') {
        throw new TypeError('dest must be a string.');
    }

    let result = require('uglify-es').minify(grunt.file.read(distScriptPath), { mangle: false });

    if (result.error !== undefined) {
        throw result.error;
    } else {
        grunt.file.write(path.resolve(fileData.dest), result.code);
    }
}

module.exports = function (grunt) {
    grunt.registerMultiTask('blitter', function () {
        let options = this.options();

        if (this.target === 'distScript') {
            for (let i = 0, max = this.files.length; i < max; i++) {
                uglifyDistScript(grunt, this.files[i], options);
            }
        } else {
            for (let i = 0, max = this.files.length; i < max; i++) {
                recurseSrcDirectories(grunt, this.files[i], options);
            }
        }
    });
};
