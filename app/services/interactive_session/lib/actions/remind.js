/*jshint node: true*/
'use strict';

var
    remindProvider,
    interactiveSession  =   require('./../user_session.js'),
    tools               =   require('./../../../tools.js'),
    _                   =   require('lodash'),
    harvest             =   require('./../../../harvest')('default'),
    reminder            =   require('./../../../reminder/index.js'),
    StepProvider        =   require('./../step_provider.js'),
    i18n                =   require('i18n')
;

remindProvider = new StepProvider('remind');
remindProvider.addStep(1, {
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
            view.push(i18n.__('Notified given users:'));
            view.push('');
            _.each(results.notified, function (slackName) {
                view.push(slackName);
            });
        } else {
            view.push(i18n.__('No user notifications sent!'));
            view.push(i18n.__('All users are running their timers!'));
        }

        return  view.join('\n');
    }
});


module.exports = remindProvider; 