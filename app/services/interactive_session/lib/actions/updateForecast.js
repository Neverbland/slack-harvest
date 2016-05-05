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
            throw new Error(i18n.__('Invalid parameter name!'));
        }
    }
;

forecastScheduleProvider = new StepProvider('updateForecast');
forecastScheduleProvider.addStep(1, {
    execute : function (params, callback)
    {
        
        var 
            step,
            action = tools.validateGet(params, 'action'),
            userId = params.userId,
            error = null,
            name = (function (params) {
                var nameParts,
                    name
                ;
                try {
                    nameParts = tools.validateGet(params, 'name').split(' ');
                    name = nameParts[0];
                } catch (err) {
                    error = err;
                    return null;
                }
                try {
                    return validateName(name);
                } catch (err) {
                    error = err;
                    return null;
                }
            })(params),
            validateAccountId = function (value) {
                var regex = /^[0-9]{5,6}$/,
                    isValid = regex.test(value)
                ;
                if (!isValid) {
                    throw new Error(i18n.__('Invalid account ID!'));
                }
                
                return value;
            },
            validateToken = function (value) {
                var regex = /^(Bearer )([0-9]{5}.)([a-zA-Z0-9\-\_]{86})$/,
                    isValid = regex.test(value)
                ;
                if (!isValid) {
                    throw new Error(i18n.__('Invalid Token!'));
                }
                
                return value;
            },
            validateValue = function (value, name) {
                switch (name) {
                    case validNames[0]:
                        return validateAccountId(value);
                    case validNames[1]:
                        return validateToken(value);
                }
            },
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
                    error = err;
                    return null;
                }
                try {                
                    return validateValue(value, name);
                } catch (err) {
                    error = err;
                    return null;
                }
            })(params),        
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
            callback(error.message, null);
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