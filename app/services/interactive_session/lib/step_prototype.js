/*jshint node: true*/
'use strict';

var interactiveSession = require('./user_session.js'),
    stepPrototype = {
    
    /**
     * Checks if given option value is negative
     * 
     * @param       {Object}    option
     * @param       {String}    value
     * @returns     {Boolean}   
     */
    isRejectResponse : function (option, value)
    {
        return (option.type === 'system' && value === 'no');
    },
    
    /**
     * Executes the reject response providing reject data to the 
     * callback
     * 
     * @param   {String}        userId
     * @param   {Function}      callback
     * @returns {undefined}
     */
    executeRejectResponse : function (userId, callback)
    {
        interactiveSession.getDefault().clear(userId);
        callback(null, "Cool, try again later!", interactiveSession.createStep({}, '', true));
    }
    
    
    
};

module.exports = stepPrototype;