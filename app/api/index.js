/*jshint node: true*/
'use strict';

var httpCodes = require('./codes.js'),
    controllers = require('./controllers');

/**
 * API module
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * @param       {express}       app         The application
 * @param       {Object}        config      The application config
 */
module.exports = function (app, config)
{
    var bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true
    }));
    
    app.use(function (req, res, next) 
    {
        res.set('Content-Type', 'application/json'); // JSON responses for all calls
        return next();
    });

    // The callback takes an error of AuthError type and the response as
    // parameters.
    require('./../services/auth')(app, config.auth, function (err, res) 
    {
        var errorMsgs = err.getErrors();
        res.writeHead(httpCodes.UNAUTHORIZED); // Unauthorized
        res.write(JSON.stringify({
            success : false,
            code: httpCodes.UNAUTHORIZED,
            errors : errorMsgs
        }));
        res.send();
    });
    
    // Apply controllers
    controllers(app, config.controllers);
    
    
}