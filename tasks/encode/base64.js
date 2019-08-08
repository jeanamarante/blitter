'use strict';

const fs = require('fs');
const path = require('path');
const mime = require('mime');
const { Base64Encode } = require('base64-stream');

let asyncDone = null;
let throwAsyncError = null;

// Array of matched files.
let files = null;

// WritableStream for dest file.
let writable = null;

// TransformStream that encodes buffer data to base64 data.
let transform = null;

let readableClosed = false;
let transformClosed = false;

/**
 * Stream data URIs from matched image files into dest file with their
 * respective id and MIME.
 *
 * @function initializeStreamToDest
 * @param {Object} grunt
 * @param {Object} fileData
 * @param {Object} options
 * @api private
 */

function initializeStreamToDest (grunt, fileData, options) {
    // Always prepend useObjectURLs invocation before parseBuffer invocation.
    let content = options.useObjectURLs ? 'BLITTER.useObjectURLs();' : '';

    // Start parseBuffer wrap.
    content += 'BLITTER.parseBuffer([';

    writable = fs.createWriteStream(fileData.dest);

    writable.once('error', throwAsyncError);

    writable.write(content, 'utf8', streamMatch);
}

/**
 * Stream buffer recursively in the parseBuffer invocation.
 *
 * @function streamMatch
 * @api private
 */

function streamMatch () {
    let match = files.pop();

    if (match === undefined) {
        // End parseBuffer wrap.
        writable.end(']);', 'utf8', () => {
            asyncDone(true);
        });
    } else {
        let mimeType = mime.getType(match);
        let wrapStart = `"${path.parse(match).name}","${mimeType}","`;

        writable.write(wrapStart, 'utf8', streamEncodedData(match, mimeType));
    }
}

/**
 * @function streamEncodedData
 * @param {String} file
 * @param {String} mimeType
 * @api private
 */

function streamEncodedData (file, mimeType) {
    let readable = fs.createReadStream(file);

    transform = new Base64Encode({ prefix: `data:${mimeType};base64,` });

    readable.once('error', throwAsyncError);
    readable.once('close', onReadableClose);

    transform.once('end', onTransformEnd);
    transform.once('error', throwAsyncError);
    transform.once('close', onTransformClose);

    readable.pipe(transform).pipe(writable, { end: false });
}

/**
 * @function onReadableClose
 * @api private
 */

function onReadableClose () {
    readableClosed = true;

    closeStream();
}

/**
 * Manually destroy transform stream once readable stream is
 * done reading data.
 *
 * @function onTransformEnd
 * @api private
 */

function onTransformEnd () {
    let stream = transform;

    transform = null;

    stream.destroy();
}

/**
 * @function onTransformClose
 * @api private
 */

function onTransformClose () {
    transformClosed = true;

    closeStream();
}

/**
 * Once the readable and transform stream are closed move on to
 * the next matched file.
 *
 * @function closeStream
 * @api private
 */

function closeStream () {
    if (!readableClosed || !transformClosed) { return undefined; }

    readableClosed = false;
    transformClosed = false;

    let wrapEnd = files.length === 0 ? '"' : '",';

    writable.write(wrapEnd, 'utf8', streamMatch);
}

module.exports = function (grunt, fileData, options, doneCallback, errorCallback, matches) {
    asyncDone = doneCallback;
    throwAsyncError = errorCallback;

    files = matches;

    initializeStreamToDest(grunt, fileData, options);
};
