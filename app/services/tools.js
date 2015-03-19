/*jshint node: true*/
'use strict';

var _ = require('lodash');
require('date-util');

module.exports = {
    
    /**
     * Formats the time spent on project
     * 
     * @param   {Number}        timeFloatValue      Float value of hours spent
     * @returns {String}
     */
    formatTime: function (timeFloatValue)
    {
        return [
            (function (totalSec) {
                var hours = parseInt( totalSec / 3600 );
                var minutes = parseInt( totalSec / 60 ) % 60;
                var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes);
                
                return result;
            })(timeFloatValue * 3600) // Multiply by number of seconds per hour
        ].join(' ');
    },
    
    
    /**
     * 
     * @param       {Array}     entries     An array of entry objects
     * 
     * @param       {String}    mainKey     The property under which the object is
     *                                      stored in single object resource. 
     *                                      For clients client, for day resource 
     *                                      - day_resource, etc.
     *                                      
     * @param       {String}    indexKey    The index of the id to be returned
     * 
     * @returns     {Array}                 An array of integer numbers
     */
    getIds: function (entries, mainKey, indexKey)
    {
        var ids = [];
        _.each(entries, function (entryObject) {
            var entry = entryObject[mainKey];
            ids.push(entry[indexKey]);
        });
        return ids;
    },
    
    
    
    /**
     * 
     * @param       {Array}     entries         An array of entry objects
     * @param       {String}    mainKey         The property under which the object is
     *                                          stored in single object resource. 
     *                                          For clients client, for day resource 
     *                                          - day_resource, etc.
     *                                          
     * @returns     {Object}                    Given entries by their id property
     */
    byId : function (entries, mainKey)
    {
        var results = {};
        _.each(entries, function (entryObject) {
            var entry = entryObject[mainKey];
            var id = entry.id;
            results[id] = entry;
        });
        
        return results;
    },
    
    
    /**
     * Returns the hours time for day entry resource
     * 
     * @param       {Object}    resource    The day entry resource
     * @returns     {Number}
     */
    getHours : function (resource)
    {
        var regularTime = resource.hours;
        var timeWithTimer = !!resource.hours_with_timer ? resource.hours_with_timer : 0;

        return Math.max(regularTime, timeWithTimer);
    },
    
    
    /**
     * 
     * @param {type} timeString
     * @returns {Date}Creates date object from string
     * 
     * @param       {String}
     * @return      {Date}
     */
    dateFromString : function (timeString)
    {
        var date = new Date().strtotime(timeString);
        if (date instanceof Date) {
            return date;
        }
        if (parseInt(date) !== NaN) {
            return new Date(date);
        } else {
            return date;
        }
    }
    
};