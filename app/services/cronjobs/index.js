/*jshint node: true*/
'use strict';

var cron = require('cron'),
    notifier = require('./../notifier'),
    harvest = require('./../harvest')('default'),
    _ = require('lodash');
    
    
    function autoNotify ()
    {
        _.each(harvest.fromUserMap(harvest.users), function (userId) {
            harvest.getUserTimeTrack(userId, new Date(), new Date(), function (err, harvestResponse) {
                if (err === null) {
                    notifier.notify({
                        harvestUserId : userId,
                        harvestResponse : harvestResponse
                    });
                } else {
                    // Notify about error
                }
            });
        });
    }
    
    
    function getInfo ()
    {
        harvest.doGetProjects();
        harvest.doGetClients();
    }
    

module.exports = function (app, config) {
    // Every work day at 16.30 send slack notification
    // Setting up cron
    var CronJob = cron.CronJob;
    var job1 = new CronJob('00 ' + config.notify.munutes + ' ' + config.notify.hour + ' * * 1-5', autoNotify);
    
    job1.start();
        
    // Every hour refresh the list of clients and projects
    var job2 = new CronJob('00 00 7-20 * * 1-5', getInfo);
    job2.start();
    
    getInfo();
};