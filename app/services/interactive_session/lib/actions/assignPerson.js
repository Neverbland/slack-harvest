/*jshint node: true*/
'use strict';

var 
    assignPersonProvider,
    interactiveSession  =   require('./../user_session.js'),
    tools               =   require('./../../../tools.js'),
    _                   =   require('lodash'),
    Config              =   require('./../../../../../config/model/config'),
    i18n                =   require('i18n'),
    logger              =   require('./../../../logger.js')('default'),
    StepProvider        =   require('./../step_provider.js'),
    slack               =   require('./../../../slack/index')('default'),
    harvest             =   require('./../../../harvest/index')('default'),
    /**
     * Validates the slack name
     * 
     * @param   {String}    slackName       The slack name to validate
     */
    validateSlackName = function (slackName) {
        var regex = /[a-zA-Z_\.]+/,
            isValid = regex.test(slackName)
        ;
        
        return isValid;
    },
    validateHarvestId = function (harvestId) {
        return !isNaN(parseInt(harvestId));
    }
;

assignPersonProvider = new StepProvider('assignPerson');
assignPersonProvider.addStep(1, {
    execute : function (params, callback)
    {
        
        var 
            action = tools.validateGet(params, 'action'),
            userId = params.userId,
            slackName = (function (params) {
                var nameParts,
                    name
                ;
                try {
                    nameParts = tools.validateGet(params, 'name').split(' ');
                    name = nameParts[0];
                } catch (err) {
                    return null;
                }
                
                return validateSlackName(name);
            })(params),
            harvestId = (function (params) {
                var nameParts,
                    id,
                    name
                ;
                
                try {
                    nameParts = tools.validateGet(params, 'name').split(' ');
                    name = nameParts.shift();
                    id = nameParts.join(' ');
                } catch (err) {
                    return null;
                }
                                
                return validateHarvestId(id);
            })(params),
            step,        
            handleCallback = function () {
                step = interactiveSession
                            .getDefault()
                            .createStep(userId, {}, action)
                ;
                
                Config.getConfigMatching('users', function (results) {
                    harvest.setUsers(results);
                    callback(null, step);
                });
            }
        ;
        
        if (!slackName) {
            callback(i18n.__('Invalid parameter slackName provided!'), null);
            return;
        }
        
        if (!harvestId) {
            callback(i18n.__('Invalid parameter harvestId provided!'), null);
            return;
        }
        
        if (!Config) {
            callback(i18n.__('Config storage not available!'), null);
            return;
        }
        
        Config.find({
            where : {
                name : 'users.' + harvestId
            }
        }).then(function (record) {
            if (record) {
                record.updateAttributes({
                    value : slackName
                }).then(function () {
                    logger.log(i18n.__('Updated config record for {{name}} with value {{value}}', {
                        name : 'users.' + harvestId,
                        value : slackName
                    }), {});
                    handleCallback();
                });
            } else {
                Config.create({
                    name : 'forecast.' + harvestId,
                    value : slackName
                }).then(function () {
                    logger.log(i18n.__('Created new config record for {{name}} with value {{value}}', {
                        name : 'users.' + harvestId,
                        value : slackName
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
            i18n.__('Successfully updated user mapping setting.'),
            ""
        ].join("\n");
    }
});

module.exports = assignPersonProvider; 