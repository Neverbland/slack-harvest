/*jshint node: true*/
'use strict';

var httpCodes               =   require('./../codes.js'),
    walk                    =   require('walk')
;
  
  
/**
 * API controllers
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * @param       {express}       app         The application
 * @param       {Object}        config      The application config
 */
module.exports = function (app, config) 
{
    var walker;
    
    /**
     * Sets json response
     * 
     * @param   {Object}        req
     * @param   {Object}        res
     * @param   {Function}      next
     * @returns {undefined}
     */
    function setResponse (req, res, next) 
    {
        var httpCode;
        
        if (typeof res.success === 'undefined') {
            res.statusCode = httpCodes.NOT_FOUND;
        }

        if (Boolean(res.success) === false) {
            httpCode = (res.statusCode === httpCodes.NOT_FOUND) ? res.statusCode : httpCodes.BAD_REQUEST; // Unauthorized
        } else {
            httpCode = httpCodes.OK;
        }
        res.statusCode = httpCode;
        var responseJson = {
            success : Boolean(res.success),
            code: httpCode
        };
        if (!!res.errors) {
            responseJson.errors = res.errors;
        }
        res.write(JSON.stringify(responseJson));
        res.send();
    }
    
    walker  = walk.walk(__dirname + '/actions', {
        followLinks : false 
    });
    
    // Load all actions
    
    walker.on('file', function (root, stat, next) {
        var file = __dirname + '/actions/' + stat.name,
            baseName = stat.name.substr(0, stat.name.length - 3),
            conf = config[baseName] || {};
        require(file)(app, conf);
        next();
    });
    
    
    walker.on('end', function () {
        // Default response should be 404
        app.use(setResponse);
    });
};