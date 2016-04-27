/*jshint node: true*/
'use strict';

var _           =   require('lodash'),
    events      =   require("events"),
    logger      =   require('./../../logger.js')('default'),
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
 * Sends notifications via slack
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * 
 * @param       {Object}    slack       The slack object
 * @param       {Object}    harvest     The harvest object
 * @param       {Object}    viewBuilder Forecast slack message view builder
 * @constructor
 */
function SlackNotifier (slack, harvest, viewBuilder)
{
    this.slack = slack;
    this.harvest = harvest;
    this.viewBuilder = viewBuilder;
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
            assignmentsByUser = that.viewBuilder.aggregateByUser(assignments)
        ;
        _.each(assignmentsByUser, function (userAssignments, harvestId) {
            if (!userAssignments.assignments.length) {
                return;
            }
            
            
            var slackId = getUserName(that.slack.users, harvestId),
                view = that.viewBuilder.getView(userAssignments)
            ;
            
            if (!slackId) {
                return;
            }
            
            that.slack.sendMessage(view, {
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
};

SlackNotifierPrototype.prototype = new events.EventEmitter();


SlackNotifier.prototype = new SlackNotifierPrototype();
SlackNotifier.prototype.constructor = SlackNotifier;

module.exports = function (slack, harvest, viewBuilder) {
    instance = new SlackNotifier(slack, harvest, viewBuilder);
    module.exports.instance = instance;
    
    return instance;
};
