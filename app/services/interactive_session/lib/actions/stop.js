var 
    stopProvider,
    interactiveSession  = require('./../user_session.js'),
    tools               = require('./../../../tools.js'),
    timerTools          = require('./../../../timer'),
    harvest             = require('./../../../harvest')('default'),
    errOutput           = 'Wrong input provided, try following the instructions...',
    logger              = require('./../../../logger.js')('default')
;


stopProvider = {
    
    ACTION_NAME : 'stop',
    
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


module.exports = stopProvider; 