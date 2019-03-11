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
            throwAsyncError(new Error('src must be string.'));
        } else if (!grunt.file.isDir(path.resolve(item))) {
            throwAsyncError(new Error(item + ' must be directory in src.'));
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
        throwAsyncError(new Error('dest must be string.'));
    } else if (grunt.file.isDir(path.resolve(dest))) {
        throwAsyncError(new Error('dest cannot be directory.'));
    }
}

/**
 * Pass error to async done function before throwing error to let
 * grunt know that the task has failed.
 *
 * @function throwAsyncError
 * @param {Error} err
 * @api private
 */

function throwAsyncError (err) {
    asyncDone(err);

    throw err;
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
    let src = fileData.orig.src.map((item) => path.resolve(item));
    let promises = [];

    // Ignore everything except directories and image files.
    // Store function in array for recursive-readdir module.
    let ignoreCallback = [(file, stats) => !(stats.isDirectory() || isImage(file))];

    for (let i = 0, max = src.length; i < max; i++) {
        promises.push(readDir(src[i], ignoreCallback).then((value) => value, (err) => err));
    }

    Promise.all(promises)
        .then((values) => {
            streamToDest(grunt, fileData, options, values.flat());
        }, throwAsyncError);
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
    // Always prepend useObjectURLs invocation before parseBuffer invocation.
    let data = options.useObjectURLs ? 'BLITTER.useObjectURLs();' : '';

    // Start parseBuffer wrap.
    data += 'BLITTER.parseBuffer([';

    let writable = fs.createWriteStream(path.resolve(fileData.dest));

    writable.on('error', throwAsyncError);

    writable.write(data, 'utf8', () => {
        streamBuffer(grunt, matches, writable);
    });
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

            data.on('error', throwAsyncError);

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

        options.useObjectURLs = options.useObjectURLs === undefined ? true : Boolean(options.useObjectURLs);

        for (let i = 0, max = this.files.length; i < max; i++) {
            let fileData = this.files[i];

            testOriginalSrc(grunt, fileData.orig.src);
            testDest(grunt, fileData.dest);
            recurseSrcDirectories(grunt, fileData, options);
        }
    });
};
