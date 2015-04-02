/*jshint node: true*/
'use strict';

var _ = require('lodash');

module.exports = {
    
    
    /**
     * Takes the timer command text and changes it tnto a bunch of parameters
     * for the projects
     * 
     * @param   {String}        postText
     * @returns {Object}        An object containing all required data
     *                          to start/stop a timer
     * @throws  {Error}         If not all parts of the command are provided
     */
    parseTimerConfig : (function () {
        var validActions = [
            'start',
            'stop',
            'toggle'
        ];
        
        var validateAction  = function (action) 
        {
            if (validActions.indexOf(action) === -1) {
                throw new Error('Invalid action ' + action + ' provided!');
            }
            
            return action;
        };
        
        var clear = function (inputArray) 
        {
            var results = [];
            _.each(inputArray, function (value) {
                var clean = value.trim();
                if (clean.length) {
                    results.push(clean);
                }
            });
            
            return results;
        };
        
        return function (postText)
        {
            var config = {},
                parts = postText.split(' '),
                partsBase = postText.split(' '),
                cleanParts = clear(parts);
            
            if (cleanParts.length < 1) {
                throw new Error("Invalid number of paramerers provided! Required at least one parameter!");
            }
            try {
                config.action = validateAction(parts.shift());
                config.name = clear(parts).join(' ');
            } catch (err) {
                config.action = null;
                config.value = clear(partsBase).join(' ');
            }
            
            return config;
        };
    })(),
    
    
    /**
     * Finds clients/projects entries matching name
     * 
     * @param   {String}    name
     * @param   {Array}     dailyEntries
     * @returns {Array}
     */
    findMatchingClientsOrProjects : (function () {
        
        /**
         * Finds if project name or client name for given entry match the 
         * given name
         * 
         * @param   {String}    name
         * @param   {Object}    entry
         * @returns {Boolean}
         */
        function entryMatches (name, entry)
        {
            var regexp = new RegExp(name, 'ig');
            return (regexp.test(entry.project) || regexp.test(entry.client));
        }
        
        return function (name, dailyEntries)
        {
            var matching = [];
            _.each(dailyEntries, function (entry) {
                if (entryMatches(name, entry)) {
                    matching.push({
                        client : entry.client,
                        project : entry.name,
                        clientId : entry.client_id,
                        projectId : entry.id
                    });
                }
            });

            return matching;
        }
        
    })()
};