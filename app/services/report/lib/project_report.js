/*jshint node: true*/
'use strict';

var _               =   require('lodash'),
    Q               =   require('q'),
    tools           =   require('./../../tools.js'),
    harvest         =   require('./../../harvest')('default'),
    logger          =   require('./../../logger.js')('default'),
    viewBuilder     =   require('./view_builder.js'),
    i18n            =   require('i18n'),
    report
;


function filterByProjectId (dayEntries, projectId)
{
    var results = {};
    _.each(dayEntries, function (entries) {
        
        _.each(entries.dayEntries, function (entry) {
            var projId = entry.day_entry.project_id;

            if (Number(projId) === Number(projectId)) {
                results[entries.slackName] = results[entries.slackName] || {
                    slackName : entries.slackName,
                    harvestId : entries.harvestId,
                    error : false,
                    dayEntries : []
                };
                results[entries.slackName].dayEntries.push(entry);
            }
        });
    });
    
    return (function (results) {
        var returnResults = [];
        _.each(results, function (entry, slackName) {
            returnResults.push(entry);
        });
        
        return returnResults;
    })(results);
}


report = {
    
    /**
     * Provides reports for given project
     * 
     * @param   {Number}    projectId
     * @param   {String}    fromDate
     * @param   {String}    toDate
     * @param   {Number}    projectId
     * @param   {Function}  callback        Recieves error and report string arguments
     * @returns {undefined}
     */
    getReport : function (projectId, fromDate, toDate, callback)
    {
        var users = harvest.users,
            promises = []
        ;

        _.each(users, function (slackName, harvestId) {
            var def = Q.defer();
            harvest.getUserTimeTrack(harvestId, fromDate, toDate, function (err, dayEntries) {
                
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
        
        Q.all(promises).then(function (dayEntries) {

            var projectsIds = [projectId],
                viewData,
                view
            ;
            
            dayEntries = filterByProjectId(dayEntries, projectId);
            
            harvest.getProjectsByIds(projectsIds, function (err, projects) {
                if (err === null) {
                    var clientsIds = tools.getIds(projects, 'project', 'client_id');
                    
                    harvest.getClientsByIds(clientsIds, function (err, clients) {
                        if (err !== null) {
                            logger.error(i18n.__('Failed fetching clients for given clients ids'), clientsIds, {});
                            callback(err, null);
                        } else{

                            viewData = {
                                dayEntries : dayEntries,
                                clientsById : tools.byId(clients, 'client'),
                                projectsById : tools.byId(projects, 'project'),
                            };
                            view = viewBuilder.prepareString(viewData, projectId);
            
                            callback(null, view);
                        }
                    });
                } else {
                    logger.error(i18n.__('Failed fetching projects for given projects ids'), projectsIds, {});
                }
            });
        });        
    }
};


module.exports = report;