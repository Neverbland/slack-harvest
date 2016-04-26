/*jshint node: true*/
'use strict';

var _           =   require('lodash'),
    events      =   require("events"),
    logger      =   require('./../../logger.js')('default'),
    tools       =   require('./../../tools.js'),
    i18n        =   require('i18n'),
    instance    =   null
;


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
 * Aggregates assignments by user
 * 
 * @param       {Object}        assignments
 * @returns     {Object}
 */
function aggregateByUser (assignments)
{
    var results = {};
    _.each(assignments, function (assignment) {
        var person = assignment.person,
            harvestUserId = person ? person.harvest_user_id : null,
            project = assignment.project
        ;
        
        if (harvestUserId) {
            results[harvestUserId] = results[harvestUserId] || {
                person : person,
                projects : []
            };
            
            results[harvestUserId].projects.push(project);            
        }
    });
    
    return results;
}


function format (title, text)
{
    return [title, text].join("\n");
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


var SlackNotifierPrototype = function () 
{
   
    /**
     * Sends notification to slack
     * 
     * @param   {Object}        slackContext
     * @returns {undefined}
     */
    this.notify = function (slackContext)
    {
        var that = this,
            assignments = slackContext.assignments,
            assignmentsByUser = aggregateByUser(assignments)
        ;
        _.each(assignmentsByUser, function (userAssignments, harvestId) {
            if (!userAssignments.assignments.length) {
                return;
            }
            var text = that.prepareText(userAssignments),
                title = that.prepareTitle(userAssignments),
                slackId = getUserName(that.slack.users, harvestId),
                fullText = format(title, text)
            ;
            
            if (!slackId) {
                return;
            }
            
            that.slack.sendMessage(fullText, {
                channel : '@' + slackId
            }, function (err, httpResponse, body) {
                if (err === null) {
                    logger.info(i18n.__('Successfully sent a forecast schedule message to user %s', slackId), {});
                } else {
                    logger.info(i18n.__('Forecast schedule message for user %s not sent.', slackId), err, {});
                }
            });
        });
    };
    
    
    
    /**
     * 
     * @param   {Object}     userAssignments
     * @returns {undefined}
     */
    this.prepareTitle = function (userAssignments)
    {
        
        var name = userAssignments.person.first_name + ' ' + userAssignments.person.last_name;
        return i18n.__('Projects assignments schedule for {{name}}:', {
            name : name
        });

    }
    
    
    /**
     * prepares the text and triggers propper event when ready
     * 
     * @param       {Array}        userAssignments
     * @returns     {undefined}
     */
    this.prepareText = function (userAssignments)
    {
        var results = [];
        _.each(userAssignments, function (assignment) {
            var text = [],
                project = assignment.project,
                client = project ? assignment.project.client : null,
                timeSeconds = assignment.project.allocation,
                timeText = tools.formatTime(timeSeconds)
            ;

            text.push(timeSeconds);
            if (client) {
                text.push(client.name);
            }
            if (project) {
                text.push(project.name);
            }
            
            if (!project && !client) {
                text.push(i18n.__('N/A'));
            }
            
            text.push(timeText);
            
            results.push(text.join(' - '));
        });
        
        return results.join("\n");
    };
};

SlackNotifierPrototype.prototype = new events.EventEmitter();


SlackNotifier.prototype = new SlackNotifierPrototype();
SlackNotifier.prototype.constructor = SlackNotifier;

module.exports = function (slack, harvest) {
    instance = new SlackNotifier(slack, harvest);
    module.exports.instance = instance;
    
    return instance;
};
