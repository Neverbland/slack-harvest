/*jshint node: true*/
'use strict';

var 
    noteProvider,
    interactiveSession  =   require('./../user_session.js'),
    tools               =   require('./../../../tools.js'),
    _                   =   require('lodash'),
    timerTools          =   require('./../../../timer'),
    harvest             =   require('./../../../harvest')('default'),
    logger              =   require('./../../../logger.js')('default'),
    commandName         =   require('./../../../../../config/index.js').api.controllers.timer.command,
    StepProvider        =   require('./../step_provider.js'),
    i18n                =   require('i18n'),
    errOutput           =   i18n.__('Wrong input provided, try following the instructions...')
;

noteProvider = new StepProvider('note');
noteProvider.addStep(1, {
    getView: function (step)
    {
        if (step === null) {
            return i18n.__('No entries found!');
        }
        var view = [
            i18n.__('Choose which entry you want to add the note to!'),
            ''
        ];

        _.each(step.getOptions(), function (option, value) {
            if (option.type === 'entry') {
                view.push(value + '. ' + option.name);
            }
        });

        view.push('');
        view.push(i18n.__('Just type {{{commandName}}} followed by a number to choose it or write \'{{{commandName}}} no\' to quit the note edition', {
            commandName : commandName
        }));

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
                logger.info(i18n.__('Successfully loaded tasks for user %s', params.userId), {});
                dayEntries = timerTools.findMatchingEntries(params.name, results.day_entries);
                if (!dayEntries.length) {
                    callback(that.getView(null), null);
                    return;
                }

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
});


noteProvider.addStep(2, {
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
            i18n.__('Cool, please provide the note to set for '),
            taskName,
            i18n.__('Just type {{{commandName}}} followed by the note string or write \'{{{commandName}}} no\' to quit the timer setup', {
                commandName : commandName
            })
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


noteProvider.addStep(3, {
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
            i18n.__('Successfully updated the note for '),
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
                i18n.__('You need to provide the note!')
            ].join('\n'), null);
            return;
        }

        if (note === 'no') {
            interactiveSession
                    .getDefault()
                    .clear(params.userId)
            ;
            callback(
                i18n.__('Cool, try again later!'),
                null
            );
            return;
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
                return;
            }
        });
    }
});



module.exports = noteProvider; 