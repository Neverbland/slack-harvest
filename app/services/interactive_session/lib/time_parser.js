/*jshint node: true*/
'use strict';

var instance = null,
    _ = require('lodash'),
    defaultTranslators
;


defaultTranslators = [
    {
        // HH:mm format
        canTranslate : function (time)
        {
            var regexp = /^([01]?\d|2[0-3])(:[0-5]\d){1,2}$/;
            return regexp.test(time);
        },
        
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