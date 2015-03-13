/*jshint node: true*/
'use strict';

var cron        =       require('cron'),
    notifier    =       require('./../notifier'),
    harvest     =       require('./../harvest')('default'),
    _           =       require('lodash'),
    logger      =       require('./../logger.js')('default');
    
    
    function autoNotify ()
    {
        _.each(harvest.fromUserMap(harvest.users), function (userId) {
            logger.info('Trying to send notifications to user: ', userId);
            harvest.getUserTimeTrack(userId, new Date(), new Date(), function (err, harvestResponse) {
                if (err === null) {
                    notifier.notify({
                        harvestUserId : userId,
                        harvestResponse : harvestResponse
                    });
                } else {
                    logger.error("Failed fetching user timeline from Harvest API for user " + userId, err);
                }
            });
        });
    }
    
    
    function getInfo ()
    {
        logger.info('Loading projects from Harvest API...');
        harvest.doGetProjects();
        logger.info('Loading clients from Harvest API...');
        harvest.doGetClients();
    }
    

module.exports = function (app, config) {
    // Every work day at 16.30 send slack notification
    // Setting up cron
    var cronTime1 = '00 ' + config.notify.munutes + ' ' + config.notify.hour + ' * * 1-5';
    var CronJob = cron.CronJob;
    logger.info('Setting up cron job for auto notifications with cron time: ', cronTime1);
    var job1 = new CronJob(cronTime1, autoNotify);
    
    job1.start();
    
    var cronTime2 = '00 00 7-20 * * 1-5';
    logger.info('Setting up cron job for auto fetching clients and projects from Harvest API with cron time: ', cronTime1);
    // Every hour refresh the list of clients and projects
    var job2 = new CronJob(cronTime2, getInfo);
    job2.start();
    
    getInfo();
};