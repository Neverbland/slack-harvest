/*jshint node: true*/
'use strict';

var walk        =   require('walk'),
    Q           =   require('q'),
    walker      =   walk.walk(__dirname + '/providers', {
        followLinks : false 
    });
;

module.exports = function (config, callback) 
{
    var promises = [];
    walker.on('file', function (root, stat, next) {
        var file = __dirname + '/providers/' + stat.name,
        promise = require(file)(config);
        promises.push(promise);
        
        next();
    });
    
    walker.on('end', function () {
        Q.all(promises).then(function () {
            callback();
        });
    });
};