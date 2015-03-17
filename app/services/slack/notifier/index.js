/*jshint node: true*/
'use strict';

var _           =   require('lodash'),
    events      =   require("events"),
    logger      =   require('./../../logger.js')('default');


/**
 * Fetches the user name
 * 
 * @param   {Object}    users               A map of harvest id -> slack id
 * @param   {Number}    harvestUserId
 * @returns {String}
 */
function getUserName (users, harvestUserId)
{
    var response;
    for (var harvestId in users) {
        if (String(harvestId) === String(harvestUserId)) {
            response = users[harvestId];
        }
    }

    return response;
}

/**
 * Sends notifications via slack
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * 
 * @param       {Object}    slack       The slack object
 * @param       {Object}    harvest     The harvest object
 * @constructor
 */
function SlackNotifier (slack, harvest)
{
    this.slack = slack;
    this.harvest = harvest;
}


/**
 * Formats the time spent on project
 * 
 * @param   {Number}        timeFloatValue      Float value of hours spent
 * @returns {String}
 */
function formatTime (timeFloatValue)
{
    return [
        (function (sec) {
            var date = new Date(sec * 1000);
            var hh = date.getUTCHours();
            var mm = date.getUTCMinutes();
            hh = (hh < 10) ? ("0" + hh) : hh;
            mm = (mm < 10) ? ("0" + mm) : mm;
            
            return hh + ":" + mm;
            
        })(timeFloatValue * 3600) // Multiply by number of seconds per hour
    ].join(' ');
}


/**
 * 
 * @param       {Array}     entries     An array of entry objects
 * 
 * @param       {String}    mainKey     The property under which the object is
 *                                      stored in single object resource. 
 *                                      Fot clients client, for day resource 
 *                                      - day_resource, etc.
 *                                      
 * @param       {String}    indexKey    The index of the id to be returned
 * 
 * @returns     {Array}                 An array of integer numbers
 */
function getIds (entries, mainKey, indexKey)
{
    var ids = [];
    _.each(entries, function (entryObject) {
        var entry = entryObject[mainKey];
        ids.push(entry[indexKey]);
    });
    
    return ids;
}


/**
 * Returns the hours time for day entry resource
 * 
 * @param       {Object}    resource    The day entry resource
 * @returns     {Number}
 */
function getHours (resource)
{
    var regularTime = resource.hours;
    var timeWithTimer = !!resource.hours_with_timer ? resource.hours_with_timer : 0;
    
    return Math.max(regularTime, timeWithTimer);
}


function formatResponse (dayEntries, projects, clients)
{
    var response = [
        "*Your time tracked today*:"
    ];


    var clientsById = (function (clients) {
        var results = {};
        _.each(clients, function (clientObject) {
            var client = clientObject.client;
            var id = client.id;
            results[id] = client;
        });
        
        return results;
    })(clients || {});

    var projectsById = (function (projects) {
        var results = {};
        _.each(projects, function (projectObject) {
            var project = projectObject.project;
            var id = project.id;
            results[id] = project;
        });
        
        return results;
    })(projects || {});
    
    
    _.each(dayEntries, function (resourceObject) {
        
        var resource = resourceObject.day_entry;
        var project = projectsById[resource.project_id] || null;
        var client = (project && !!clientsById[project.client_id]) ? clientsById[project.client_id] : null;
        var responsePart = [
            (client ? client.name : "Unknown client"),
            (project ? project.name : resource.project_id),
            formatTime(getHours(resource))
        ].join(' - ');
        
        response.push(responsePart);
    });
    
    response.push('\n');
    response.push('If anything is missing, add it here <' + SlackNotifier.prototype.LINK + '>' )
    
    return response.join("\n");
}


var SlackNotifierPrototype = function () 
{
    this.LINK = "https://neverbland.harvestapp.com/time";
    
    
    /**
     * Sends notification to slack
     * 
     * @param   {Object}        slackContext
     * @returns {undefined}
     */
    this.notify = function (slackContext)
    {
        var userName = getUserName(this.slack.users, slackContext.harvestUserId);
        this.prepareText(userName, slackContext.harvestResponse);
        
    };
    
    
    
    /**
     * prepares the text and triggers propper event when ready
     * 
     * @param       {String}        userName
     * @param       {Array}         An array of day entries
     * @returns     {undefined}
     */
    this.prepareText = function (userName, dayEntries)
    {
        var that = this;
        var projectsIds = getIds(dayEntries, 'day_entry', 'project_id');
        this.harvest.getProjectsByIds(projectsIds, function (err, projects) {
            if (err === null) {
                var clientsIds = getIds(projects, 'project', 'client_id');
                that.harvest.getClientsByIds(clientsIds, function (err, clients) {
                    if (err === null) {
                        that.emit('responseReady', {
                            userName : userName,
                            text : formatResponse(dayEntries, projects, clients)
                        });
                    } else{
                        logger.error('Failed fetching clients for given clients ids', clientsIds, {});
                    }
                });
            } else {
                logger.error('Failed fetching projects for given projects ids', projectsIds, {});
            }
        });
    };
    
    
    this.responseReadyHandler = function (data) 
    {
        var that = this;
        that.slack.sendMessage(data.text, {
            channel : '@' + data.userName
        }, function (err, httpResponse, body) {
            if (err === null) {
                logger.info('Successfully sent a reminder message to user ' + data.userName, {});
            } else {
                logger.info('Reminder for user ' + data.userName + ' not sent. Error: ', err, {});
            }
        });
    };
    
    
    // Send the message when all content populated and the text is prepared
    this.on('responseReady', this.responseReadyHandler);
}

SlackNotifierPrototype.prototype = new events.EventEmitter();


SlackNotifier.prototype = new SlackNotifierPrototype();
SlackNotifier.prototype.constructor = SlackNotifier;


module.exports = function (slack, harvest) {
    return new SlackNotifier(slack, harvest);
}