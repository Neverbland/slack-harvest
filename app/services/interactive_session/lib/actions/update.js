/*jshint node: true*/
'use strict';

var 
    updateProvider,
    interactiveSession  =   require('./../user_session.js'),
    tools               =   require('./../../../tools.js'),
    _                   =   require('lodash'),
    timerTools          =   require('./../../../timer'),
    harvest             =   require('./../../../harvest')('default'),
    i18n                =   require('i18n'),
    logger              =   require('./../../../logger.js')('default'),
    commandName         =   require('./../../../../../config/index.js').api.controllers.timer.command,
    timeParser          =   require('./../time_parser.js'),
    StepProvider        =   require('./../step_provider.js'),
    errOutput           =   i18n.__('Wrong input provided, try following the instructions...')
;


updateProvider = new StepProvider('update');
updateProvider.addStep(1, {
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

    getView: function (step)
    {
        if (step === null) {
            return i18n.__('No entries found!');
        }
        var view = [
            i18n.__('Choose which entry you want to update!'),
            ''
        ];

        _.each(step.getOptions(), function (option, value) {
            if (option.type === 'entry') {
                view.push(value + '. ' + option.name);
            }
        });

        view.push('');
        view.push(i18n.__('Just type {{{commandName}}} followed by a number to choose it or write \'{{{commandName}}} no\' to quit the timer setup', {
            commandName : commandName
        }));

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
});


updateProvider.addStep(2, {
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
            i18n.__('Cool, please provide a time to set for '),
            taskName,
            i18n.__('Just type {{{commandName}}} followed by a valid time format (HH:mm or number of seconds) or write \'{{{commandName}}} no\' to quit the timer setup', {
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

updateProvider.addStep(3, {
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
            i18n.__('Successfully updated the time for '),
            taskName,
            i18n.__('to %s', step.getParam('timeRaw'))
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
                i18n.__('Cool, try again later!'),
                null
            );
            return;
        }

        try {
            time = timeParser
                    .getDefault()
                    .parse(value)
            ;

        } catch (err) {
            callback([
                err.message,
                i18n.__('Try again, the valid format is HH:mm or number of seconds')
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
});

module.exports = updateProvider; 