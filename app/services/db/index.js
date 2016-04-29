/*jshint node: true*/
'use strict';

var Sequelize   =   require('sequelize'),
    instances   =   {}
;

module.exports = function (key, config) {
    if (!!instances[key]) {
        return instances[key];
    }
    
    if (!config) {
        return null;
    }
    
    var storage = config.storage,
        accessConfig = config[storage],
        cnfg = (function () {
            var cnf = {
                host : accessConfig.host,
                dialect : storage,
                pool: {
                    max: 5,
                    min: 0,
                    idle: 10000
                  }
            };
            if (storage === 'sqlite') {
                cnf.storage = config.path;
            }
            return cnf;
        })(),
        dbDriver = new Sequelize(
            accessConfig.db,
            accessConfig.user, 
            accessConfig.password, 
            cnfg
        );
    ;
    
    instances[key] = dbDriver;
    
    return dbDriver;
};