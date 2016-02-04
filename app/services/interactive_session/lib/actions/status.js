/*jshint node: true*/
'use strict';

var 
    statusProvider,
    interactiveSession  =   require('./../user_session.js'),
    tools               =   require('./../../../tools.js'),
    _                   =   require('lodash'),
    timerTools          =   require('./../../../timer'),
    harvest             =   require('./../../../harvest')('default'),
    i18n                =   require('i18n'),
    logger              =   require('./../../../logger.js')('default'),
    StepProvider        =   require('./../step_provider.js')
;

statusProvider = new StepProvider('status');
statusProvider.addStep(1, {
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
                step = interactiveSession
                            .getDefault()
                            .createStep(params.userId, {}, params.action)
                ;
                callback(null, step);
            } else {
                dayEntries = results.day_entries;
                logger.info(i18n.__('Successfully loaded tasks for user %s', params.userId), {});

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
            errorString = i18n.__('Currently you have no running tasks.'),
            entry,
            entries,
            time,
            viewArray,
            totalTime = 0
        ;
        if (step === null) {
            view.push(errorString);
        }
        entries = step.getParam('entries');
        entry = timerTools.filterCurrentEntry(entries);
        if (entry !== null) {
            view.push(i18n.__('You are currently working on: '));
            time = tools.getHours(entry);
            viewArray = [
                entry.client,
                entry.project,
                entry.task
            ];
            
            if (entry.notes.length) {
                viewArray.push(entry.notes);
            }
            view.push(viewArray.join(' - ') + ' (' + tools.formatTime(time) + ')');

        } else {
            view.push(errorString);
        }

        _.each(entries, function (entry) {
            var time = tools.getHours(entry);
            totalTime += time;
        });

        view.push('');
        view.push(i18n.__('Total: %s', tools.formatTime(totalTime)));

        return view.join('\n');
    }
});

module.exports = statusProvider; 