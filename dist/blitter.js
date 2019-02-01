(function (window) { // start self executing function...

'use strict';

let emptyPNG = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';

// Queue frame ids depending on the order they are found in the DOM.
let idQueue = [];

// Store frames.
let frameRegistry = {};

// Store MIMEs.
let mimeRegistry = {};

// Store image data.
let imageDataRegistry = {};

// Store blobs.
let blobRegistry = {};

// Reference image data as ObjectURLs?
let usingObjectURLs = false;

/**
 * @function hasMIME
 * @param {String} id
 * @return {Boolean}
 * @api private
 */

function hasMIME (id) {
    return mimeRegistry[id] !== undefined;
}

/**
 * @function hasBlob
 * @param {String} id
 * @return {Boolean}
 * @api private
 */

function hasBlob (id) {
    return blobRegistry[id] !== undefined;
}

/**
 * @function hasImageData
 * @param {String} id
 * @return {Boolean}
 * @api private
 */

function hasImageData (id) {
    return imageDataRegistry[id] !== undefined;
}

/**
 * Query all img nodes with blit-id attribute in the DOM and store them as frames.
 *
 * @function queryDOM
 * @api private
 */

function queryDOM () {
    let nodes = document.body.querySelectorAll('img[blit-id]');

    for (let i = 0, max = nodes.length; i < max; i++) {
        storeFrame(nodes[i]);
    }
}

/**
 * @function storeFrame
 * @param {HTMLElement} node
 * @api private
 */

function storeFrame (node) {
    let id = node.getAttribute('blit-id');

    if (frameRegistry[id] !== undefined) {
        frameRegistry[id].push(node);
    } else {
        frameRegistry[id] = [node];

        // Only queue unique ids.
        idQueue.push(id);
    }

    // Setting an empty png as src prevents default borders from rendering while loading the page.
    node.src = emptyPNG;
}

/**
 * Create Blob from the dataURI.
 *
 * @function createBlob
 * @param {String} id
 * @param {String} mime
 * @param {String} dataURI
 * @return {Blob}
 * @api private
 */

function createBlob (id, mime, dataURI) {
    let content = [];

    // Decode the dataURI.
    let data = window.atob(dataURI.split(',')[1]);

    for (let i = 0, max = data.length; i < max; i++) {
        content[i] = data.charCodeAt(i);
    }

    let blob = new Blob([new Uint8Array(content)], { type: mime });

    blobRegistry[id] = blob;

    return blob;
}

/**
 * Attach image data to frames with queued ids.
 *
 * @function iterateIdQueue
 * @api private
 */

function iterateIdQueue () {
    let max = idQueue.length;

    // Don't check empty queue.
    if (max === 0) { return undefined; }

    let newIdQueue = [];

    for (let i = 0; i < max; i++) {
        let id = idQueue[i];

        if (!hasImageData(id)) {
            // Recycle id for next iteration.
            newIdQueue.push(id);
        } else {
            attachImageDataToFrames(id);
        }
    }

    // Discard ids that have not been recycled.
    idQueue = newIdQueue;
}

/**
 * @function attachImageDataToFrames
 * @param {String} id
 * @api private
 */

function attachImageDataToFrames (id) {
    let nodes = frameRegistry[id];

    if (nodes === undefined) { return undefined; }

    let data = imageDataRegistry[id];

    for (let i = 0, max = nodes.length; i < max; i++) {
        nodes[i].src = data;
    }

    delete frameRegistry[id];
}

window.BLITTER = {
    /**
     * @function hasMIME
     * @param {String} id
     * @return {Boolean}
     * @api public
     */

    hasMIME: function (id) {
        return hasMIME(id);
    },

    /**
     * @function getMIME
     * @param {String} id
     * @return {String}
     * @api public
     */

    getMIME: function (id) {
        return hasMIME(id) ? mimeRegistry[id] : '';
    },

    /**
     * @function hasBlob
     * @param {String} id
     * @return {Boolean}
     * @api public
     */

    hasBlob: function (id) {
        return hasBlob(id);
    },

    /**
     * @function getBlob
     * @param {String} id
     * @return {String}
     * @api public
     */

    getBlob: function (id) {
        return hasBlob(id) ? blobRegistry[id] : null;
    },

    /**
     * @function hasImageData
     * @param {String} id
     * @return {Boolean}
     * @api public
     */

    hasImageData: function (id) {
        return hasImageData(id);
    },

    /**
     * @function getImageData
     * @param {String} id
     * @return {String}
     * @api public
     */

    getImageData: function (id) {
        return hasImageData(id) ? imageDataRegistry[id] : emptyPNG;
    },

    /**
     * @function isUsingObjectURLs
     * @return {Boolean}
     * @api public
     */

    isUsingObjectURLs: function () {
        return usingObjectURLs;
    },

    /**
     * @function useObjectURLs
     * @api public
     */

    useObjectURLs: function () {
        usingObjectURLs = true;
    },

    /**
     * @function parseBuffer
     * @param {Object} buffer
     * @api public
     */

    parseBuffer: function (buffer) {
        for (let i = 0, max = buffer.length; i < max; i += 3) {
            let id = buffer[i];
            let mime = buffer[i + 1];
            let dataURI = buffer[i + 2];

            if (imageDataRegistry[id] === undefined) {
                if (usingObjectURLs) {
                    imageDataRegistry[id] = URL.createObjectURL(createBlob(id, mime, dataURI));
                } else {
                    imageDataRegistry[id] = dataURI;
                }

                mimeRegistry[id] = mime;
            }
        }

        // Always iterate queue after parsing sprite buffer.
        iterateIdQueue();
    }
};

// Query DOM immediately to prevent img elements with blit-ids from rendering
// default border for empty src tags.
queryDOM();

}(this)); // end self executing function...
