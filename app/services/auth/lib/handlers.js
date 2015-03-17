/*jshint node: true*/
'use strict';

var crypto = require('crypto'),
    authErrorFactory = require('./error.js');

/**
 * Generates/recreates hash for given secret, seed and action
 * 
 * @param       {String}    secret
 * @param       {String}    seed
 * @param       {String}    action
 * @returns     {String}
 */
function generateHash (secret, seed, action)
{
    var hashBase = [
        secret,
        seed,
        action
    ].join('|');

    var shasum = crypto.createHash('sha1');
    shasum.update(hashBase, 'utf8');
    
    return shasum.digest('hex');
}

/**
 * Returns handlers for auth checking
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 */
var handlers = {
    /**
     * Secret based handler
     * 
     * @constructor         Creates a secret handler 
     */
    secret : function (secret) 
    {
        this.secret = secret;
    }
}



handlers.secret.prototype = {
    
    /**
     * Validates the request
     * 
     * @param       {Object}          req
     * @returns     {undefined}
     */
    validate : function (req)
    {
        var requestToken = req.body.token;
        var action = req.body.action;
        var seed = req.body.seed;
        var hash = generateHash(this.secret, seed, action);
        
        if (hash !== requestToken) {
            throw new authErrorFactory.create("Invalid token", [
                "Provided token is invalid"
            ]);
        }
    }
};
handlers.secret.prototype.constructor = handlers.secret;



module.exports = function (auth, config) 
{
    for (var handlerName in config) {
        if (config.hasOwnProperty(handlerName)) {
            var param = config[handlerName];
            if (!handlers[handlerName]) {
                continue;
            }
            var handler = new handlers[handlerName](param);
            auth.addHandler(handler);
        }
    }
}