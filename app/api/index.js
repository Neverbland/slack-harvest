/*jshint node: true*/
'use strict';

/**
 * API module
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * @param       {express}       app         The application
 * @param       {Object}        config      The application config
 */
module.exports = function (app, config) {
    var bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true
    }));
    require('./../services/auth')(app, config.auth);
}