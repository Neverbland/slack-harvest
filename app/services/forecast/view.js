/*jshint node: true*/
'use strict';

var _           =   require('lodash'),
    tools       =   require('./../tools.js'),    
    i18n        =   require('i18n'),
    viewBuilder =   {
        
        /**
         * Aggregates assignments by user
         * 
         * @param       {Object}        assignments
         * @returns     {Object}
         */
        aggregateByUser : function (assignments)
        {
            var results = {};
            _.each(assignments, function (assignment) {
                var person = assignment.person,
                    harvestUserId = person ? person.harvest_user_id : null
                ;

                if (harvestUserId) {
                    results[harvestUserId] = results[harvestUserId] || {
                        person : person,
                        assignments : []
                    };

                    results[harvestUserId].assignments.push(assignment);            
                }
            });

            return results;
        }, 
        
        format : function (title, text)
        {
            return "\n" + [title, text].join("\n") + "\n";
        },
        
        /**
         * 
         * @param   {Object}     userAssignments
         * @returns {undefined}
         */
        prepareTitle : function (userAssignments)
        {

            var name = userAssignments.person.first_name + ' ' + userAssignments.person.last_name;
            return '*' + i18n.__('Projects assignments schedule for {{name}}:', {
                name : name
            }) + '*';

        },
    
    
        /**
         * prepares the text and triggers propper event when ready
         * 
         * @param       {Object}        userAssignments
         * @returns     {undefined}
         */
        prepareText : function (userAssignments)
        {
            var results = [];

            _.each(userAssignments.assignments, function (assignment) {
                var text = [],
                    project = assignment.project,
                    client = project ? assignment.project.client : null,
                    timeSeconds = assignment.allocation,
                    timeText = tools.formatSeconds(Number(timeSeconds))
                ;

                text.push(timeText);
                if (client) {
                    text.push(client.name);
                }
                if (project) {
                    text.push(project.name);
                }

                if (!project && !client) {
                    text.push(i18n.__('N/A'));
                }

                results.push(text.join(' - '));
            });

            return results.join("\n");
        }
    }
;



module.exports = viewBuilder;