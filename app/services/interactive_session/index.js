/*jshint node: true*/
'use strict';

var
        walk                = require('walk'),
        walker,
        interactiveSession  = require('./lib/user_session.js'),
        resolverConstructor = require('./lib/resolver.js'),
        resolver            = null,
        tools               = require('./../tools.js'),
        _                   = require('lodash'),
        timerTools          = require('./../timer'),
        StepTools           = require('./lib/step_tools.js'),
        errOutput           = 'Wrong input provided, try following the instructions...'
;


/**
 * Applies step prototype to given step provider 
 * and returns it back
 * 
 * @param   {Object}    stepProvider
 * @returns {Object}
 */
function stepProviderFactory (stepProvider)
{
    stepProvider.tools = new StepTools(stepProvider);
    return stepProvider;
}


if (resolver === null) {
    resolver = new resolverConstructor(interactiveSession.getDefault());
    

    // Step 1 provider
    resolver.addStepProvider(stepProviderFactory({
            
        getStepNumber : function () {
            return 1;
        },
        stepActionProviders: {},
        
        validate: function (params, step)
        {
            if (step === null) {
                return true;
            }

            return false;
        },
        execute: function (params, previousStep, callback) {

            var action = tools.validateGet(params, 'action'),
                that = this,
                stepAction = that.getStepAction(action),
                view
            ;

            if (action === null) {
                callback(null, this.createView(null), null);
                return;
            }


            stepAction.execute(params, function (err, step) {
                if (err !== null) {
                    callback(null, err, null);
                    return;
                } else {
                    stepAction.postExecute(step, function () {
                        view = that.createView(step);
                        callback(null, view, stepAction.prepareStep(step));
                    });
                }
            });
        },


        /**
         * Returns view provider depending on what the step params are
         * 
         * @param       {Object}    step
         * @returns     {String}
         */
        createView: function (step)
        {
            if (step === null) {
                return errOutput;
            }
            var action;
            try {
                action = step.getAction();
            } catch (err) {
                return errOutput;
            }

            try {
                var provider = tools.validateGet(this.stepActionProviders, action);
            } catch (err) {
                return errOutput;
            }

            return provider.getView(step);
        },

        getStepAction: function (action)
        {
            var stepActionProvider = this.stepActionProviders[action];
            return stepActionProvider ? stepActionProvider : null;
        }
    }));
    


    // Step 2 provider
    resolver.addStepProvider(stepProviderFactory({
        stepNumber: 1,
        
        getStepNumber : function () {
            return this.stepNumber + 1;
        },
        
        stepActionProviders : {},
        
        validate: function (params, step)
        {
            return this.tools.validate(this.stepNumber, step);
        },
        
        execute: function (params, previousStep, callback) {
            var value,
                option,
                action = previousStep.getAction(),
                that = this,
                stepAction = this.stepActionProviders[action],
                view
            ;
            
            try {
                value = tools.validateGet(params, 'value');
                option = previousStep.getOption(value);
            } catch (err) {
                callback(null, this.createView(null), null);
                return;
            }

            if (this.tools.isRejectResponse(option, value)) {
                this.tools.executeRejectResponse(params.userId, callback);
                return;
            }
            
            stepAction.execute(params, previousStep, function (returnMessage, step) {
                if (returnMessage !== null) {
                    callback(null, returnMessage, null);
                    return;
                } else {
                    step.addParam('selectedOption', option);
                    view = that.createView(step);
                    callback(null, view, step);
                }
            });
        },
        
        createView: function (step)
        {
            if (step === null) {
                return errOutput;
            }
            var action = step.getAction();
            return this.stepActionProviders[action].getView(step);
        }
    }));



    // Step 3 provider
    resolver.addStepProvider(stepProviderFactory({
        stepNumber: 2,
        
        getStepNumber : function () {
            return this.stepNumber + 1;
        },
        
        stepActionProviders : {},
        
        validate: function (params, step)
        {
            return this.tools.validate(this.stepNumber, step);
        },
        
        execute: function (params, previousStep, callback) {
            var value,
                option,
                stepAction = this.stepActionProviders[previousStep.getAction()],
                that = this,
                view
            ;
            
            try {
                value = tools.validateGet(params, 'value');
                option = previousStep.getOption(value);
            } catch (err) {}

            if (option && this.tools.isRejectResponse(option, value)) {
                this.tools.executeRejectResponse(params.userId, callback);
                return;
            }

            stepAction.execute(params, previousStep, function (returnMessage, step) {
                if (returnMessage !== null) {
                    callback(null, returnMessage.toString(), null);
                    return;
                } else {
                    step.addParam('selectedOption', option);
                    view = that.createView(step);
                    callback(null, view, step);
                }
            });
        },
        
        
        createView: function (step)
        {
            var action = step.getAction();
            return this.stepActionProviders[action].getView(step);
        }
    }));
}


walker  = walk.walk(__dirname + '/lib/actions', {
    followLinks : false 
});

// Load all actions

walker.on('file', function (root, stat, next) {
    var file                =   __dirname + '/lib/actions/' + stat.name,
        provider            =   require(file),
        action              =   provider.getActionName()
    ;   

    timerTools.addAvailableAction(action);
    _.each(resolver.stepProviders, function (stepProvider) {
        var actionProvider;
        if (stepProvider.getStepNumber() === 1) {
            actionProvider = provider.getStepOne();
        } else if (stepProvider.getStepNumber() === 2) {
            actionProvider = provider.getStepTwo();
        } else {
            actionProvider = provider.getStepThree();
        }


        stepProvider.stepActionProviders[action] = actionProvider;

    });

    next();
});
    

module.exports = resolver;