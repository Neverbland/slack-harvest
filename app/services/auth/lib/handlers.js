/*jshint node: true*/
'use strict';

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
//        var requestSecret = 
    }
};
handlers.secret.prototype.constructor = handlers.secret;



module.export = function (auth, config) {
    for (var handlerName in config) {
        if (config.hasOwnProperty(handlerName)) {
            var handler = new handlers(config[handlerName]);
            auth.addHandler(handler);
        }
    }
}