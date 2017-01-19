(function (window) { // start self executing function...

'use strict';

var emptyPNG = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';

// Queue frame ids depending on the order they are found.
var queue = [];

// Store frames.
var frames = {};

// Store image data.
var imageData = {};

// Reference image data as ObjectURLs?
var useURLs = false;

/**
 * Query all img nodes in DOM.
 *
 * @function queryDOM
 * @api private
 */

function queryDOM () {
    var nodes = document.body.querySelectorAll('img');

    for (var i = 0, max = nodes.length; i < max; i++) {
        scanHTMLNode(nodes[i]);
    }
}

/**
 * @function scanHTMLNode
 * @param {HTMLElement} node
 * @api private
 */

function scanHTMLNode (node) {
    var id = node.getAttribute('blit-id');

    // img elements without a valid blit-id are ignored.
    if (!id) { return undefined; }

    if (!frames[id]) {
        frames[id] = [node];

        // Only push unique ids.
        queue.push(id);
    } else {
        frames[id].push(node);
    }

    // Setting an empty png in src prevents default borders from rendering while loading the page.
    node.src = emptyPNG;
}

/**
 * Create Blob from the dataURI.
 *
 * @function createBlob
 * @param {String} mime
 * @param {String} dataURI
 * return {Blob}
 * @api private
 */

function createBlob (mime, dataURI) {
    var content = [];

    // Decode the dataURI.
    var data = atob(dataURI.split(',')[1]);

    for (var i = 0, max = data.length; i < max; i++) {
        content[i] = data.charCodeAt(i);
    }

    return new Blob([new Uint8Array(content)], { type: mime });
}

/**
 * Create ObjectURL from the Blob.
 *
 * @function createObjectURL
 * @param {String} mime
 * @param {String} dataURI
 * @return {String}
 * @api private
 */

function createObjectURL (mime, dataURI) {
    var blob = createBlob(mime, dataURI);

    return URL.createObjectURL(blob);
}

/**
 * Iterate queue and attach image data to frames.
 *
 * @function checkQueue
 * @api private
 */

function checkQueue () {
    var max = queue.length;

    // Don't check empty queue.
    if (max === 0) { return undefined; }

    var newQueue = [];

    for (var i = 0; i < max; i++) {
        var id = queue[i];

        if (hasImageData(id)) {
            appendImageDataToNodes(id);

            // Discard nodes.
            frames[id] = undefined;
        } else {
            // Recycle id for next iteration.
            newQueue.push(id);
        }
    }

    // Replace old queue with new one.
    queue = newQueue;
}

/**
 * @function appendImageDataToNodes
 * @param {String} id
 * @api private
 */

function appendImageDataToNodes (id) {
    var data = imageData[id];
    var nodes = frames[id];

    for (var i = 0, max = nodes.length; i < max; i++) {
        nodes[i].src = data;
    }
}

/**
 * @function hasImageData
 * @param {String} id
 * @return {Boolean}
 * @api private
 */

function hasImageData (id) {
    return imageData[id] !== undefined;
}

window.BLITTER = {
    /**
     * Allow BLITTER to use ObjectURLs.
     *
     * @function useObjectURLs
     * @api public
     */

    useObjectURLs: function () {
        useURLs = true;
    },

    /**
     * Parse sprite buffer.
     *
     * @function loadSpriteBuffer
     * @param {Object} buffer
     * @api public
     */

    loadSpriteBuffer: function (buffer) {
        var keys = Object.keys(buffer);

        for (var i = 0, max = keys.length; i < max; i++) {
            var id = keys[i];
            var arr = buffer[id];
            var mime = arr[0];
            var dataURI = arr[1];

            imageData[id] = useURLs ? createObjectURL(mime, dataURI) : dataURI;
        }

        // Check queue after parsing sprite buffer.
        checkQueue();
    },

    /**
     * @function getImageData
     * @param {String} id
     * @return {String}
     * @api public
     */

    getImageData: function (id) {
        return hasImageData(id) ? imageData[id] : emptyPNG;
    }
};

// Query DOM immediately to prevent img elements with blit-ids from rendering
// default border for empty src tags.
queryDOM();

}(this)); // end self executing function...
