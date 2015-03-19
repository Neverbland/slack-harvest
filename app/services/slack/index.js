/*jshint node: true*/
'use strict';

var _       = require('lodash'),
    request = require('request');


function _Slack (config)
{
    this.endpoint = config.endpoint;
    this.config = config; 
    if (!config.username) {
        this.config.username = _Slack.prototype.USER_AGENT;
    }
}


_Slack.prototype = {
    USER_AGENT : "Neverbland Slack - Harvest Integration Middleman",
    
    
    /**
     * Returns all slack user ids
     * 
     * @param       {Object}        userMap     A map of harvest id -> slack id
     * @returns     {undefined}
     */
    fromUserMap : function (userMap)
    {
        var results = [];
        for (var hId in userMap) {
            if (userMap.hasOwnProperty(hId)) {
                results.push(userMap[hId]);
            }
        }
        
        return results;
    },
    
    
    
    /**
     * Sets the available user ids for this instance of the service
     * 
     * @param       {Array}         users
     * @returns     {undefined}
     */
    setUsers : function (users)
    {
        this.users = users;
    },
    
    
    /**
     * Sends slack message
     * 
     * @param       {String}        text
     * @param       {Object}        config
     * @param       {Function}      callback    A callback taking err,
     *                                          httpResponse, body params
     * @returns     {undefined}
     */
    sendMessage : function (text, config, callback)
    {
        config = config || {};
        config = _.assign({
            text : text
        }, this.config, config);


        request.post(
            {
                url : this.endpoint,
                form : {
                    payload : JSON.stringify(config)
                }
            },
            (typeof callback === 'function') ? callback : function () {} 
        );
        
    } 
};
_Slack.prototype.constructor = _Slack;


/**
 * 
 * @type        {Object}        An object containing _Slack instances
 */
var instances = {};

/**
 * Creates a new instance if such instance does not exist. If exists, returns
 * the existing one.
 * 
 * @param   {String}    key
 * @param   {Object}    config
 * @returns {_Slack}
 */
module.exports = function (key, config)
{
    if (!!instances[key]) {
        return instances[key];
    } else {
        instances[key] = new _Slack(config);
        return instances[key];
    }
}