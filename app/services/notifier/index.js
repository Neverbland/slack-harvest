/*jshint node: true*/
'use strict';

var _ = require('lodash');


/**
 * Notifier module provides an aggregator for notifiers that
 * take a context object and send notifications
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * @constructor
 */
var Notifier = function () 
{
    this.notifiers = [];
}


Notifier.prototype = {
    
    /**
     * Registers a notifier
     * 
     * @param       {Object}        notifier
     * @returns     {Notifier}      This instance
     */
    addNotifier : function (notifier)
    {
        this.notifiers.push(notifier);
        return this;
    },
    
    
    /**
     * Runs all aggregated notifiers
     * 
     * @param       {Object}        context
     * @returns     {Notifier}      This instance
     */
    notify : function (context)
    {
        _.each(this.notifiers, function (notifier) {
            notifier.notify(context);
        });
        
        return this;
    }
};

Notifier.prototype.constructor = Notifier;


module.exports = new Notifier();