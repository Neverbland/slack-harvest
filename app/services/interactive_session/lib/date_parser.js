/*jshint node: true*/
'use strict';

var 
    instance        =   null,
    _               =   require('lodash'),
    i18n            =   require('i18n')
;


function DateError (message)
{
    this.message = message || '';
}
DateError.prototype = Object.create(Error.prototype);
DateError.prototype.constructor = DateError;


function Parser ()
{
    
    /**
     * Formats the date to dd-mm-yyyy format
     * 
     * @param       {type}          date
     * @returns     {undefined}
     */
    function format (date)
    {
        var split = date.split(/[- /.]/); // regexp split
        return split[2] + split[1] + split[0];
    }
    
    
    /**
     * Parses the input string to get the output
     * number of hours 
     * 
     * @param       {String}        date
     * @param       {String}        prevDate
     * @returns     {Number}
     * @throws      {DateError}     If invalid date format provided or prevDate
     *                              is higher than the date.
     */
    this.parse = function (date, prevDate)
    {
        var reg = /^((0?[1-9]|[12][0-9]|3[01])[- /.](0?[1-9]|1[012])[- /.](19|20)?[0-9]{2})*$/,
            result
        ;
        if (!reg.test(date)) {
            throw new DateError(i18n.__('Invalid date format, try [dd-mm-YYYY].'));
        }
        
        result = format(date);
        
        if (prevDate && (prevDate > result)) {
            throw new DateError(i18n.__('The end date must be later than the start date.'));
        }
        
        return result;
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
        return instance;
    },
    
    error : DateError     // The constructor for the error
};