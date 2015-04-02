/*jshint node: true*/
'use strict';

var interactiveSession = require('./lib/user_session.js'),
    resolverConstructor = require('./lib/resolver').resolver,
    resolver = new resolverConstructor(interactiveSession.getDefault()),
    tools = require('./../tools'),
    _ = require('lodash'),
    timerParser = require('./../timer'),
    harvest = require('./../harvest')('default');

    // Step 1 provider
    resolver.addStepProvider({

        validate : function (params, step)
        {
            if (step === null) {
                return true;
            }
            
            return false;
        },
        
        execute : function (params, previousStep, callback) {
            var name = params.name;
            var that = this;
            harvest.getTasks(params.userId, function (err, results) {
 
                if (err !== null) {
                    callback(err, that.createView(null), null);
                } else {
                    var projects = timerParser.findMatchingClientsOrProjects(name, results.projects),
                        step = interactiveSession.createStep((function (entries) {
                            
                            var options = {};
                            options['no'] = {
                                name : 'Quit',
                                id : null,
                                type : 'system'
                            };
                            
                            _.each(entries, function (entry, index) {
 
                                options['' + (index + 1) + ''] = {
                                    name : entry.client + ' - ' + entry.project,
                                    id : entry.projectId,
                                    type : 'project'
                                };
                            });
                            
                            return options;
                        })(projects));
                        
                        callback(null, that.createView(step), step);
                }
            });
        },
        
        createView : function (step)
        {
            if (step === null) {
                return 'Wrong input provided, try following the instructions...';
            } else {
                var view = [
                    'Choose the awesome project you are working on today!',
                    ''
                ];

                _.each(step.getOptions(), function (option, value) {
                    if (option.type === 'project') {
                        view.push(value + '. ' + option.name);
                    }
                });
                
                view.push('');
                view.push('Just type the number to choose it or write \'no\' to quit the timer setup');


                return view.join('\n');
            }
        }
    });
    
    
    // Step 2 provider
    resolver.addStepProvider({

        validate : function (params, step)
        {
            var value = tools.validateGet(params, 'value'),
                option;
            if (step === null) {
                return false;
            }
            
            try {
                option = step.getOption(value);
            } catch (err) {
                if (err instanceof interactiveSession.error) {
                    return false;
                }
            }
            
            return true;
        },
        
        execute : function (params, previousStep, callback) {
            var value = tools.validateGet(params, 'value'),
                option = previousStep.getOption(value);
        
            if (option.type === 'system' && value === 'no') {
                interactiveSession.getDefault().clear(params.userId);
                callback(null, "Cool, try again later!", interactiveSession.createStep({}, true));
                return;
            }
            
        }
    });

module.exports = resolver;