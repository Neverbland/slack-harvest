/*jshint node: true*/
'use strict';

var 
    startProvider,
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

startProvider = new StepProvider('start');
startProvider.addStep(1, {
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
        view.push('Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' to quit the timer setup');


        return view.join('\n');
    },

    execute : function (params, callback)
    {
        var that = this,
            action = tools.validateGet(params, 'action')
        ;
        harvest.getTasks(params.userId, function (err, results) {

            var projects,
                step,
                options
            ;

            if (err !== null) {
                callback(err, null);
                return;
            } else {
                logger.info('Successfully loaded tasks for user ' + params.userId, {});
                projects = timerTools.findMatchingClientsOrProjects(params.name, results.projects);

                if (!projects.length) {
                    callback(that.getView(null), null);
                    return;
                }

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

                step.addParam('entries', results);

                callback(null, step);
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

startProvider.addStep(2, {
    getView : function (step)
    {
        if (step === null) {
            return errOutput;
        }
        var view = [
            'Cool, love that project!',
            'What task are you on?',
            ''
        ],

        previousStep = step.getParam('previousStep'),
        dailyEntries = previousStep.getParam('entries').day_entries;

        _.each(step.getOptions(), function (option, value) {
            if (option.type === 'task') {
                view.push(value + '. ' + option.name + (timerTools.isRunningTask(option.id, option.project_id, dailyEntries) ? ' (Currently running)' : ''));
            }
        });

        view.push('');
        view.push('Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' if you picked the wrong project.');

        return view.join('\n');
    },

    execute : function (params, previousStep, callback)
    {
        var value = tools.validateGet(params, 'value'),
            option = previousStep.getOption(value),
            tasks = timerTools.getProjectTasks(option.id, previousStep.getParam('entries').projects),
            step = interactiveSession
                    .getDefault()
                    .createStep(params.userId, (function (tasks) {

                        var options = {};
                        options['no'] = {
                            name: 'Quit',
                            id: null,
                            type: 'system'
                        };

                        _.each(tasks, function (task, index) {

                            options['' + (index + 1) + ''] = {
                                name: task.name,
                                id: task.id,
                                project_id : option.id,
                                type: 'task'
                            };
                        });

                        return options;
                    })(tasks), previousStep.getAction())
        ;

        callback(null, step);
    }
});


startProvider.addStep(3, {
    getView : function (step)
     {
         var entry;
         if (step === null) {
             return errOutput;
         }
         entry = step.getParam('entry');
         if (step.getParam('error')) {
             return 'An error occured, please try again later';
         } else {
             return [
                 'Successfully created and started an entry for',
                 '',
                 entry.client + ' - ' + entry.project + ' - ' + entry.task
             ].join('\n');
         }
     },

     execute : function (params, previousStep, callback)
     {
         var value,
             option,
             that = this,
             dailyEntries = previousStep
                 .getParam('previousStep')
                 .getParam('entries')
                 .day_entries,
             projectId = previousStep
                 .getParam('selectedOption')
                 .id,
             step = interactiveSession
                 .getDefault()
                 .createStep(params.userId, {}, previousStep.getAction()),
             dailyEntry,
             resultsCallback
         ;

         try {
             value = tools.validateGet(params, 'value');
             option = previousStep.getOption(value);
         } catch (err) {
             callback(this.getView(null), null);
         }

         dailyEntry = timerTools.getDailyEntry(option.id, projectId, dailyEntries);

         var resultsCallback = function (err, result) {
             if (err) {
                 step.addParam('error', err);
             }

             if (!step.getParam('entry')) {
                 step.addParam('entry', result);
             }
             interactiveSession
                     .getDefault()
                     .clear(params.userId)
             ;

             callback(that.getView(step), null);
         };

         if (dailyEntry === null) {
             harvest.createEntry(params.userId, projectId, option.id, resultsCallback);
         } else {
             harvest.toggle(params.userId, dailyEntry.id, resultsCallback);
         }
     }
 });



module.exports = startProvider; 