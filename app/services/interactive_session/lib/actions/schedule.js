/*jshint node: true*/
'use strict';

var 
    scheduleProvider,
    interactiveSession  =   require('./../user_session.js'),
    tools               =   require('./../../../tools.js'),
    _                   =   require('lodash'),
    viewBuilder         =   require('./../../../forecast/view'),
    forecast            =   require('./../../../forecast')('default'),
    i18n                =   require('i18n'),
    logger              =   require('./../../../logger.js')('default'),
    StepProvider        =   require('./../step_provider.js'),
    moment              =   require('moment')
;

scheduleProvider = new StepProvider('schedule');
scheduleProvider.addStep(1, {
    execute : function (params, callback)
    {
        var that = this,
            action = tools.validateGet(params, 'action'),
            userId = params.userId,
            assignmentsByUser,
            userAssignments
        ;
        
        
        if (forecast === null) {
            return null;
        }
        var options = {
            startDate : moment().startOf('day'),
            endDate : moment().endOf('day')
        };

        forecast.assignments(options, function (error, assignments) {
            if (error) {
                logger.error(i18n.__('Failed loading forecast schedule.', {}));
                callback(error, null);
                return;
            } else {
                logger.info(i18n.__('Successfully loaded forecast schedule.'), {});
                
                assignmentsByUser = viewBuilder.aggregateByUser(assignments);
                userAssignments = !!assignmentsByUser[userId] ? assignmentsByUser[userId] : null;
                if (!userAssignments) {
                    callback(that.getView(null), null);
                    return;
                }
                
                step = interactiveSession
                            .getDefault()
                            .createStep(userId, {}, action)
                ;
                step.addParam('userAssignments', userAssignments);
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
        var userAssignments,
            view,
            errorString = i18n.__('Currently you have no tasks scheduled.')
        ;
        
        if (step === null) {
            view = errorString;
        } else {
            userAssignments = step.getParam('userAssignments');
            view = viewBuilder.getView(userAssignments);            
        }
        

        return view;
    }
});

module.exports = scheduleProvider; 