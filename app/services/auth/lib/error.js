/*jshint node: true*/
'use strict';

/**
 * Auth error
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * @param       {String}        message         The reason of the error
 * @param       {Array}         errors          The error strings
 */
function AuthError (message, errors)
{
    this.name = 'AuthError';
    this.message = message;
    this.errors = errors;
};

AuthError.prototype = new Error();
AuthError.prototype.constructor = AuthError;


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


// Exports the constructor itself
module.exports = AuthError;