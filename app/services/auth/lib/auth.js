/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var Auth = function () {
    this.handlers = [];
};


/**
 * Validates registered handler
 * 
 * @param       {Object}        handler
 * @returns     {Object}        The same given handler object
 * @throws      {TypeError}     If the handler does not implement 'validate' method
 */
function validateHandler (handler)
{
    if (typeof handler.validate !== 'function') {
        throw new TypeError('The validator must implement method validate!');
    }
    
    return handler;
}


/**
 * Combines arrays
 * 
 * @param       {Array}         errors1
 * @param       {Array}         errors2
 * @returns     {Array}         Two arrays combined
 */
function mergeErrors (errors1, errors2)
{
    if ((typeof errors1.length === undefined) || (typeof errors2.length === undefined)) {
        throw new TypeError('Both given params should be array-like objects or arrays!');
    }
    for (var i = 0; i < errors2.length; i++) {
        var value = errors2[i];
        errors1.push(value);
    }
    
    return errors1;
}


Auth.prototype = {
    
    /**
     * Registers auth handler 
     * 
     * @param   {Object}    A handler for checking if given request is valid
     */
    addHandler : function (handler)
    {
        this.handlers.push(validateHandler(handler));
        return this;
    },
    
    
    /**
     * Clears all the handlers
     * 
     * @return  {Auth}      This instance
     */
    resetHandlers : function ()
    {
        this.handlers = [];
        return this;
    },
    
    
    /**
     * Validates if given request can be processed
     * 
     * @param   {Object}    req
     * @returns {Boolean}
     */
    hasAccess : function (req)
    {
        var requestErrors = [],
            hasAccess = true,
            handler
        ;
        for (var i = 0; i < this.handlers.length; i++) {
            handler = this.handlers[i];
            try {
                handler.validate(req);
            } catch (err) {
                hasAccess = false;
                if (err.name === 'AuthError') {
                    requestErrors = mergeErrors(requestErrors, err.getErrors());
                } else {
                    throw err;
                }
            }
        }
        
        if (!hasAccess) {
            req.errors = requestErrors;
        }
        
        return hasAccess;
    },
    
    
    /**
     * Returns an array of reasons why the request was denied taken from the 
     * request
     * 
     * @param       {Object}        The request object
     * @returns     {Array}
     */
    getErrors : function (req)
    {
        return req.errors || [];
    }
};


module.exports = new Auth();