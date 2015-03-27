/*jshint node: true*/
'use strict';

var harvest     =   require('harvest'),
    _           =   require('lodash'),
    tools       =   require('./../tools.js'),
    logger      =   require('./../logger.js'),
    humps       =   require('humps'),
    Q           =   require('q');

/**
 * Takes the Date object and formats it to YYYYMMDD
 * 
 * @param       {Date}      date
 * @returns     {String}
 */
function formatDate (date)
{
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
    var dd = date.getDate().toString();
    
    return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]); // padding
}

function _Harvest (config)
{
    this.harvest = new harvest({
        subdomain : config.subdomain,
        email : config.email,
        password : config.password,
        identifier : config.identifier,
        secret : config.secret,
        user_agent : this.USER_AGENT
    });
    this.users = [];
    this.clients = {};
    this.projects = {};
}


/**
 * Explodes the resources array by id
 * 
 * @param       {Array}     resources
 * @param       {String}    mainKey
 * @return      {Object}
 */
function byId (resources, mainKey)
{
    var results = {};
    _.each(resources, function (resourceObject) {
        var resource = resourceObject[mainKey];
        var id = resource.id;
        results[id] = resourceObject;
    });
    
    return results;
}


_Harvest.prototype = {
    USER_AGENT : "Neverbland Slack - Harvest Integration Middleman",
    
    /**
     * Provides harvest entries for given user
     * 
     * @param   {Number}        user_id
     * @param   {Date}          fromDate
     * @param   {Date}          toDate
     * @param   {Function}      callback    The callback that takes
     *                                      the error and returned data
     */
    getUserTimeTrack : function (user_id, fromDate, toDate, callback) 
    {
        var reports = this.load('Reports');
        reports.timeEntriesByUser({
            user_id : user_id,
            from : formatDate(fromDate),
            to : formatDate(toDate)
        }, callback);
    },
    
    load : function (component) 
    {   
        var Component = require('../../../node_modules/harvest/lib/' + this.decamelize(component) + '.js');
        return new Component(this.harvest);
    },
    
    
    /**
     * Turns a camel case string into a dash separated string
     * 
     * @param       {String}    inputString
     * @returns     {String}
     */
    decamelize : function (inputString)
    {
        return humps.decamelize(inputString, '-');
    },
    
    
    
    /**
     * Passes loaded projects to callback
     * 
     * @param       {Function}      callback
     * @param       {Boolean}       force
     * @return      {Object}
     */
    getProjects : function (callback, force)
    {
        force = force || false;
        if (force || (this.projects === {})) {
            this.doGetProjects(callback);
        } else {
            callback(null, this.projects);
        }
    },
    
    
    doGetProjects : function (callback)
    {
        var that = this;
        callback = callback || function() {};
        var projects = this.load('Projects');
        projects.list({}, function (err, results) {
            if (err === null) {
                that.projects = _.assign(that.projects, byId(results, 'project'));
            } else {
                logger.log('Not able to load all projects.', err, {});
            }
            callback(err, results);
        });
    },
    
    
    /**
     * Fetches all projects by given ids one by one. If some already exists and is
     * stored in the app, fetches it from the app storage.
     * 
     * @param       {Array}         ids         An array of ids
     * @param       {Function}      callback    The callback that takes the error
     *                                          and projects
     */
    getProjectsByIds : function (ids, callback)
    {
        this.populate('getProject', 'projects', ids, callback);
    },
    
    
    populate : function (methodName, cacheName, ids, callback)
    {
        var that = this;
        var promises = [];
        if (!ids.length) {
            callback(null, ids);
            return; // No need to do anything for an empty request
        }
        _.each(ids, function (id) {
            var def = Q.defer();
            if (!!that[cacheName][id]) {
                def.resolve(that[cacheName][id]);
            } else {
                that[methodName].call(that, id, function (err, resource) {
                    if (err !== null) {
                        logger.log('Not able to load resource for method ' + methodName +  ', id: ' + id, err, {});
                        def.resolve(null);
                    } else {
                        that[cacheName][id] = resource;
                        def.resolve(resource);
                    }
                });
            }
            promises.push(def.promise);
        });

        Q.all(promises).then(function (items) {
            
            var validItems = [];
            _.each(items, function (item) {
                if (item !== null) {
                    validItems.push(item);
                }
            });
            callback(null, items);
        });
    },
    
    
    /**
     * Fetches all clients by given ids one by one. If some already exists and is
     * stored in the app, fetches it from the app storage.
     * 
     * @param       {Array}         ids         An array of ids
     * @param       {Function}      callback    The callback that takes the error
     *                                          and clients
     */
    getClientsByIds : function (ids, callback)
    {
        this.populate('getClient', 'clients', ids, callback);
    },
    
    
    /**
     * Runs callback on loaded clients
     * 
     * @param       {Function}      callback
     * @param       {Boolean}       force
     * @return      {Object}
     */
    getClients : function (callback, force)
    {
        if (force || (this.clients === {})) {
            this.doGetClients(callback);
        } else {
            callback(null, this.clients);
        }
    },
    
    
    /**
     * Fetches client for given client id and applies callback on it
     * 
     * @param       {Number}        clientId
     * @param       {Function}      callback        Callback takes err and resource
     *                                              (client) as params
     */
    getClient : function (clientId, callback)
    {
        var that = this;
        this.clients = this.clients || {};
        var clients = this.load('Clients');
        clients.get({
            id : clientId
        }, function (err, results) {
            if (err === null) {
                that.clients[clientId] = results;
            }
            callback(err, results);
        });
    },
    
    
    /**
     * Fetches project for given project id and applies callback on it
     * 
     * @param       {Number}        projectId
     * @param       {Function}      callback        Callback takes err and resource
     *                                              (project) as params
     */
    getProject : function (projectId, callback)
    {
        var that = this;
        this.projects = this.projects || {};
        var projects = this.load('Projects');
        projects.get({
            id : projectId
        }, function (err, results) {
            if (err === null) {
                that.projects[projectId] = results;
            }
            
            callback(err, results);
        });
    },
    
    
    doGetClients : function (callback)
    {
        var that = this;
        callback = callback || function (){};
        var clients = this.load('Clients');
        clients.list({}, function (err, results) {
            if (err === null) {
                that.clients = _.assign(that.clients, byId(results, 'client'));
            } else {
                logger.log('Not able to load all clients.', err, {});
            }
            callback(err, results);
        });
    },
    
    
    /**
     * Loads all user daily tasks and performs a callback on the results
     * 
     * @param       {Number}        userId      The integer value of the user id
     * @param       {Function}      callback
     * @returns     {undefined}
     */
    getTasks : function (userId, callback)
    {
        var timeTrack = this.load('TimeTracking');
        timeTrack.daily({
            of_user : userId
        }, function (err, results) {
            if (err !== null) {
                logger.log('Not able to load tasks for user ' + userId, err, {});
            } 
            callback(err, results);
        });
    },
    
    
    /**
     * Returns all harvest user ids
     * 
     * @param       {Object}        userMap     A map of harvest id -> slack id
     * @returns     {undefined}
     */
    fromUserMap : function (userMap)
    {
        var results = [];
        for (var hId in userMap) {
            if (userMap.hasOwnProperty(hId)) {
                results.push(hId);
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
    }
};
_Harvest.prototype.constructor = _Harvest;


/**
 * 
 * @type        {Object}        An object containing _Harvest instances
 */
var instances = {};

/**
 * Creates a new instance if such instance does not exist. If exists, returns
 * the existing one.
 * 
 * @param   {String}    key
 * @param   {Object}    config
 * @returns {_Harvest}
 */
module.exports = function (key, config)
{
    if (!!instances[key]) {
        return instances[key];
    } else {
        instances[key] = new _Harvest(config);
        return instances[key];
    }
}