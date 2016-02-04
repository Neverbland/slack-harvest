/*jshint node: true*/
'use strict';

var 
    projectsProvider,
    interactiveSession  =   require('./../user_session.js'),
    _                   =   require('lodash'),
    harvest             =   require('./../../../harvest')('default'),
    StepProvider        =   require('./../step_provider.js'),
    i18n                =   require('i18n')
;

projectsProvider = new StepProvider('projects');
projectsProvider.addStep(1, {
    getView: function (step)
    {
        var errorString = i18n.__('Currently you have no available projects.');
        if (step === null) {
            return errorString;
        }

        var view = [
            i18n.__('Available projects'),
            ''
        ];

        _.each(step.getParam('projects'), function (project, index) {
            view.push((index + 1) + '. ' + project.client + ' - ' + project.name);
        });

        return view.join('\n');
    },

    execute : function (params, callback)
    {
        var that = this;
        harvest.getTasks(params.userId, function (err, results) {
            var step;
            if (err !== null) {
                callback(err, null);
            } else if (!results.projects || !results.projects.length) {
                callback(that.getView(null), null);
            } else {
                step = interactiveSession
                            .getDefault()
                            .createStep(params.userId, {}, params.action)
                ;
                step.addParam('projects', results.projects);
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
    }
});


module.exports = projectsProvider; 