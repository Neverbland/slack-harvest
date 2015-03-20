/*jshint node: true*/
'use strict';

var cron        =       require('cron'),
    notifier    =       require('./../notifier'),
    harvest     =       require('./../harvest')('default'),
    _           =       require('lodash'),
    tools       =       require('./../tools.js'),
    logger      =       require('./../logger.js')('default');
    
  

module.exports = function (app, config) {

    var cronJobs = require('./lib/jobs.js')(config);
    cronJobs.run();
};