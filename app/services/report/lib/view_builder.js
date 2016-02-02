/*jshint node: true*/
'use strict';

var _       =   require('lodash'),
    tools   =   require('./../../tools.js')
;



/**
 * Formats the summary of the projects to message string
 * 
 * @param       {Object}        summary
 * @returns     {String}
 */
function formatSummary (summary)
{
    var records = [],
        totalTime = 0
    ;
    _.each(summary, function (project) {
        var responsePart,
            responsePartArray = [
                project.clientName,
                project.projectName
            ];
        if (project.note && project.note.length) {
            responsePartArray.push(project.note);
        }
        
        responsePartArray.push(tools.formatTime(project.time));
        responsePart = responsePartArray.join(' - ');
        
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
 * @returns     {Object}
 */
function projectsSummary(dayEntries, clientsById, projectsById)
{
    var summary = {};
    _.each(dayEntries, function (dayEntryObject) {
        var dayEntry = dayEntryObject.day_entry,
            projectId = dayEntry.project_id,
            project = projectsById[projectId] || null,
            client = (project && clientsById[project.client_id]) ? clientsById[project.client_id] : null,
            key = '' + projectId + (dayEntry.notes || '')
        ;
        
        if (!summary[key]) {
            summary[key] = {
                projectName : project ? project.name : dayEntry.project_id,
                clientName : client ? client.name : "Unknown client",
                time : tools.getHours(dayEntry),
                note : dayEntry.notes
            };
        } else {
            summary[key].time = summary[key].time + tools.getHours(dayEntry);
        }
    });
    
    return summary;
    
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
    
    var summary = projectsSummary(userEntriesObject.dayEntries, clientsById, projectsById),
        resultsRow
    ;

    resultsRow = {
        title : userEntriesObject.slackName,
        text : formatSummary(summary),
        mrkdwn_in : ["text", "title"],
        color: "FFA200",
        summary: summary
    };
    
    return resultsRow;
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
     * @return  {Array}     The array of attachments
     */
    prepareView : function (data)
    {
        
        var clientsById     =   data.clientsById,
            projectsById    =   data.projectsById,
            dayEntries      =   data.dayEntries,
            results         =   []
        ;
        
        _.each(dayEntries, function (dayEntriesObject) {
            results.push(userReport(dayEntriesObject, clientsById, projectsById));
        });
        
        return results;
    },
    
    
    /**
     * Formats the string view
     * 
     * @param   {Object}    data
     * @param   {String}    projectId
     * @returns {String}
     */
    prepareString : function (data, projectId)
    {
        var view = this.prepareView(data),
            results = [],
            that = this
        ;

        _.each(view, function (viewObject) {
            var timeSpent = viewObject.summary[projectId].time;

            results.push([
                that.prepareTitle(viewObject),
                viewObject.text
            ].join('\n'));
        });
        
        
        return results.join('\n');
        
    },
    
    
    /**
     * Returns the title of the report
     * 
     * @param       {Object}        data
     * @returns     {String}
     */
    prepareTitle : function (data)
    {
        return '*' + data.title + '*\n';
    }
};