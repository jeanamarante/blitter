'use strict';

const path = require('path');
const isImage = require('is-image');
const readDir = require('recursive-readdir');

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
            throwAsyncError(new Error(`${item} must be directory in src.`));
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
    let promises = [];

    // Ignore everything except directories and image files.
    // Store function in array for recursive-readdir module.
    let ignoreCallback = [(file, stats) => !(stats.isDirectory() || isImage(file))];

    for (let i = 0, max = fileData.src.length; i < max; i++) {
        promises.push(readDir(fileData.src[i], ignoreCallback).then((value) => value, (err) => err));
    }

    Promise.all(promises)
        .then((values) => {
            require('./encode/base64')(grunt, fileData, options, asyncDone, throwAsyncError, values.flat());
        }, throwAsyncError);
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

            // Replace fileData with new object containing resolved paths that
            // are commonly used throughout all modules.
            fileData = {
                src: fileData.orig.src.map((item) => path.resolve(item)),
                dest: path.resolve(fileData.dest)
            };

            recurseSrcDirectories(grunt, fileData, options);
        }
    });
};
