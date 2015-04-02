/*jshint node: true*/
'use strict';

function InvalidOptionError () {}
InvalidOptionError.prototype = new Error();
InvalidOptionError.prototype.constructor = InvalidOptionError;


function UserSessionStep (options, isLast)
{
    this.options = options;
    this.isLast = Boolean(isLast) || false;
}


UserSessionStep.prototype = (function () {
    
    
    /**
     * Returns an option for given key. Throws an error if such option does
     * not exist
     * 
     * @param       {Object}                options
     * @param       {String}                key
     * @returns     {Object}
     * @throws      {InvalidOptionError}    If such option does not exist
     */
    function validateOption (options, key)
    {
        if (typeof options[key] === 'undefined') {
            throw new InvalidOptionError('Option ' + key + ' does not exist.'); 
        }
       
        return options[key];
    }
    
    return {
        
        
        /**
         * Returns an option for given key. Throws an error if such option does
         * not exist
         * 
         * @param       {String}                key
         * @returns     {Object}
         * @throws      {InvalidOptionError}    If such option does not exist
         */
        getOption : function (key)
        {
            return validateOption(this.options, key);
        },
        
        
        /**
         * Returns all available options
         * 
         * @returns {Object}
         */
        getOptions : function ()
        {
            return this.options;
        }

    };
    
})();
UserSessionStep.prototype.constructor = UserSessionStep;


/**
 * Constructs the user session object
 * 
 * @constructor
 * @returns {undefined}
 */
function UserSession ()
{
    this.users = {};
}


UserSession.prototype = (function () {
    
    
    function validateStep (step)
    {
        if (!(step instanceof UserSessionStep)) {
            throw new Error('The step needs to be an instance of UserSessionStep!');
        }
        
        return step;
    }
    
    
    return {
    
        /**
         * Registers an user session step
         * 
         * @param       {String}            userId      Unique user identifier
         * @param       {UserSessionStep}   step
         * @returns     {UserSession}                   This instance
         */
        addStep : function (userId, step)
        {
            this.users[userId] = this.users[userId] || [];
            this.users[userId].push(validateStep(step));
            return this;
        },
        
        
        /**
         * Clears the session for userId
         * 
         * @param       {String}              userId
         * @returns     {UserSession}                   This instance
         */
        clear : function (userId)
        {
            this.users[userId] = [];
        },
        
        
        /**
         * Returns true if user given by id has any steps stored
         * 
         * @param       {String}                userId
         * @returns     {Boolean}
         */
        hasSession : function (userId)
        {
            return (!!this.users[userId] && this.users[userId].length);
        },
        
        
        /**
         * Returns stored step for given user and number
         * 
         * @param       {String}        userId  The user id
         * @param       {Number}        step    The step number
         * @returns     {Object}
         * @throws      {Error}         If the use has no steps stored or
         *                              given step dows not exist
         */
        getStep : function (userId, step) 
        {

            var steps = this.users[userId] || [],
                step = step || steps.length,
                index = step - 1,
                value;
        
            if (!steps.length) {
                throw new Error('Given user has no steps stored!');
            }
            
            value = steps[index];
            
            if (typeof value === 'undefined') {
                throw new Error('Step ' + step + ' does not exist!');
            }
            
            return value;
        }
    };
    
})();

UserSession.prototype.constructor = UserSession;

var instance = null;

module.exports = {
    
    /**
     * The error constructor
     * 
     * @returns {InvalidOptionError}
     */
    error : InvalidOptionError,
    
    /**
     * Creates a new instance of UserSession class
     * 
     * @returns {UserSession}
     */
    create : function ()
    {
        return new UserSession();
    },
    
    /**
     * Returns default, single instance of UserSession
     * 
     * @returns {UserSession}
     */
    getDefault : function ()
    {
        if (instance === null) {
            instance = this.create();
        }
        
        return instance;
    },
    
    /**
     * Creates new session step
     * 
     * @param       {Object}        options
     * @param       {Boolean}       isLast
     * @returns     {UserSessionStep}
     */
    createStep : function (options, isLast)
    {
        return new UserSessionStep(options, isLast);
    }
};