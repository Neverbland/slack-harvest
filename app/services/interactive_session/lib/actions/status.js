var 
    statusProvider,
    interactiveSession  = require('./../user_session.js'),
    tools               = require('./../../../tools.js'),
    _                   = require('lodash'),
    timerTools          = require('./../../../timer'),
    harvest             = require('./../../../harvest')('default'),
    errOutput           = 'Wrong input provided, try following the instructions...',
    logger              = require('./../../../logger.js')('default')
;


statusProvider = {
    
    ACTION_NAME : 'status',
    
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
        };
    },
    
    
    getStepTwo : function ()
    {
        return null;
    },
    
    
    getStepThree : function ()
    {
        return null;
    }
    
};


module.exports = statusProvider; 