/*jshint node: true*/
'use strict';

var _ = require('lodash');
require('date-util');

if (typeof Object.size === 'undefined') {
    Object.size = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };
}

module.exports = {
    
    /**
     * Formats number of seconds into time string
     * 
     * @param       {Number}     totalSec
     * @returns     {String}
     */
    formatSeconds : function (totalSec) {
        var hours = parseInt( totalSec / 3600 ),
            minutes = parseInt( totalSec / 60 ) % 60,
            result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes)
        ;

        return result;
    },
    
    /**
     * Formats the time spent on project
     * 
     * @param   {Number}        timeFloatValue      Float value of hours spent
     * @returns {String}
     */
    formatTime: function (timeFloatValue)
    {
        return [
            this.formatSeconds(timeFloatValue * 3600) // Multiply by number of seconds per hour
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
            var entry = entryObject[mainKey],
                id = entry[indexKey];
                if (_.indexOf(ids, id) === -1) {
                    ids.push(id);
                } 
        });
        
        return _.sortBy(ids);
    },
    
    
    
    /**
     * Orders given input collection array by object id simplifying it's 
     * structure by removing the leading mainKey
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
        var date = new Date().strtotime(timeString),
            intValue
        ;
        if (date instanceof Date) {
            return date;
        }
        intValue = parseInt(date);
        if (!isNaN(intValue)) {
            return new Date(date);
        } else {
            return date;
        }
    },
    
    
    /**
     * Validates if the param exists within the object and returns 
     * the value. If it doesn't exist, throws an error.
     * 
     * @param       {Object}        obj
     * @param       {String}        param
     * @param       {String}        errorMessage
     * @returns     {Object}
     * @throws      {Error}         If param does not exist within the object
     */
    validateGet : function (obj, param, errorMessage)
    {
        if (typeof obj[param] === 'undefined') {
            errorMessage = errorMessage || 'Param ' + param + ' does not exist.';
            throw new Error(errorMessage);
        }
        
        return obj[param];
    },


    /**
     * Validates if correct user has been sent
     * 
     * @param       {Object}    users       A map of harvest id -> slack name of all
     *                                      configured users
     * @param       {String}    userId      Either harvest id or slack name
     * @returns     {Object}                A hashmap of harvestId -> slackName
     * @throws      {Error}                 If invalid user provided
     */
    validateGetUser : function (users, userId)
    {
        var userMap = {},
            found = false
        ;
        
        _.each(users, function (slackName, harvestId) {
            if ((String(harvestId) === String(userId)) || (String(slackName) === String(userId))) {
                userMap[harvestId] = slackName;
                found = true;
            }
        });

        if (!found) {
            throw new Error('Invalid user provided.');
        } else {
            return userMap;
        }
    }
    
};