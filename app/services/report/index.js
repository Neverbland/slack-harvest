/*jshint node: true*/
'use strict';

var Q           =   require('q'),
    events      =   require('events'),
    logger      =   require('./../logger.js')('default'),
    _           =   require('lodash'),
    tools       =   require('./../tools.js'),
    viewBuilder =   require('./lib/view_builder.js'),
    i18n        =   require('i18n')
;
  

/**
 * Reports provides a way to generate a full report of activity for users and send
 * it on given channel on Slack
 * 
 * @param       {Object}    slack           The slack object
 * @param       {Object}    harvest         The harvest object
 * @param       {Object}    viewBuilder     Provides the report string
 * @constructor
 * @returns {undefined}
 */
function Report (slack, harvest, viewBuilder) 
{
    this.slack = slack;
    this.harvest = harvest;
    this.viewBuilder = viewBuilder;
}


/**
 * Provides ids from combined collection of day entries
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
function getIdsFromCombined (entries, mainKey, indexKey)
{
    var ids = [];
    _.each(entries, function (userObject) {
        if (!userObject.error) {
            _.each(userObject.dayEntries, function (entryObject) {
                var entry = entryObject[mainKey];
                ids.push(entry[indexKey]);
            });
        }
    });
    
    return ids;
}


/**
 * Sorts the day entries by user id
 * 
 * @param       {Array}     dayEntries
 * @param       {Object}    harvest     The harvest object
 * @returns     {Array}                 An array of objects containing the dayEntries,
 *                                      slackName and harvestId
 */
function byUserSlackName (dayEntries, harvest)
{
    var results = [],
        byUser = {}
    ;
    _.each(dayEntries, function (entryObject) {
        var entry = entryObject.day_entry,
            userId = entry.user_id
        ;
        
        byUser[userId] = byUser[userId] || [];
        byUser[userId].push(entryObject);
    });
    
    _.each(byUser, function (entryObjects, harvestId) {
        var slackName = harvest.users[harvestId];
        if (slackName) {
            results.push({
                harvestId : harvestId,
                dayEntries : entryObjects,
                slackName : slackName,
                error : false
            });
        }
    });
    
    
    return results;
}



function ReportPrototype () 
{
    this.notify = function (slackContext) 
    {
        var users = slackContext.users || this.harvest.users,
            projectId = slackContext.projectId,
            promises = [],
            that = this
        ;

        if (!projectId) {
            _.each(users, function (slackName, harvestId) {
                var def = Q.defer();
                that.harvest.getUserTimeTrack(harvestId, slackContext.fromDate, slackContext.toDate, function (err, dayEntries) {
                    if (err !== null) {
                        logger.error(i18n.__("Failed fetching user timeline from Harvest API for user %s", harvestId), err, {});
                        def.resolve({
                            dayEntries : dayEntries,
                            slackName : slackName,
                            harvestId : harvestId,
                            error : err
                        });
                    } else {
                        def.resolve({
                            dayEntries : dayEntries,
                            slackName : slackName,
                            harvestId : harvestId,
                            error : false
                        });
                    }
                });
                promises.push(def.promise);
            });
        } else {
            var def = Q.defer();
            that.harvest.getProjectTimeTrack(projectId, slackContext.fromDate, slackContext.toDate, function (err, dayEntries) {
                if (err !== null) {
                    logger.error(i18n.__("Failed fetching user timeline from Harvest API for project %s", projectId), err, {});
                    def.resolve({
                        dayEntries : dayEntries,
                        error : err
                    });
                } else {
                    def.resolve(byUserSlackName(dayEntries, that.harvest));
                }
            });
            promises.push(def.promise);
        }
   
        Q.all(promises).then(function (dayEntries) {
            dayEntries = !projectId ? dayEntries : dayEntries[0];
            var projectsIds = getIdsFromCombined(dayEntries, 'day_entry', 'project_id'),
                clientsIds
            ;

            that.harvest.getProjectsByIds(projectsIds, function (err, projects) {
                if (err === null) {
                    clientsIds = tools.getIds(projects, 'project', 'client_id');
                    that.harvest.getClientsByIds(clientsIds, function (err, clients) {
                        if (err === null) {
                            that.emit('responseReady', {
                                dayEntries : dayEntries,
                                clientsById : tools.byId(clients, 'client'),
                                projectsById : tools.byId(projects, 'project'),
                                users : users,
                                channel : slackContext.channel,
                                title : slackContext.reportTitle
                            });
                        } else{
                            logger.error(i18n.__('Failed fetching clients for given clients ids'), clientsIds, {});
                        }
                    });
                } else {
                    logger.error(i18n.__('Failed fetching projects for given projects ids'), projectsIds, {});
                }
            });
        });
    };
    
    
    this.responseReadyHandler = function (data) 
    {
        var attachments = this.viewBuilder.prepareView(data),
            title = this.viewBuilder.prepareTitle(data);
    
        this.slack.sendMessage(title, {
            channel : data.channel,
            attachments : attachments
        }, function (err, httpResponse, body) {
            if (err === null) {
                logger.info(i18n.__('Successfully sent a report message to channel %s', data.channel), {});
            } else {
                logger.info(i18n.__('Report for channel %s not sent.', data.channel), err, {});
            }
        });
    };
    
    
    // Send the message when all content populated and the text is prepared
    this.on('responseReady', this.responseReadyHandler);
}


ReportPrototype.prototype = new events.EventEmitter();
Report.prototype = new ReportPrototype();


module.exports = function (slack, harvest, builder) {
    return new Report(slack, harvest, (builder || viewBuilder));
};
