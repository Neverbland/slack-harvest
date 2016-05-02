/*jshint node: true*/
'use strict';

var 
    forecastScheduleProvider,
    interactiveSession  =   require('./../user_session.js'),
    tools               =   require('./../../../tools.js'),
    _                   =   require('lodash'),
    Config              =   require('./../../../../../config/model/config')('default'),
    i18n                =   require('i18n'),
    logger              =   require('./../../../logger.js')('default'),
    StepProvider        =   require('./../step_provider.js'),
    forecast,
    validNames          =   [
        'accountId', 
        'authorization'
    ],
    validateName        =   function (name) {
        if (_.indexOf(validNames, name) !== -1) {
            return name;
        } else {
            return false;
        }
    }
;

forecastScheduleProvider = new StepProvider('updateForecast');
forecastScheduleProvider.addStep(1, {
    execute : function (params, callback)
    {
        
        var 
            action = tools.validateGet(params, 'action'),
            userId = params.userId,
            name = (function (params) {
                var nameParts,
                    name
                ;
                try {
                    nameParts = tools.validateGet(params, 'name').split(' ');
                    name = nameParts[0];
                } catch (err) {
                    return null;
                }
                
                if (!validateName(name)) {
                    return null;
                }
                
                return name;
            })(params),
            value = (function (params) {
                var nameParts,
                    value,
                    name
                ;
                
                try {
                    nameParts = tools.validateGet(params, 'name').split(' ');
                    name = nameParts.shift();
                    value = nameParts.join(' ');
                } catch (err) {
                    return null;
                }
                                
                return value;
            })(params),
            step,        
            handleCallback = function () {
                step = interactiveSession
                            .getDefault()
                            .createStep(userId, {}, action)
                ;
                
                Config.getConfigMatching('forecast', function (result) {
                    forecast = require('./../../../forecast/index')('default', result, true);
                    callback(null, step);
                });
            }
        ;
        
        if (!name || !value) {
            callback(i18n.__('Invalid parameter name/value provided!'), null);
            return;
        }
        
        if (!Config) {
            callback(i18n.__('Config storage not available!'), null);
            return;
        }
        
        Config.find({
            where : {
                name : 'forecast.' + name
            }
        }).then(function (record) {
            if (record) {
                record.updateAttributes({
                    value : value
                }).then(function () {
                    logger.log(i18n.__('Updated config record for {{name}} with value {{value}}', {
                        name : 'forecast.' + name,
                        value : value
                    }), {});
                    handleCallback();
                });
            } else {
                Config.create({
                    name : name,
                    value : value
                }).then(function () {
                    logger.log(i18n.__('Created new config record for {{name}} with value {{value}}', {
                        name : 'forecast.' + name,
                        value : value
                    }), {});
                    handleCallback();
                });
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
        return [
            "",
            i18n.__('Successfully updated forecast setting.'),
            ""
        ].join("\n");
    }
});

module.exports = forecastScheduleProvider; 