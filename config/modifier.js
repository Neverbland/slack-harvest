/*jshint node: true*/
'use strict';

var walk        =   require('walk'),
    Q           =   require('q')
;

/**
 * Walks over a dir to call all config providers available. Each provides a promise
 * response. After all providers are called, executes a callback function.
 * 
 * @param       {Object}        config          The config object that will be modified
 * @param       {Function}      callback        The callback that executes in the end
 * @param       {String}        dirPath         Path to dir to seek for providers.
 *                                              If empty, takes default "providers" dir
 * @returns     {undefined}
 */
module.exports = function (config, callback, dirPath) 
{
    var promises = [],
        path = dirPath || __dirname + '/providers',
        walker      =   walk.walk(path, {
            followLinks : false 
        })
    ;
    
    walker.on('file', function (root, stat, next) {
        var file = path + '/' + stat.name,
            promise = require(file)(config);
            promises.push(promise)
        ;
        
        next();
    });
    
    walker.on('end', function () {
        Q.all(promises).then(function () {
            callback();
        });
    });
};