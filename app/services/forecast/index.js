/*jshint node: true*/
'use strict';

var Forecast    =   require('forecast-api'),
    _           =   require('lodash'),
    Q           =   require('q'),
    logger      =   require('./../logger.js')('default'),
    i18n        =   require('i18n'),
    instances   =   {}
;


/**
 * Explodes the resources array by id
 * 
 * @param       {Array}     resources
 * @return      {Object}
 */
function byId (resources)
{
    var results = {};
    _.each(resources, function (resourceObject) {
        var id = resourceObject.id;
        results[id] = resourceObject;
    });
    
    return results;
}


function ForecastWrapper (config)
{
    this.config = config;
    this.forecast = new Forecast(config); 
}


ForecastWrapper.prototype = {
    
    caches : {
        projects : null,
        clients : null,
        people: null
    },
    
    /**
     * Wrapper function for assignments API call
     * 
     * @param       {Object}        options
     * @param       {Function}      callback
     * @returns     {undefined}
     */
    assignments : function (options, callback) {
        var that = this;
        this.forecast.assignments(options, function (err, assignments) {
            if (err) {
                callback(err, assignments);
            } else {
                that.mergeAssignments(assignments, callback);
            }
        });
    },
    
    /**
     * 
     */ 
    mergeAssignments : function (assignments, callback) {
        var that = this;
        this.preload(false, function () {
            that.doMerge(assignments, callback);
        });        
    },
    
    
    /**
     * Preloading clients, projects and people
     * 
     * @param       {Boolean}       force
     * @param       {Function}      callback
     * @returns     {undefined}
     */
    preload : function (force, callback) {
        var promises = [],
            that = this
        ;
        _.each(this.caches, function (values, key) {
            var def = Q.defer();
            
            if ((values === null) || force) {
                that.doPreload(key, function (valuesFromApi) {
                    that.caches[key] = valuesFromApi;
                    def.resolve(valuesFromApi);
                });
            } else {
                def.resolve(values);
                
            }
            promises.push(def.promise);
        });

        Q.all(promises).then(function (items) {
            if (callback) {
                callback();
            }
        }, function (err) {
            console.log(err);
        }).catch(function () {
            console.log(Array.prototype.slice.call(arguments));
        });
    },
    
    
    doPreload : function (key, callback) {
        var that = this;
        this.forecast[key].call(that.forecast, function (err, items) {
            if (err) {
                logger.log(i18n.__('Not able to load forecast resource for method {{methodName}}', {
                    methodName : key
                }), err, {});
                callback(null);
            } else {
                callback(items);
            }
        });
    },
    
    
    doMerge : function (assignments, callback) {
        var projects = this.caches.projects,
            clientsById = byId(this.caches.clients),
            projectsById,
            peopleById = byId(this.caches.people)
        ;
        
        _.each(projects, function (project) {
            var clientId = project.client_id,
                client = clientsById[clientId] || null
            ;
            project.client = client;
        });
        
        projectsById = byId(projects);
        
        
        _.each(assignments, function (assignmentObject) {
            var projectId = assignmentObject.project_id,
                personId = assignmentObject.person_id
            ;
            assignmentObject.project = projectsById[projectId] || null;
            assignmentObject.person = peopleById[personId] || null;
        });
        
        callback(null, assignments);
    }
};


ForecastWrapper.prototype.constructor = ForecastWrapper;

/**
 * Creates a new instance if such instance does not exist. If exists, returns
 * the existing one.
 * 
 * @param   {String}    key
 * @param   {Object}    config
 * @returns {Harvest}
 */
module.exports = function (key, config)
{
    if (!!instances[key]) {
        return instances[key];
    } else {
        if (!!config && !!config.accountId && !!config.authorization) {
            instances[key] = new ForecastWrapper(config);
            return instances[key];
        }
        
        return null;
    }
};