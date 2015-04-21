/*jshint node: true*/
'use strict';

var     interactiveSession  = require('./lib/user_session.js'),
        resolverConstructor = require('./lib/resolver.js'),
        resolver            = null,
        tools               = require('./../tools'),
        _                   = require('lodash'),
        timerTools          = require('./../timer'),
        harvest             = require('./../harvest')('default'),
        stepTools           = require('./lib/step_tools.js'),
        errOutput           = 'Wrong input provided, try following the instructions...',
        logger              = require('./../../services/logger.js')('default'),
        commandName         = require('./../../../config/index.js').api.controllers.timer.command,
        reminder            = require('./../reminder/index.js')
;

if (resolver === null) {
    resolver = new resolverConstructor(interactiveSession.getDefault());


    /**
     * Applies step prototype to given step provider 
     * and returns it back
     * 
     * @param   {Object}    stepProvider
     * @returns {Object}
     */
    var stepFactory = function (stepProvider)
        {
            stepProvider.tools = new stepTools(stepProvider);
            return stepProvider;
        },
        availableActions = [
            'start',
            'stop',
            'status',
            'projects',
            'remind'
        ];
    ;
    
    
    timerTools.setAvailableActions(availableActions);
    

    // Step 1 provider
    resolver.addStepProvider(stepFactory({
        stepActionProviders: {
            
            start : {

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
            },
            
            remind : {
                execute : function (params, callback)
                {
                    var userId = params.name,
                        users,
                        error = null
                    ;
                    if (!!userId) {
                        try {
                            users = tools.validateGetUser(harvest.users, userId);
                        } catch (err) {
                            users = null;
                            error = err;
                        }
                    } else {
                        users = harvest.users;
                    }
                    var step = interactiveSession
                                .getDefault()
                                .createStep(params.userId, {}, params.action)
                                .addParam('users', users)
                                .addParam('error', error)
                    ;
                    callback(null, step);
                },
                
                postExecute : function (step, callback) 
                {
                    var users = step.getParam('users'),
                        error = step.getParam('error')
                    ;
                    if (error !== null) {
                        callback();
                        return;
                    }
                    reminder.remind(users, null, function (results) {
                        step.addParam('results', results);
                        
                        var userId = step.getParam('userId');
                        interactiveSession
                                .getDefault()
                                .clear(userId)
                        ;
                        
                        callback();
                    });
                },
                
                prepareStep: function (step)
                {
                    return null;
                },
                
                getView : function (step)
                {
                    var results = step.getParam('results'),
                        error = step.getParam('error'),
                        view = []
                    ;
                    if (error) {
                        return error.message;
                    }
                    
                    if (Object.size(results.notified) > 0) {
                        view.push('Notified given users:');
                        view.push('');
                        _.each(results.notified, function (slackName) {
                            view.push(slackName);
                        });
                    } else {
                        view.push('No user notifications sent!');
                        view.push('All users are running their timers!');
                    }
                    
                    return  view.join('\n');
                }
            },
            
            status: {
                execute : function (params, callback)
                {
                    var that = this,
                        action = tools.validateGet(params, 'action')
                    ;
                    harvest.getTasks(params.userId, function (err, results) {
                        
                        var dayEntries,
                            step
                        ;

                        if (err !== null) {
                            callback(err, null);
                            return;
                        } else if (!results.day_entries) {
                            var step = interactiveSession
                                        .getDefault()
                                        .createStep(params.userId, {}, params.action)
                            ;
                            callback(null, step);
                        } else {
                            dayEntries = results.day_entries;
                            logger.info('Successfully loaded tasks for user ' + params.userId, {});

                            if (!dayEntries.length) {
                                callback(that.getView(null), null);
                                return;
                            }

                            step = interactiveSession
                                        .getDefault()
                                        .createStep(params.userId, {}, action)
                            ;

                            step.addParam('entries', dayEntries);

                            callback(null, step);
                        }
                    });
                },
                
                postExecute: function (step, callback)
                {
                    var userId = step.getParam('userId');
                    interactiveSession
                            .getDefault()
                            .clear(userId)
                    ;
                    callback();
                },
                prepareStep: function (step)
                {
                    return null;
                },
                
                getView: function (step)
                {
                    var errorString = 'Currently you have no running tasks.';
                    if (step === null) {
                        return errorString;
                    }
                    var entry = timerTools.filterCurrentEntry(step.getParam('entries'));
                    if (entry !== null) {
                        return  [
                            'You are currently working on ',
                            entry.client + ' - ' + entry.project + ' - ' + entry.task
                        ].join('\n');
                    } else {
                        return errorString;
                    }
                }
            },
            projects: {
                
                getView: function (step)
                {
                    var errorString = 'Currently you have no available projects.';
                    if (step === null) {
                        return errorString;
                    }
                    
                    var view = [
                        'Available projects',
                        ''
                    ];

                    _.each(step.getParam('projects'), function (project, index) {
                        view.push((index + 1) + '. ' + project.client + ' - ' + project.name);
                    });

                    return view.join('\n');
                },
                
                execute : function (params, callback)
                {
                    var that = this;
                    harvest.getTasks(params.userId, function (err, results) {
                        var step;
                        if (err !== null) {
                            callback(err, null);
                        } else if (!results.projects || !results.projects.length) {
                            callback(that.getView(null), null);
                        } else {
                            step = interactiveSession
                                        .getDefault()
                                        .createStep(params.userId, {}, params.action)
                            ;
                            step.addParam('projects', results.projects);
                            callback(null, step);
                        }
                    });
                },
                
                postExecute: function (step, callback) 
                {
                    var userId = step.getParam('userId');
                    interactiveSession
                            .getDefault()
                            .clear(userId)
                    ;
                    callback();
                },
                
                prepareStep: function (step)
                {
                    return null;
                }
            },
            
            
            stop: {
                
                getView: function (step)
                {
                    if (step === null) {
                        return 'Currently you have no running tasks.';
                    }
                    var error = step.getParam('stopError'),
                        entry = step.getParam('entry')
                    ;

                    if (typeof error !== 'undefined') {
                        return error;
                    }

                    return [
                        'Successfully stopped the timer for',
                        entry.client + ' - ' + entry.project + ' - ' + entry.task
                    ].join('\n');
                },
                
                
                execute : function (params, callback)
                {
                    var that = this,
                        action = tools.validateGet(params, 'action')
                    ;
                    harvest.getTasks(params.userId, function (err, results) {
                
                        var dayEntries,
                            step
                        ;

                        if (err !== null) {
                            callback(err, null);
                            return;
                        } else {
                            dayEntries = results.day_entries || [];
                            logger.info('Successfully loaded tasks for user ' + params.userId, {});

                            if (!dayEntries.length) {
                                callback(that.getView(null), null);
                                return;
                            }

                            step = interactiveSession
                                        .getDefault()
                                        .createStep(params.userId, {}, action)
                            ;

                            step.addParam('entries', dayEntries);

                            callback(null, step);
                        }
                    });
                },

                
                prepareStep: function (step)
                {
                    return null;
                },
                
                postExecute: function (step, callback)
                {
                    var entry = timerTools.filterCurrentEntry(step.getParam('entries')),
                            userId = step.getParam('userId');

                    if (entry === null) {
                        step.addParam('stopError', 'Currently you have no running tasks.');
                        interactiveSession
                                .getDefault()
                                .clear(userId)
                        ;

                        callback();
                    } else {
                        step.addParam('entry', entry);
                        harvest.toggle(userId, entry.id, function (err, result) {
                            if (err !== null) {
                                step.addParam('stopError', 'An error occured, please try again later.');
                            }
                            interactiveSession
                                    .getDefault()
                                    .clear(userId)
                            ;

                            callback();
                        });
                    }
                }
            }
        },
        
        
        
        validate: function (params, step)
        {
            if (step === null) {
                return true;
            }

            return false;
        },
        
        
        execute: function (params, previousStep, callback) {
            
            var action = tools.validateGet(params, 'action'),
                that = this,
                stepAction = that.getStepAction(action),
                view
            ;
                 
            if (action === null) {
                callback(null, this.createView(null), null);
                return;
            }
            
            
            stepAction.execute(params, function (err, step) {
                if (err !== null) {
                    callback(null, err, null);
                    return;
                } else {
                    stepAction.postExecute(step, function () {
                        view = that.createView(step);
                        callback(null, view, stepAction.prepareStep(step));
                    });
                }
            });
        },
        
        
        /**
         * Returns view provider depending on what the step params are
         * 
         * @param       {Object}    step
         * @returns     {String}
         */
        createView: function (step)
        {
            if (step === null) {
                return errOutput;
            }
            var action;
            try {
                action = step.getAction();
            } catch (err) {
                return errOutput;
            }

            try {
                var provider = tools.validateGet(this.stepActionProviders, action);
            } catch (err) {
                return errOutput;
            }

            return provider.getView(step);
        },
        
        
        getStepAction: function (action)
        {
            var stepActionProvider = this.stepActionProviders[action];
            return stepActionProvider ? stepActionProvider : null;
        }
    }));


    // Step 2 provider
    resolver.addStepProvider(stepFactory({
        stepNumber: 1,
        validate: function (params, step)
        {
            return this.tools.validate(this.stepNumber, step);
        },
        
        execute: function (params, previousStep, callback) {
            var value,
                option,
                projectId,
                action = previousStep.getAction(),
                projects = previousStep.getParam('entries').projects,
                userId = params.userId,
                that = this,
                tasks, 
                step;
            
            try {
                value = tools.validateGet(params, 'value');
                option = previousStep.getOption(value);
                projectId = option.id;
            } catch (err) {
                callback(null, that.createView(null), null);
            }

            if (this.tools.isRejectResponse(option, value)) {
                this.tools.executeRejectResponse(userId, callback);
                return;
            }

            tasks = timerTools.getProjectTasks(projectId, projects);

            step = interactiveSession
                    .getDefault()
                    .createStep(userId, (function (tasks) {

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
                                project_id : projectId,
                                type: 'task'
                            };
                        });

                        return options;
                    })(tasks), action);

            step.addParam('selectedOption', option);
            callback(null, that.createView(step), step);
        },
        
        createView: function (step)
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
        }
    }));



    // Step 3 provider
    resolver.addStepProvider(stepFactory({
        stepNumber: 2,
        validate: function (params, step)
        {
            return this.tools.validate(this.stepNumber, step);
        },
        
        execute: function (params, previousStep, callback) {
            var value,
                option,
                taskId,
                step1 = previousStep.getParam('previousStep'),
                projectId = previousStep.getParam('selectedOption').id,
                userId = params.userId,
                entries = step1.getParam('entries'),
                dailyEntries = entries.day_entries,
                that = this,
                step = interactiveSession
                .getDefault()
                .createStep(userId, {}, previousStep.getAction()),
                dailyEntry,
                resultsCallback
            ;
            
            try {
                value = tools.validateGet(params, 'value');
                option = previousStep.getOption(value);
                taskId = option.id;
            } catch (err) {
                callback(null, that.createView(null), null);
            }

            if (this.tools.isRejectResponse(option, value)) {
                this.tools.executeRejectResponse(params.userId, callback);
                return;
            }

            dailyEntry = timerTools.getDailyEntry(taskId, projectId, dailyEntries);

            var resultsCallback = function (err, result) {
                if (err) {
                    step.addParam('error', err);
                }

                if (!step.getParam('entry')) {
                    step.addParam('entry', result);
                }
                interactiveSession
                        .getDefault()
                        .clear(userId)
                        ;

                callback(null, that.createView(step), null);
            };

            if (dailyEntry === null) {
                harvest.createEntry(params.userId, projectId, taskId, resultsCallback);
            } else {
                harvest.toggle(params.userId, dailyEntry.id, resultsCallback);
            }
        },
        createView: function (step)
        {
            if (step === null) {
                return errOutput;
            }
            var entry = step.getParam('entry');
            if (step.getParam('error')) {
                return 'An error occured, please try again later';
            } else {
                return [
                    'Successfully created and started an entry for',
                    '',
                    entry.client + ' - ' + entry.project + ' - ' + entry.task
                ].join('\n');
            }
        }
    }));
}


module.exports = resolver;