/*jshint node: true*/
'use strict';

var Q           =   require('q'),
    events      =   require('events'),
    logger      =   require('./../logger.js')('default'),
    _           =   require('lodash'),
    tools       =   require('./../tools.js'),
    viewBuilder =   require('./lib/view_builder.js');
        


function validate (config, field)
{
    if (!!config.field) {
        throw new Error('The field ' + field + ' is not present in the config!');
    }
    
    return config[field];
}


/**
 * Reports provides a way to generate a full report of activity for users and send
 * it on given channel on Slack
 * 
 * @param       {Object}    slack       The slack object
 * @param       {Object}    harvest     The harvest object
 * @constructor
 * @returns {undefined}
 */
function Report (slack, harvest, viewBuilder) 
{
    this.slack = slack;
    this.harvest = harvest;
    this.viewBuilder = viewBuilder
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


function ReportPrototype () 
{
    this.notify = function (slackContext) 
    {
        var users = slackContext.users || this.harvest.users;
   
        var promises = [];
        var that = this;
        _.each(users, function (slackName, harvestId) {
            var def = Q.defer();
            that.harvest.getUserTimeTrack(harvestId, slackContext.fromDate, slackContext.toDate, function (err, dayEntries) {
                if (err !== null) {
                    logger.error("Failed fetching user timeline from Harvest API for user " + harvestId, err, {});
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
        
        Q.all(promises).then(function (dayEntries) {
            var projectsIds = getIdsFromCombined(dayEntries, 'day_entry', 'project_id');
            that.harvest.getProjectsByIds(projectsIds, function (err, projects) {
                if (err === null) {
                    var clientsIds = tools.getIds(projects, 'project', 'client_id');
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
                            logger.error('Failed fetching clients for given clients ids', clientsIds, {});
                        }
                    });
                } else {
                    logger.error('Failed fetching projects for given projects ids', projectsIds, {});
                }
            });
        });
    };
    
    
    this.responseReadyHandler = function (data) 
    {
        var view = this.viewBuilder.prepareView(data);
        that.slack.sendMessage(view, {
            channel : data.channel
        }, function (err, httpResponse, body) {
            if (err === null) {
                logger.info('Successfully sent a report message to channel ' + data.channel, {});
            } else {
                logger.info('Report for channel ' + data.channel + ' not sent. Error: ', err, {});
            }
        });
    };
    
    
    // Send the message when all content populated and the text is prepared
    this.on('responseReady', this.responseReadyHandler);
};


ReportPrototype.prototype = new events.EventEmitter();
Report.prototype = new ReportPrototype();


module.exports = function (slack, harvest) {
    return new Report(slack, harvest, viewBuilder);
}
