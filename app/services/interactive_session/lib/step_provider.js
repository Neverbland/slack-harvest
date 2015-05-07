/*jshint node: true*/
'use strict';

function StepProvider (action)
{
    this.action = action;
    this.steps = [];
}


StepProvider.prototype = {
    
    
    /**
     * Registers step callback
     * 
     * @param           {Number}            step
     * @param           {Object}            stepActionProvider
     * @returns         {StepProvider}
     */
    addStep : function (step, stepActionProvider)
    {
        this.steps[step] = stepActionProvider;
        return this;
    },
    
    
    /**
     * Provides step
     * 
     * @param       {Number}            step
     * @returns     {Object|null}
     */
    getStep : function (step)
    {
        var stepCallback = !!this.steps[step] ? this.steps[step] : null;
        return stepCallback;
    },
    
    
    /**
     * Returns the action name
     * 
     * @returns     {String}
     */
    getActionName : function ()
    {
        return this.action;
    }
    
};

StepProvider.prototype.constructor = StepProvider;

module.exports = StepProvider;