/*jshint node: true*/
'use strict';

var Q       =   require('q'),
    events  =   require('events'),
    logger  =   require('./../logger.js')('default'),
    _       =   require('lodash'),
    tools   =   require('./../tools.js');
        


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
function Report (slack, harvest) 
{
    this.slack = slack;
    this.harvest = harvest;
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
        var users = slackContext.users;
   
        var promises = [];
        var that = this;
        _.each(users, function (slackName, harvestId) {
            var def = Q.defer();
            that.harvest.getUserTimeTrack(harvestId, function (err, dayEntries) {
                if (err !== null) {
                    logger.error("Failed fetching user timeline from Harvest API for user " + harvestId, err, {});
                    def.resolve({
                        dayEntries : dayEntries,
                        slackName : slackName,
                        error : err
                    });
                } else {
                    def.resolve({
                        dayEntries : dayEntries,
                        slackName : slackName,
                        error : false
                    });
                }
            });
            promises.push(def.promise);
        });
        
        Q.all(promises).then(function (dayEntries) {
            var projectsIds = getIds(dayEntries, 'day_entry', 'project_id');
            that.harvest.getProjectsByIds(projectsIds, function (err, projects) {
                if (err === null) {
                    var clientsIds = tools.getIds(projects, 'project', 'client_id');
                    that.harvest.getClientsByIds(clientsIds, function (err, clients) {
                        if (err === null) {
                            that.emit('responseReady', {
                                data : dayEntries,
                                clientsById : tools.byId(clients),
                                projectsById : tools.byId(projects)
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
        var that = this;
    };
    
    
    // Send the message when all content populated and the text is prepared
    this.on('responseReady', this.responseReadyHandler);
};


ReportPrototype.prototype = new events.EventEmitter();
Report.prototype = new ReportPrototype();


module.exports = function (slack, harvest) {
    return new Report(slack, harvest);
}
