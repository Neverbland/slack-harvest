/*jshint node: true*/
'use strict';

var _ = require('lodash'),
        timer
;


/**
 * Finds if project name or client name for given entry match the 
 * given name
 * 
 * @param   {String}    name
 * @param   {Object}    entry
 * @param   {Array}     fields  An array of strings containing field names to check
 * @returns {Boolean}
 */
function entryPropertiesMatches (name, entry, fields)
{
    var lowerName = String(name).toLowerCase(),
        regexp = new RegExp(lowerName, 'ig'),
        anyMatching = false
    ;
    _.each(fields, function (field) {
        var value = entry[field];
        if (regexp.test(String(value).toLowerCase())) {
            anyMatching = true;
        }
    });
    return anyMatching;
}


timer = {

    validActions : [],

    /**
     * Sets valid actions
     * 
     * @param   {Array}     Array of strings
     * @return  {timer}     This instance
     */
    setAvailableActions : function (actions)
    {
        this.validActions = actions;
        return this;
    },
    
    /**
     * Adds the action
     * 
     * @param   {String}    action
     * @returns {timer}
     */
    addAvailableAction : function (action)
    {
        this.validActions.push(action);
        return this;
    },


    validateAction : function (action) 
    {
        if (this.validActions.indexOf(action) === -1) {
            throw new Error('Invalid action ' + action + ' provided!');
        }

        return action;
    },


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
                config.action = this.validateAction(parts.shift());
                config.name = clear(parts).join(' ');
            } catch (err) {
                config.action = null;
                config.value = clear(partsBase).join(' ');
            }

            return config;
        };
    })(),

    /**
     * Finds day entries which project/client/task matches name
     * 
     * @param   {String}    name
     * @param   {Array}     dailyEntries
     * @returns {Array}
     */
    findMatchingEntries : function (name, dailyEntries) 
    {
        var matching = [];
        _.each(dailyEntries, function (entry) {
            if (entryPropertiesMatches(name, entry, ['client', 'project', 'task'])) {
                matching.push(entry);
            }
        });

        return matching;
    },


    /**
     * Finds projects entries matching name
     * 
     * @param   {String}    name
     * @param   {Array}     dailyEntries
     * @returns {Array}
     */
    findMatchingClientsOrProjects : function (name, projects)
    {
        var matching = [];
        _.each(projects, function (project) {
            if (entryPropertiesMatches(name, project, ['client', 'name'])) {
                matching.push({
                    client : project.client,
                    project : project.name,
                    clientId : project.client_id,
                    projectId : project.id
                });
            }
        });

        return matching;
    },


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

module.exports = timer;