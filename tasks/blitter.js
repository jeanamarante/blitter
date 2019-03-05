'use strict';

const fs = require('fs');
const path = require('path');
const isImage = require('is-image');
const readDir = require('recursive-readdir');
const DataURI = require('datauri');

// This task relies on async functionality.
let asyncDone = null;

/**
 * Ignore everything except directories and image files.
 *
 * @function canIgnore
 * @param {String} path
 * @param {Stats} stats
 * @return {Boolean}
 * @api private
 */

function canIgnore (path, stats) {
    return !(stats.isDirectory() || isImage(path));
}

/**
 * @function resolveSrc
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function resolveSrc (grunt, arr) {
    var resolvedArr = [];

    for (var i = 0, max = arr.length; i < max; i++) {
        resolvedArr[i] = path.resolve(arr[i]);

        if (!grunt.file.isDir(resolvedArr[i])) {
            throw new Error(arr[i] + ' must be directory in src.');
        }
    }

    return resolvedArr;
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
    let src = [];

    try {
        src = resolveSrc(grunt, fileData.orig.src);
    } catch (err) {
        asyncDone(err);

        throw err;
    }

    let promises = [];

    for (let i = 0, max = src.length; i < max; i++) {
        let promise = readDir(src[i], [canIgnore]).then(value => value, err => err);

        promises.push(promise);
    }

    Promise.all(promises)
        .then(values => {
            streamBuffer(grunt, fileData, options, values);
        }, err => {
            asyncDone(err);

            throw err;
        });
}

/**
 * Create data URIs from all image files and stream them into dest file
 * with their respective id and MIME.
 *
 * @function createBuffer
 * @param {Object} grunt
 * @param {Object} fileData
 * @param {Object} options
 * @param {Array} matches
 * @api private
 */

function streamBuffer (grunt, fileData, options, matches) {
    let dest = path.resolve(fileData.dest);
    let writable = fs.createWriteStream(dest);
}

module.exports = function (grunt) {
    grunt.registerMultiTask('blitter', function () {
        let options = this.options();

        // Execute task asynchronously.
        asyncDone = grunt.task.current.async();

        if (options.useObjectURLs === undefined) {
            options.useObjectURLs = true;
        } else {
            options.useObjectURLs = Boolean(options.useObjectURLs);
        }

        for (let i = 0, max = this.files.length; i < max; i++) {
            recurseSrcDirectories(grunt, this.files[i], options);
        }
    });
};
