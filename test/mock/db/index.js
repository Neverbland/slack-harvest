/*jshint node: true*/
'use strict';

var Sequelize   =   require('sequelize'),
    storage,
    accessConfig,
    cnfg,
    dbDriver
;

module.exports = function (path) {
        storage = 'sqlite',
        accessConfig = {
            db : '',
            user : '',
            password : ''
        },
        cnfg = {
            host : 'localhost',
            dialect : storage,
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            },
            storage : path
        },
        dbDriver = new Sequelize(
            accessConfig.db,
            accessConfig.user, 
            accessConfig.password, 
            cnfg
        );
    ;
    
    return dbDriver;
};