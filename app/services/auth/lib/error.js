/*jshint node: true*/
'use strict';

/**
 * Auth error used to gather error messages for authorization
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * @param       {String}        message         The reason of the error
 * @param       {Array}         errors          The error strings
 * @constructor
 */
function AuthError (message, errors)
{
    this.name = 'AuthError';
    this.message = message;
    this.errors = errors;
}

AuthError.prototype = new Error();


/**
 * Returns the error objects provided by the error thrown
 * 
 * @return      {Array}         An array of Objects
 */
AuthError.prototype.getErrors = function ()
{
    return this.errors;
};


/**
 * Returns the message
 * 
 * @return      {String}  
 */
AuthError.prototype.getMessage = function ()
{
    return this.message;
};


// Exports the factory
module.exports = {
    
    /**
     * Creates new error instance
     * 
     * @param       {String}        message
     * @param       {Array}         errors
     * @returns     {AuthError}
     */
    create : function (message, errors) {
        return new AuthError(message, errors);
    }
};