var 
    remindProvider,
    interactiveSession  = require('./../user_session.js'),
    tools               = require('./../../../tools.js'),
    _                   = require('lodash'),
    harvest             = require('./../../../harvest')('default'),
    errOutput           = 'Wrong input provided, try following the instructions...',
    reminder            = require('./../../../reminder/index.js')
;


remindProvider = {
    
    ACTION_NAME : 'remind',
    
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


module.exports = remindProvider; 