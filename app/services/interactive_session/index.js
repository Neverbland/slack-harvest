/*jshint node: true*/
'use strict';

var     interactiveSession  = require('./lib/user_session.js'),
        resolverConstructor = require('./lib/resolver.js'),
        resolver            = null,
        tools               = require('./../tools.js'),
        _                   = require('lodash'),
        timerTools          = require('./../timer'),
        harvest             = require('./../harvest')('default'),
        StepTools           = require('./lib/step_tools.js'),
        errOutput           = 'Wrong input provided, try following the instructions...',
        logger              = require('./../../services/logger.js')('default'),
        commandName         = require('./../../../config/index.js').api.controllers.timer.command,
        reminder            = require('./../reminder/index.js'),
        timeParser          = require('./lib/time_parser.js'),
        availableActions    = [
            'start',
            'stop',
            'status',
            'projects',
            'remind',
            'update',
            'note'
        ];
;


/**
 * Applies step prototype to given step provider 
 * and returns it back
 * 
 * @param   {Object}    stepProvider
 * @returns {Object}
 */
function stepProviderFactory (stepProvider)
{
    stepProvider.tools = new StepTools(stepProvider);
    return stepProvider;
}


if (resolver === null) {
    resolver = new resolverConstructor(interactiveSession.getDefault());
    timerTools.setAvailableActions(availableActions);
    

    // Step 1 provider
    resolver.addStepProvider((function () {
        
        var steps = stepProviderFactory({
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

                note : {
                    getView: function (step)
                    {
                        if (step === null) {
                            return 'No entries found!';
                        }
                        var view = [
                            'Choose which entry you want to add the note to!',
                            ''
                        ];

                        _.each(step.getOptions(), function (option, value) {
                            if (option.type === 'entry') {
                                view.push(value + '. ' + option.name);
                            }
                        });

                        view.push('');
                        view.push('Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' to quit the note edition');

                        return view.join('\n');
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

                update : {

                    getView: function (step)
                    {
                        if (step === null) {
                            return 'No entries found!';
                        }
                        var view = [
                            'Choose which entry you want to update!',
                            ''
                        ];

                        _.each(step.getOptions(), function (option, value) {
                            if (option.type === 'entry') {
                                view.push(value + '. ' + option.name);
                            }
                        });

                        view.push('');
                        view.push('Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' to quit the timer setup');

                        return view.join('\n');
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
                        var view = [],
                            errorString = 'Currently you have no running tasks.',
                            entry,
                            entries,
                            time,
                            totalTime = 0
                        ;
                        if (step === null) {
                            view.push(errorString);
                        }
                        entries = step.getParam('entries');
                        entry = timerTools.filterCurrentEntry(entries);
                        if (entry !== null) {
                            view.push('You are currently working on ');
                            time = tools.getHours(entry),
                            view.push(entry.client + ' - ' + entry.project + ' - ' + entry.task + ' (' + tools.formatTime(time) + ')');

                        } else {
                            view.push(errorString);
                        }

                        _.each(entries, function (entry) {
                            var time = tools.getHours(entry);
                            totalTime += time;
                        });

                        view.push('');
                        view.push('Total: ' + tools.formatTime(totalTime));

                        return view.join('\n');
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
        });
        
        steps
            .stepActionProviders
            .note
            .execute = steps
            .stepActionProviders
            .update.execute = function (params, callback)
            {
                var that = this,
                    action = tools.validateGet(params, 'action')
                ;
                harvest.getTasks(params.userId, function (err, results) {

                    var dayEntries,
                        step,
                        options
                    ;

                    if (err !== null) {
                        callback(err, null);
                        return;
                    } else {
                        logger.info('Successfully loaded tasks for user ' + params.userId, {});
                        dayEntries = timerTools.findMatchingEntries(params.name, results.day_entries);
                        if (!dayEntries.length) {
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
                                    name: entry.client + ' - ' + entry.project + ' - ' + entry.task + ' (' + tools.formatTime(tools.getHours(entry)) + ')',
                                    task_id: entry.task_id,
                                    id : entry.id,
                                    project_id : entry.project_id,
                                    type: 'entry'
                                };
                            });

                            return options;
                        })(dayEntries);

                        step = interactiveSession
                                    .getDefault()
                                    .createStep(params.userId, options, action)
                        ;

                        step.addParam('entries', results);

                        callback(null, step);
                    }
                });
            };
        
        
        return steps;
    })());


    // Step 2 provider
    resolver.addStepProvider(stepProviderFactory({
        stepNumber: 1,
        
        
        actionProviders : {
            
            update : {
                getView : function (step)
                {
                    var taskName;
                    if (step === null) {
                        return errOutput;
                    }
                    
                    taskName = step
                                .getParam('selectedOption')
                                .name
                    ;
                    
                    return [
                        'Cool, please provide a time to set for ',
                        taskName,
                        'Just type ' + commandName + ' followed by a valid time format (HH:mm or number of seconds) or write \'' + commandName + ' no\' to quit the timer setup'
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
            },
            
            note : {
                getView : function (step)
                {
                    var taskName;
                    if (step === null) {
                        return errOutput;
                    }
                    
                    taskName = step
                                .getParam('selectedOption')
                                .name
                    ;
                    
                    return [
                        'Cool, please provide the note to set for ',
                        taskName,
                        'Just type ' + commandName + ' followed by the note string or write \'' + commandName + ' no\' to quit the timer setup'
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
            },
            
            start : {
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
            }
        },
        
        
        validate: function (params, step)
        {
            return this.tools.validate(this.stepNumber, step);
        },
        
        execute: function (params, previousStep, callback) {
            var value,
                option,
                action = previousStep.getAction(),
                that = this,
                stepAction = this.actionProviders[action],
                view
            ;
            
            try {
                value = tools.validateGet(params, 'value');
                option = previousStep.getOption(value);
            } catch (err) {
                callback(null, this.createView(null), null);
                return;
            }

            if (this.tools.isRejectResponse(option, value)) {
                this.tools.executeRejectResponse(params.userId, callback);
                return;
            }
            
            stepAction.execute(params, previousStep, function (returnMessage, step) {
                if (returnMessage !== null) {
                    callback(null, returnMessage, null);
                    return;
                } else {
                    step.addParam('selectedOption', option);
                    view = that.createView(step);
                    callback(null, view, step);
                }
            });
        },
        
        createView: function (step)
        {
            if (step === null) {
                return errOutput;
            }
            var action = step.getAction();
            return this.actionProviders[action].getView(step);
        }
    }));



    // Step 3 provider
    resolver.addStepProvider(stepProviderFactory({
        stepNumber: 2,
        
        
        actionProviders : {
            
            update : {
                
                getView : function (step)
                {
                    var taskName = step
                                .getParam('previousStep')
                                .getParam('selectedOption')
                                .name
                    ;
                    if (step === null) {
                        return errOutput;
                    }
                    
                    return [
                        'Successfully updated the time for ',
                        taskName,
                        'to ' + step.getParam('timeRaw')
                    ].join('\n');
                },
                
                execute : function (params, previousStep, callback)
                {
                    var value = params.value,
                        time,
                        that = this,
                        id = previousStep
                                .getParam('selectedOption')
                                .id,
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
                    }
                    
                    try {
                        time = timeParser
                                .getDefault()
                                .parse(value)
                        ;
                        
                    } catch (err) {
                        callback([
                            err.message,
                            'Try again, the valid format is HH:mm or number of seconds'
                        ].join('\n'), null);
                        return;
                    }
                    
                    harvest.update(params.userId, id, {
                        hours : time
                    }, function (err, results) {

                        interactiveSession
                            .getDefault()
                            .clear(params.userId)
                        ;
                        if (err !== null) {
                            callback(err, null);
                            return;
                        } else {
                            step
                                .addParam('timeRaw', value)
                                .addParam('timeParsed', time)
                            ;
                            callback(that.getView(step), null);
                        }
                    });
                }
            },
            
            note : {
                
                getView : function (step)
                {
                    var taskName = step
                                .getParam('previousStep')
                                .getParam('selectedOption')
                                .name
                    ;
                    if (step === null) {
                        return errOutput;
                    }
                    
                    return [
                        'Successfully updated the note for ',
                        taskName,
                        '',
                        '> ' + step.getParam('note')
                    ].join('\n');
                },
                
                execute : function (params, previousStep, callback)
                {
                    var note = params.value,
                        that = this,
                        id = previousStep
                                .getParam('selectedOption')
                                .id,
                        step = interactiveSession
                            .getDefault()
                            .createStep(params.userId, {}, previousStep.getAction())
                    ;
                    
                    if (!note || !note.length) {
                        callback([
                            'You need to provide the note!'
                        ].join('\n'), null);
                        return;
                    }
                    
                    if (note === 'no') {
                        interactiveSession
                                .getDefault()
                                .clear(params.userId)
                        ;
                        callback(
                            'Cool, try again later!',
                            null
                        );
                    }
                    
                    harvest.update(params.userId, id, {
                        notes : note
                    }, function (err, results) {

                        interactiveSession
                            .getDefault()
                            .clear(params.userId)
                        ;
                        if (err !== null) {
                            callback(err, null);
                            return;
                        } else {
                            step.addParam('note', note);
                            callback(that.getView(step), null);
                        }
                    });
                }
            },
            
            start : {
                
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
            }
            
        },
        
        
        
        validate: function (params, step)
        {
            return this.tools.validate(this.stepNumber, step);
        },
        
        execute: function (params, previousStep, callback) {
            var value,
                option,
                stepAction = this.actionProviders[previousStep.getAction()],
                that = this,
                view
            ;
            
            try {
                value = tools.validateGet(params, 'value');
                option = previousStep.getOption(value);
            } catch (err) {}

            if (option && this.tools.isRejectResponse(option, value)) {
                this.tools.executeRejectResponse(params.userId, callback);
                return;
            }

            stepAction.execute(params, previousStep, function (returnMessage, step) {
                if (returnMessage !== null) {
                    callback(null, returnMessage.toString(), null);
                    return;
                } else {
                    step.addParam('selectedOption', option);
                    view = that.createView(step);
                    callback(null, view, step);
                }
            });
        },
        
        
        createView: function (step)
        {
            var action = step.getAction();
            return this.actionProviders[action].getView(step);
        }
    }));
}


module.exports = resolver;