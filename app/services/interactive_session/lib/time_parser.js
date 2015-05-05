/*jshint node: true*/
'use strict';

var instance = null,
    _ = require('lodash'),
    defaultTranslators
;


defaultTranslators = [
    {
        /**
         * Retuns bool info if this translator can translate the given time
         * 
         * @param       {String}        time
         * @returns     {Boolean}   
         */
        canTranslate : function (time)
        {
            var regexp = /^([01]?\d|2[0-3])(:[0-5]\d){1,2}$/;
            return regexp.test(time);
        },
        
        /**
         * Translates the input time string to number of hours
         * 
         * @param       {String}        time
         * @returns     {Number}        Float value for the number of hours
         */
        translate : function (time)
        {
            var split = time.split(':'),
                hours = split[0],
                mins = split[1],
                hoursInt = parseInt(hours),
                minsInt = parseInt(mins)
            ;
            
            return hoursInt + (minsInt / 60); // Number of hours + part of hour
        }
    },
    {
        /**
         * Retuns bool info if this translator can translate the given time
         * 
         * @param       {String}        time
         * @returns     {Boolean}   
         */
        canTranslate : function (time)
        {
            var n = ~~Number(time);
            return String(n) === time && n >= 0;
        },
        
        /**
         * Translates the input time string to number of hours
         * 
         * @param       {String}        time
         * @returns     {Number}        Float value for the number of hours
         */
        translate : function (time)
        {

            var 
                secs = Number(time),
                hours = Math.floor(secs / (60 * 60)),
                divisorForMinutes = secs % (60 * 60),
                mins = Math.floor(divisorForMinutes / 60),
                divisorForSeconds = divisorForMinutes % 60,
                seconds = Math.ceil(divisorForSeconds),
                
                hoursInt = parseInt(hours),
                minsInt = parseInt(mins),
                secondsInt = parseInt(seconds)
            ;
            
            return hoursInt + (minsInt / 60) + (secondsInt / (60 * 60)); // Number of hours + part of hour
        }
    }
];


/**
 * Populates the parser instance with default time translators
 * 
 * @param       {Parser}        parser
 * @returns     {undefined}
 */
function populate (parser)
{
    _.each(defaultTranslators, function (translator) {
        parser.addTranslator(translator);
    });
}


function TranslatorNotFoundError ()
{}
TranslatorNotFoundError.prototype = new Error();
TranslatorNotFoundError.prototype.constructor = TranslatorNotFoundError;


function Parser ()
{
    
    var translators = [];
    
    /**
     * Registers a translator object
     * 
     * @param   {Object}        translator
     * @returns {Parser}        This instance
     */
    this.addTranslator = function (translator)
    {
        translators.push(translator);
        return this;
    };
    
    
    /**
     * Parses the input string to get the output
     * number of hours 
     * 
     * @param       {String}    time
     * @returns     {Number}
     * @throws {type} description
     */
    this.parse = function (time)
    {
        var hours = null,
            isDone = false
        ;
        _.each (translators, function (translator) {
            if (isDone || !translator.canTranslate(time)) {
                return;
            }
            
            hours = translator.translate(time);
        });
        
        if (hours === null) {
            throw new TranslatorNotFoundError('Could not translate ' + time);
        } else {
            return hours;
        }
    };
    
    /**
     * Provides a collection of all registered translators
     * 
     * @returns     {Array}     An array of translators
     */
    this.getTranslators = function ()
    {
        return translators;
    };
}

Parser.prototype = {};
Parser.prototype.constructor = Parser;



module.exports = {
    
    /**
     * Returns singleton instance of parser
     * 
     * @returns     {Parser}
     */
    getDefault : function ()
    {
        if (instance === null) {
            instance = this.createDefault();
        }
        
        return instance;
    },
    
    
    /**
     * Creates a new instance of Parser
     * 
     * @returns     {Parser}
     */
    createDefault : function ()
    {
        var instance = new Parser();
        populate(instance);
        
        return instance;
    },
    
    error : TranslatorNotFoundError     // The constructor for the error
};