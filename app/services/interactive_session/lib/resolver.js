/*jshint node: true*/
'use strict';

var _               = require('lodash'),
    userSession     = require('./user_session.js'),
    consts          = require('../../../../consts.json'),
    logger          = require('./../../../services/logger.js')('default')
;

function Resolver (userSession, sessionTime)
{
    this.sessionTime = sessionTime || consts.userSession.lifeSpan;
    this.userSession = userSession;
    this.stepProviders = [];
    this.timeouts = {};
}

Resolver.prototype = {
    
    
    /**
     * Registers a step provider
     * 
     * @param           {Object}        stepProvider
     * @returns         {Resolver}      This instance
     */
    addStepProvider : function (stepProvider)
    {
        this.stepProviders.push(stepProvider);
        return this;
    },
    
    
    /**
     * Runs slack -> server dialogue step
     * 
     * @param       {Object}        params          The timer config
     * @param       {Function}      viewCallback    The callback that processes the view
     * @returns     {undefined}
     */
    runStep : function (params, viewCallback)
    {
        var userId = params.userId,
            previousStep = this.userSession.hasSession(userId) ? this.userSession.getStep(userId) : null,
            that = this,
            stepProvider = null
        ;

        _.each(this.stepProviders, function (provider) {
            if (stepProvider !== null) {
                return;
            } 

            if (provider.validate(params, previousStep)) {
                stepProvider = provider;
            }
        });
        
        if (stepProvider !== null) {
            stepProvider.execute(params, previousStep, function (err, view, newStep) {
                if (err === null) {
                    if (newStep !== null) {
                        that.userSession.addStep(userId, newStep);
                        that.addTimeout(userId);
                    }
                    viewCallback(null, view);
                } else {
                    viewCallback(err, view);
                }
            });
        }
    },
    
    
    /**
     * Adds a timeout to clear user session for given userId
     * 
     * @param       {Number}        userId
     * @returns     {undefined}
     */
    addTimeout : function (userId)
    {
        this.clearTimeout(userId);
        this.timeouts[userId] = setTimeout(function () {
            userSession
                    .getDefault()
                    .clear(userId)
            ;
            logger.info('Cleared user session for userId ' + userId, {});
        }, this.sessionTime);
        logger.info('Added user session for userId ' + userId, {});
    },
    
    
    /**
     * Clears the timeout for given userId
     * 
     * @param   {Number}        userId
     * @returns {undefined}
     */
    clearTimeout : function (userId)
    {
        if (!!this.timeouts[userId]) {
            clearTimeout(this.timeouts[userId]);
            delete this.timeouts[userId];
        }
    }
};

Resolver.prototype.constructor = Resolver;


module.exports = Resolver; // The constructor