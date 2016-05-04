/*jshint node: true*/
'use strict';

var 
    Q           =       require('q'),
    _           =       require('lodash'),
    logger      =       require('./../../app/services/logger')('default'),
    i18n        =       require('i18n'),
    sequelize   =       require('./../../app/services/db/index')('default'),
    Config      =       require('./../model/config')('default', sequelize),
    formatResults = function (results) {
        var returnResults = {};
        _.each(results, function (result) {
            
            var name = result.name,
                value = result.value,
                resultObject = Config.buildObject(value, name)
            ;
            
            logger.log(i18n.__('Merged config for {{name}} with value {{value}}', {
                name : name,
                value : value
            }), {});
            
            _.defaultsDeep(returnResults, resultObject);
        });
        
        return returnResults;
    },
    provider    =       {
        
        merge : function (config, defer) {
            Config.sync({
                force : false
            }).then(function () {
                Config
                    .findAll()
                    .then(function (results) {
                        var resultsParsed = formatResults(results);
                        _.merge(config, resultsParsed);
                        defer.resolve();
                    })
                ;
            });
        }
    }
;


module.exports = function (config)
{
    var def = Q.defer();
    if (!Config) {
        def.resolve();
        return def.promise;
    }
    
    provider.merge(config, def);
    
    return def.promise;
};
