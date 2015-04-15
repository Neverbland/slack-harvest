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
            'status',
            'projects'
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
            var lowerName = String(name).toLowerCase();
            var regexp = new RegExp(lowerName, 'ig');
            return (regexp.test(String(entry.name).toLowerCase()) || regexp.test(String(entry.client).toLowerCase()));
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
        };
    })(),
    
    
    /**
     * Returns tasks for matching project id or an empty object
     * if no project matches the project id.
     * 
     * @param       {Number}    projectId
     * @param       {Object}    projects
     * @returns     {Object}
     */
    getProjectTasks : function (projectId, projects)
    {
        var tasks = null;
        _.each(projects, function (project) {
            if (parseInt(project.id) === parseInt(projectId)) {
                tasks = project.tasks;
            }
        });
        
        return tasks ? tasks : {};
    },
    
    
    /**
     * Provides daily entry id for given task id from given day entries
     * 
     * @param       {Number}        taskId
     * @param       {Number}        projectId
     * @param       {Array}         dailyEntries
     * @returns     {Object|null}
     */
    getDailyEntry : function (taskId, projectId, dailyEntries) 
    {
        var entry = null;
        _.each(dailyEntries, function (dailyEntry) {
            if (parseInt(dailyEntry.task_id) === parseInt(taskId) && parseInt(dailyEntry.project_id) === parseInt(projectId)) {
                entry = dailyEntry;
            }
        });
        
        return entry;
    },
    
    
    /**
     * Checks if given taskId is in the currently running daily entries
     * 
     * @param       {Number}    taskId
     * @param       {Number}    projectId
     * @param       {Array}     dailyEntries
     * @returns     {Boolean}
     */
    isRunningTask : function (taskId, projectId, dailyEntries)
    {
        var isRunning = false;
        _.each(dailyEntries, function (dailyEntry) {
            if ((parseInt(dailyEntry.task_id) === parseInt(taskId)) && (parseInt(projectId) === parseInt(dailyEntry.project_id)) && !!dailyEntry.timer_started_at) {
                isRunning = true;
            }
        });
        
        return isRunning;
    },
    
    
    /**
     * Finds current entry
     * 
     * @param   {Array}         dailyEntries
     * @returns {Object|null}
     */
    filterCurrentEntry : function (dailyEntries)
    {
        var entry = null;
        _.each(dailyEntries, function (dailyEntry) {
            if (!!dailyEntry.timer_started_at) {
                entry = dailyEntry;
            }
        });
        
        return entry;
    }
};