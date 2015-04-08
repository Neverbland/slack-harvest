/*jshint node: true*/
'use strict';

var _ = require('lodash');

function Resolver (userSession)
{
    this.userSession = userSession;
    this.stepProviders = [];
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
     * 
     * @param       {Object}        params          The timer config
     * @param       {Function}      viewCallback    The callback that processes the view
     * @returns     {undefined}
     */
    getStep : function (params, viewCallback)
    {
        var userId = params.userId,
            previousStep = this.userSession.hasSession(userId) ? this.userSession.getStep(userId) : null,
            that = this,
            stepProvider = null;

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
                    }
                    viewCallback(null, view);
                } else {
                    viewCallback(err, view);
                }
            });
        }
    }
};

Resolver.prototype.constructor = Resolver;


module.exports = {
    resolver : Resolver
}; // The constructor