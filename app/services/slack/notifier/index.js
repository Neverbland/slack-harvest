/*jshint node: true*/
'use strict';

var _           =   require('lodash'),
    events      =   require("events"),
    logger      =   require('./../../logger.js')('default'),
    tools       =   require('./../../tools.js');


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


function formatResponse (dayEntries, projects, clients)
{
    var 
        response = [
            "*Your time tracked today*:"
        ],
        clientsById = tools.byId(clients || {}, 'client'),
        projectsById = tools.byId(projects || {}, 'project'),
        totalTime = 0
    ;
   
    _.each(dayEntries, function (resourceObject) {
        
        var resource = resourceObject.day_entry,
            project = projectsById[resource.project_id] || null,
            client = (project && !!clientsById[project.client_id]) ? clientsById[project.client_id] : null,
            time = tools.getHours(resource),
            responsePart = [
                (client ? client.name : "Unknown client"),
                (project ? project.name : resource.project_id),
                tools.formatTime(time)
            ].join(' - ')
        ;
        
        totalTime += time;
        
        response.push(responsePart);
    });
    
    response.push('\n');
    response.push('Total: ' + tools.formatTime(totalTime));
    response.push('\n');
    
    response.push('If anything is missing, add it here <' + SlackNotifier.prototype.LINK + '>' );
    
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
     * @param       {Object}        dayEntries
     * @param       {Array}         An array of day entries
     * @returns     {undefined}
     */
    this.prepareText = function (userName, dayEntries)
    {
        var that = this,
            projectsIds = tools.getIds(dayEntries, 'day_entry', 'project_id')
        ;
        this.harvest.getProjectsByIds(projectsIds, function (err, projects) {
            if (err === null) {
                var clientsIds = tools.getIds(projects, 'project', 'client_id');
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
};

SlackNotifierPrototype.prototype = new events.EventEmitter();


SlackNotifier.prototype = new SlackNotifierPrototype();
SlackNotifier.prototype.constructor = SlackNotifier;

var instance = null;

module.exports = function (slack, harvest) {
    instance = new SlackNotifier(slack, harvest);
    module.exports.instance = instance;
    return instance;
};
