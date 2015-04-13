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
        if (!!res.success === false) {
            httpCode = httpCodes.BAD_REQUEST; // Unauthorized
        } else {
            httpCode = httpCodes.OK;
        }
        res.writeHead(httpCode);
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
        var file = __dirname + '/actions/' + stat.name;
        require(file)(app);
        next();
    });
    
    
    walker.on('end', function () {
        app.use(setResponse);
    });
};