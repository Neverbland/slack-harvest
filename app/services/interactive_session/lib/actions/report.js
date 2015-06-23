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
    StepProvider        = require('./../step_provider.js'),
    dateParser          = require('./../date_parser.js'),
    projectReport       = require('./../../../report/lib/project_report.js')
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
    var results = [];
    _.each(projects, function (project) {
        var clientId = Number(project.project.client_id);
        _.each(clients, function (client) {
            if (Number(client.client.id) === clientId) {
                project.project.client = client.client.name;
                results.push(project.project);
            }
        });
    });
    
    return results;
}


reportProvider = new StepProvider('report');
reportProvider.addStep(1, {
    getView: function (step)
    {

        if (step === null) {
            return 'No projects matching given string found!';
        }
        var view = [
            'Choose the project for the report',
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
            step,
            options
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

                            var options = {
                                no : {
                                    name: 'Quit',
                                    id: null,
                                    type: 'system'
                                }
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
        }, true);
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


reportProvider.addStep(2, {
    getView : function (step)
    {
        var taskName,
            selectedOption = step.getParam('selectedOption')
        ;
        if (step === null) {
            return errOutput;
        }

        taskName = selectedOption
                    .name
        ;

        return [
            'Cool, please provide a start date ',
            taskName,
            'Just type ' + commandName + ' followed by a valid time format (dd-mm-yyyy) or write \'' + commandName + ' no\' to quit the timer setup'
        ].join('\n');
    },

    execute : function (params, previousStep, callback)
    {
        var step = interactiveSession
                    .getDefault()
                    .createStep(params.userId, {}, previousStep.getAction())
        ;

        callback(null, step);
    }
});


reportProvider.addStep(3, {
    
    subSteps : {
        1 : {
            getView : function (step)
            {
                var taskName,
                    previousStep = step.getParam('previousStep')
                ;
                if (step === null) {
                    return errOutput;
                }

                taskName = previousStep
                            .getParam('selectedOption')
                            .name
                ;

                return [
                    'Cool, please provide the end date ',
                    taskName,
                    'Just type ' + commandName + ' followed by a valid time format (dd-mm-yyyy) or write \'' + commandName + ' no\' to quit the timer setup'
                ].join('\n');
            },

            execute : function (params, previousStep, callback)
            {

                var value = params.value,
                    date,
                    step = interactiveSession
                        .getDefault()
                        .createStep(params.userId, {}, previousStep.getAction())
                ;

                if (value === 'no') {
                    interactiveSession
                            .getDefault()
                            .clear(params.userId)
                    ;
                    callback(
                        'Cool, try again later!',
                        null
                    );
                    return;
                }

                try {
                    date = dateParser
                            .getDefault()
                            .parse(value)
                    ;

                } catch (err) {
                    callback([
                        err.message
                    ].join('\n'), null);
                    return;
                }

                step.addParam('startDate', date);
                step.addParam('subStep', 1);
                callback(null, step);
            }
        },
        2 : {
            getView : function (step)
            {
                return step.getParam('view');
            },

            execute : function (params, previousStep, callback)
            {
                var value = params.value,
                    dateTo,
                    that = this,
                    id = previousStep
                            .getParam('previousStep')
                            .getParam('selectedOption')
                            .id,
                    dateFrom = previousStep.getParam('startDate'),
                    step = interactiveSession
                        .getDefault()
                        .createStep(params.userId, {}, previousStep.getAction())
                ;

                if (value === 'no') {
                    interactiveSession
                            .getDefault()
                            .clear(params.userId)
                    ;
                    callback(
                        'Cool, try again later!',
                        null
                    );
                    return;
                }

                try {
                    dateTo = dateParser
                            .getDefault()
                            .parse(value, dateFrom)
                    ;

                } catch (err) {
                    callback([
                        err.message
                    ].join('\n'), null);
                    return;
                }
                
                projectReport.getReport(id, dateFrom, dateTo, function (err, view) {
                    interactiveSession
                            .getDefault()
                            .clear(params.userId)
                    ;
                    
                    if (err) {
                        callback(err, null);
                    } else {
                        step.addParam('view', view);
                        callback(that.getView(step), null);
                    }
                });
            }
        }
    },
    
    getView : function (step)
    {
        var index = step.getParam('subStep');
        return this.subSteps['' + index + ''].getView(step);
    },

    execute : function (params, previousStep, callback)
    {
        var index = !previousStep.hasParam('subStep') ? '1' : String(previousStep.getParam('subStep') + 1);
        this.subSteps[index].execute(params, previousStep, callback);
    }
});

module.exports = reportProvider;