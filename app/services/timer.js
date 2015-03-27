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
                cleanParts = clear(parts);
            
            if (cleanParts.length < 3) {
                throw new Error("Invalid number of paramerers provided! Required: `action`, `client name`, `project name` respectively.");
            }
            config.action = validateAction(parts.shift());
            config.projectData = clear(parts);
            
            return config;
        };
    })(),
    
    
    _find : function (name, key, entries)
    {
        var matching = [];
        for (var i in entries) {
            var entry = entries[i];
            if (String(entry[key]).trim() === String(name).trim()) {
                matching.push(entry);
            }
        }
        
        return matching;
    },
    
    
    /**
     * 
     * @param       {Array}         The proejcts 
     * @param       {Object}        dailyEntries
     * @returns     {Object}        Returns an object containing "task" and "project" keys
     *                              or at least the one the function was able to find
     */
    findProject : function (projectCommandParts, dailyEntries)
    {
        var clientName = '',
            projectName = '',
            clients = null,
            projects = null,
            parts = projectCommandParts.slice(0)
        ;

        
        for (var i = 0; i < projectCommandParts.length; i++) {
            clientName = parts.join(' ');
            var values = this._find(clientName, 'client', dailyEntries);
            if (values.length) {
                clients = values;
                break;
            }
            parts.pop();
        }
        
        if (clients) {
            parts = projectCommandParts.join(' ').replace(clientName + ' ', '').split(' ');
            for (var j = 0; j < projectCommandParts.length; j++) {
                projectName = parts.join(' ');
                var values = this._find(projectName, 'name', clients);
                if (values.length) {
                    projects = values;
                    break;
                }
                parts.pop();
            }
        }
        
        return projects ? {project : projects[0].id, client : projects[0].client_id} : (clients ? {client : clients[0].client_id} : {});
    }
};