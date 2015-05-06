var 
    noteProvider,
    interactiveSession  = require('./../user_session.js'),
    tools               = require('./../../../tools.js'),
    _                   = require('lodash'),
    timerTools          = require('./../../../timer'),
    harvest             = require('./../../../harvest')('default'),
    errOutput           = 'Wrong input provided, try following the instructions...',
    logger              = require('./../../../logger.js')('default'),
    commandName         = require('./../../../../../config/index.js').api.controllers.timer.command
;


noteProvider = {
    
    ACTION_NAME : 'note',
    
    /**
     * Provides the name for action
     * 
     * @returns     {String}
     */
    getActionName : function ()
    {
        return this.ACTION_NAME;
    },
    
    
    /**
     * Returns step provider for step one
     * 
     * @returns {Function}
     */
    getStepOne : function ()
    {
        return {
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
            
            execute : function (params, callback)
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
            },


            postExecute : function (step, callback) 
            {
                callback();
            },

            prepareStep: function (step)
            {
                return step;
            }
        };
    },
    
    
    getStepTwo : function ()
    {
        return {
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
        };
    },
    
    
    getStepThree : function ()
    {
        return {
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
        };
    }
    
};


module.exports = noteProvider; 