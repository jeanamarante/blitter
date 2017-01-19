var path = require('path');

/**
 * Just read and write the script to dest.
 * The script is intended to be used in front-end apps.
 *
 * @function writeFile
 * @param {Object} grunt
 * @param {String} dest
 * @param {String} relPath
 * @api public
 */

exports.writeFile = function (grunt, task, relPath) {
    var scriptPath = path.resolve(__dirname, relPath);

    if (!grunt.file.exists(scriptPath)) { return undefined; }

    var content = grunt.file.read(scriptPath);

    if (Boolean(task.data.inline)) {
        content = '<script type="text/javascript">' + content + '</script>';
    }

    grunt.file.write(task.data.dest, content);
};
