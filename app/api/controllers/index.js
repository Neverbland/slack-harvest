/*jshint node: true*/
'use strict';

var httpCodes = require('./../codes.js');

/**
 * API controllers
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * @param       {express}       app         The application
 * @param       {Object}        config      The application config
 */
module.exports = function (app, config) 
{
    app.post('/api/notify', function (req, res, next) {
        next();
    });
};