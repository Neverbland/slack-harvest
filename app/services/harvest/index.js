/*jshint node: true*/
'use strict';

var harvest     =   require('harvest'),
    _           =   require('lodash');

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
        var Component = require('../../../node_modules/harvest/lib/' + component.toLowerCase() + '.js');
        return new Component(this.harvest);
    },
    
    
    
    
    
    /**
     * Returns all available projects if no callback provided.
     * 
     * @param       {Function}      callback
     * @return      {Object}
     */
    getProjects : function (callback)
    {
        if (this.projects === null) {
            this.projects = this.doGetProjects(callback);
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
        var projects = [];
        var notPresentIds = [];
        var that = this;
        
//        var promises = [];
//        _.each(ids, function(id) {
//            var def = Q.defer();
//            that.getProject(id, function(err, project) {
//               def.resolve(project);
//            });
//            promises.push(def.promise);
//        });
//        
//        Q.all(promises).then(function(projects) {
//            
//        });
        
        _.each(ids, function (id) {
            if (!!that.projects[id]) {
                projects.push(that.projects[id]);
            } else {
                notPresentIds.push(id);
            }
        });
        if (notPresentIds.length) {
            this.populate('getProject', 'projects', notPresentIds, projects, callback);
        } else {
            callback(null, projects);
        }
    },
    
    
    populate : function (methodName, cacheName, ids, resources, callback)
    {
        var id = ids.pop();
        var that = this;
        this[methodName].call(this, id, function (err, resource) {
            if (err === null) {
                that[cacheName][id] = resource;
                resources.push(resource);
            } else {
                console.log(err);
            }
            if (ids.length) {
                that.populate(methodName, cacheName, ids, resources, callback);
            } else {
                callback(null, resources);
            }
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
        var clients = [];
        var that = this;
        var notPresentIds = [];
        _.each(ids, function (id) {
            if (!!that.clients[id]) {
                clients.push(that.clients[id]);
            } else {
                notPresentIds.push(id);
            }
        });
        if (notPresentIds.length) {

            this.populate('getClient', 'clients', notPresentIds, clients, callback);
        } else {
            callback(null, clients);
        }
    },
    
    
    /**
     * Returns all available clients
     * 
     * @param       {Function}      callback
     * @return      {Object}
     */
    getClients : function (callback)
    {
        if (this.clients === null) {
            this.clients = this.doGetClients(callback);
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