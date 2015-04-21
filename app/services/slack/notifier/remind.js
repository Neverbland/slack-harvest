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
function SlackReminder (slack, harvest)
{
    this.slack = slack;
    this.harvest = harvest;
}

function SlackReminderPrototype () 
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
        this.prepareText(userName);
        
    };
    
    
    
    /**
     * prepares the text and triggers propper event when ready
     * 
     * @param       {String}        userName
     * @returns     {undefined}
     */
    this.prepareText = function (userName)
    {
        var view = [
                'You have no tasks running on *Harvest*!',
                'Click here <' + SlackReminder.prototype.LINK + '> to add them or use the timer command on Slack'
            ].join('\n')
        ;
        this.slack.sendMessage(view, {
            channel : '@' + userName
        }, function (err, httpResponse, body) {
            if (err === null) {
                logger.info('Successfully sent a reminder message to user ' + userName, {});
            } else {
                logger.info('Reminder for user ' + userName + ' not sent. Error: ', err, {});
            }
        });
    };
};

SlackReminderPrototype.prototype = new events.EventEmitter();


SlackReminder.prototype = new SlackReminderPrototype();
SlackReminder.prototype.constructor = SlackReminder;

var instance = null;

module.exports = function (slack, harvest) {
    instance = new SlackReminder(slack, harvest);
    module.exports.instance = instance;
    return instance;
};
