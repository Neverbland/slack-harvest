/*jshint node: true*/
'use strict';

var 
    reportProvider,
    interactiveSession  = require('./../user_session.js'),
    tools               = require('./../../../tools.js'),
    _                   = require('lodash'),
    timerTools          = require('./../../../timer'),
    harvest             = require('./../../../harvest')('default'),
    errOutput           = 'Wrong input provided, try following the instructions...',
    logger              = require('./../../../logger.js')('default'),
    commandName         = require('./../../../../../config/index.js').api.controllers.timer.command,
    StepProvider        = require('./../step_provider.js')
;


/**
 * Adds client's names to projects
 * 
 * @param           {Array}     projects
 * @param           {Array}     clients
 * @returns         {Array}
 */
function mergeWithClients (projects, clients)
{
    _.each(projects, function (project) {
        var clientId = Number(project['client_id']);
        _.each(clients, function (client) {
            if (Number(client['id']) === clientId) {
                project['client'] = client.name;
            }
        });
    });
    
    return projects;
}


reportProvider = new StepProvider('report');
reportProvider.addStep(1, {
    getView: function (step)
    {
        if (step === null) {
            return 'No projects matching given string found!';
        }
        var view = [
            'Choose the awesome project you are working on today!',
            ''
        ];

        _.each(step.getOptions(), function (option, value) {
            if (option.type === 'project') {
                view.push(value + '. ' + option.name);
            }
        });

        view.push('');
        view.push('Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' to quit the report setup');


        return view.join('\n');
    },

    execute : function (params, callback)
    {
        var that = this,
            action = tools.validateGet(params, 'action'),
            clientsIds,
            step
        ;
        harvest.getProjects(function (err, projects) {

            if (err !== null) {
                callback(err, null);
                return;
            } else {
                if (!projects.length) {
                    callback(that.getView(null), null);
                    return;
                }
                
                clientsIds = tools.getIds(projects, 'project', 'client_id');
                harvest.getClientsByIds(clientsIds, function (err, clients) {
                    if (err !== null) {
                        callback(err, null);
                        return;
                    } else {
                        projects = mergeWithClients(projects, clients);
                        projects = timerTools.findMatchingClientsOrProjects(params.name, projects);
                        
                        options = (function (entries) {

                            var options = {};
                            options['no'] = {
                                name: 'Quit',
                                id: null,
                                type: 'system'
                            };

                            _.each(entries, function (entry, index) {

                                options['' + (index + 1) + ''] = {
                                    name: entry.client + ' - ' + entry.project,
                                    id: entry.projectId,
                                    type: 'project'
                                };
                            });

                            return options;
                        })(projects);

                        step = interactiveSession
                                    .getDefault()
                                    .createStep(params.userId, options, action)
                        ;

                        step.addParam('projects', projects);

                        callback(null, step);
                    }
                });
            }
        });
    },


    postExecute : function (step, callback) 
    {
        callback();
    },

    prepareStep: function (step)
    {
        return step;
    }
});


module.exports = reportProvider;