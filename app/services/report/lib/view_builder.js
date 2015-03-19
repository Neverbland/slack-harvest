/*jshint node: true*/
'use strict';

var _       =   require('lodash'),
    tools   =   require('./../../tools.js');



/**
 * Formats the summary of the projects to message string
 * 
 * @param       {Object}        summary
 * @returns     {String}
 */
function formatSummary (summary)
{
    var records = [];
    var totalTime = 0;
    _.each(summary, function (project) {
        var responsePart = [
            project.clientName,
            project.projectName,
            tools.formatTime(project.time)
        ].join(' - ');
        totalTime += project.time;
        records.push(responsePart);
    });

    records.push('Total: ' + tools.formatTime(totalTime));
    
    return records.join('\n');
}


/**
 * 
 * @param       {Object}        dayEntries
 * @param       {Object}        clientsById
 * @param       {Object}        projectsById
 * 
 * @returns     {String}
 */
function projectsSummary(dayEntries, clientsById, projectsById)
{
    var summary = {};
    _.each(dayEntries, function (dayEntryObject) {
        var dayEntry = dayEntryObject.day_entry,
            projectId = dayEntry.project_id,
            project = projectsById[projectId] || null,
            client = (project && clientsById[project.client_id]) ? clientsById[project.client_id] : null;
            
        if (!summary[projectId]) {
            summary[projectId] = {
                projectName : project ? project.name : dayEntry.project_id,
                clientName : client ? client.name : "Unknown client",
                time : tools.getHours(dayEntry)
            };
        } else {
            summary[projectId].time = summary[projectId].time + tools.getHours(dayEntry);
        }
    });
    
    return formatSummary(summary);
    
}


/**
 * Provides a full report message for given user
 * (message part of overall report)
 * 
 * @param       {Object}        userEntriesObject
 * @param       {Object}        clientsById
 * @param       {Object}        projectsById
 * 
 * @returns     {String}
 */
function userReport (userEntriesObject, clientsById, projectsById)
{
    var resultsRow = [
        '*' + userEntriesObject.slackName + '*',
        projectsSummary(userEntriesObject.dayEntries, clientsById, projectsById)
    ];
    
    return resultsRow.join('\n') + '\n';
}

/**
 * Builds the view for report messages that will be sent to slack management
 * channels
 * 
 * @author Maciej Garycki <maciej@neverbland.com>
 */
module.exports = {
    
    /**
     * Returns a complete message for given data
     * 
     * @param   {Object}    data
     * @return  {String}    the view for slack
     */
    prepareView : function (data)
    {
        
        var clientsById     =   data.clientsById,
            projectsById    =   data.projectsById,
            dayEntries      =   data.dayEntries,
            results         =   [
                data.title + '\n'
            ]
        ;
    
        _.each(dayEntries, function (dayEntriesObject) {
            results.push(userReport(dayEntriesObject, clientsById, projectsById));
        });
        
        return results.join('\n');
    }
};