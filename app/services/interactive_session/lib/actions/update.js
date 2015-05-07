/*jshint node: true*/
'use strict';

var 
    updateProvider,
    interactiveSession  = require('./../user_session.js'),
    tools               = require('./../../../tools.js'),
    _                   = require('lodash'),
    timerTools          = require('./../../../timer'),
    harvest             = require('./../../../harvest')('default'),
    errOutput           = 'Wrong input provided, try following the instructions...',
    logger              = require('./../../../logger.js')('default'),
    commandName         = require('./../../../../../config/index.js').api.controllers.timer.command,
    timeParser          = require('./../time_parser.js'),
    StepProvider        = require('./../step_provider.js')
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
});

module.exports = updateProvider; 