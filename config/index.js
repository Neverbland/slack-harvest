/*jshint node: true*/
'use strict';

module.exports = (function () {
    var config;
    try {
        config = require('./../config.json');
    } catch (err) {
        config = require('./../config.dist.json');
    }

    return config;
})();