'use strict';

const fs = require('fs');
const path = require('path');
const mime = require('mime');
const isImage = require('is-image');
const readDir = require('recursive-readdir');
const DataURI = require('datauri');

// This task relies on async functionality.
let asyncDone = null;

/**
 * @function testOriginalSrc
 * @param {Object} grunt
 * @param {Array} src
 * @api private
 */

function testOriginalSrc (grunt, src) {
    for (let i = 0, max = src.length; i < max; i++) {
        let item = src[i];

        if (typeof item !== 'string') {
            throw new Error('src must be string.');
        } else if (!grunt.file.isDir(path.resolve(item))) {
            throw new Error(item + ' must be directory in src.');
        }
    }
}

/**
 * @function testDest
 * @param {Object} grunt
 * @param {String} dest
 * @api private
 */

function testDest (grunt, dest) {
    if (typeof dest !== 'string') {
        throw new Error('dest must be string.');
    } else if (grunt.file.isDir(path.resolve(dest))) {
        throw new Error('dest cannot be directory.');
    }
}

/**
 * Find all image files in src directories.
 *
 * @function recurseSrcDirectories
 * @param {Object} grunt
 * @param {Object} fileData
 * @param {Object} options
 * @api private
 */

function recurseSrcDirectories (grunt, fileData, options) {
    let src = fileData.orig.src.map(item => path.resolve(item));
    let promises = [];

    // Ignore everything except directories and image files.
    // Store function in array for recursive-readdir module.
    let ignoreCallback = [(path, stats) => !(stats.isDirectory() || isImage(path))];

    for (let i = 0, max = src.length; i < max; i++) {
        promises.push(readDir(src[i], ignoreCallback).then(value => value, err => err));
    }

    Promise.all(promises)
        .then(values => {
            streamToDest(grunt, fileData, options, values.flat());
        }, err => {
            asyncDone(err);

            throw err;
        });
}

/**
 * Stream data URIs from matched image files into dest file with their
 * respective id and MIME.
 *
 * @function streamToDest
 * @param {Object} grunt
 * @param {Object} fileData
 * @param {Object} options
 * @param {Array} matches
 * @api private
 */

function streamToDest (grunt, fileData, options, matches) {
    let writable = fs.createWriteStream(path.resolve(fileData.dest));

    // Always prepend useObjectURLs invocation before parseBuffer invocation.
    let data = options.useObjectURLs ? 'BLITTER.useObjectURLs();' : '';

    // Start parseBuffer wrap.
    data += 'BLITTER.parseBuffer([';

    try {
        writable.write(data, 'utf8', () => {
            streamBuffer(grunt, matches, writable);
        });
    } catch (err) {
        asyncDone(err);

        throw err;
    }
}

/**
 * Stream the buffer recursively inside the parseBuffer invocation.
 *
 * @function streamBuffer
 * @param {Object} grunt
 * @param {Array} matches
 * @param {WriteStream} writable
 * @api private
 */

function streamBuffer (grunt, matches, writable) {
    let match = matches.pop();

    if (match === undefined) {
        // End parseBuffer wrap.
        writable.end(']);', 'utf8', () => {
            asyncDone(true);
        });
    } else {
        // Start DataURI wrap.
        let data = '"' + path.parse(match).name + '","' + mime.getType(match) + '","';

        writable.write(data, 'utf8', () => {
            let data = new DataURI();

            // Everytime readable stream finishes piping all data to the
            // writable stream move on to next matched file.
            data.on('end', () => {
                // End DataURI wrap.
                let data = matches.length === 0 ? '"' : '",';

                writable.write(data, 'utf8', () => {
                    streamBuffer(grunt, matches, writable);
                });
            });

            data.pipe(writable, { end: false });
            data.encode(match);
        });
    }
}

module.exports = function (grunt) {
    grunt.registerMultiTask('blitter', function () {
        // Execute task asynchronously.
        asyncDone = grunt.task.current.async();

        let options = this.options();

        if (options.useObjectURLs === undefined) {
            options.useObjectURLs = true;
        } else {
            options.useObjectURLs = Boolean(options.useObjectURLs);
        }

        for (let i = 0, max = this.files.length; i < max; i++) {
            let fileData = this.files[i];

            try {
                testOriginalSrc(grunt, fileData.orig.src);
                testDest(grunt, fileData.dest);
            } catch (err) {
                asyncDone(err);

                throw err;
            }

            recurseSrcDirectories(grunt, fileData, options);
        }
    });
};
