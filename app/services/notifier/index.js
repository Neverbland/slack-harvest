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
    this.notifiers = {};
}


Notifier.prototype = {
    
    /**
     * Registers a notifier
     * 
     * @param       {String}        channel         The notification channel name
     * @param       {Object}        notifier
     * @returns     {Notifier}      This instance
     */
    addNotifier : function (channel, notifier)
    {
        this.notifiers[channel] = this.notifiers[channel] || [];
        this.notifiers[channel].push(notifier);
        
        return this;
    },
    
    
    /**
     * Runs all aggregated notifiers
     * 
     * @param       {Object}        context
     * @param       {String}        channel         The notification channel name
     * @returns     {Notifier}      This instance
     */
    notify : function (channel, context)
    {
        this.notifiers[channel] = this.notifiers[channel] || [];
        _.each(this.notifiers[channel], function (notifier) {
            notifier.notify('users', context);
        });
        
        return this;
    }
};

Notifier.prototype.constructor = Notifier;


module.exports = new Notifier();