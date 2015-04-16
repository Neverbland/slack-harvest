/*jshint node: true*/
'use strict';

var ConfigResolver = new function ()
{
    var env = process.env.env || 'live';

    this.getConfig = function ()
    {
        var config;
        if (env === 'test') {
            config = require('./../test/config.json');
        } else {
            try {
                config = require('./../config.json');
            } catch (err) {
                config = require('./../config.dist.json');
            }
        }

        return config;
    };
};

module.exports = ConfigResolver.getConfig();
