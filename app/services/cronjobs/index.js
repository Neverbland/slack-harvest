/*jshint node: true*/
'use strict';

var cron        =       require('cron'),
    notifier    =       require('./../notifier'),
    harvest     =       require('./../harvest')('default'),
    _           =       require('lodash'),
    tools       =       require('./../tools.js'),
    logger      =       require('./../logger.js')('default');
    
/**
 * Defines some constants
 * 
 * @type {Object}
 */
var consts = {
    preload : {
        CRON_TIME : '00 00 7-20 * * 1-5'
    },
    report : {
        CRON_TIME : '00 00 20 * * 5',
        DEFAULT_REPORT_TITLE : "Weekly activity report",
        DATE_FROM_TEXT : "last monday",
        DATE_TO_TEXT : "+ 0 hours"
    }
};

module.exports = function (app, config) {

    if (!!config.notify) {
        
        var autoNotify = function ()
        {
            _.each(harvest.fromUserMap(harvest.users), function (userId) {
                logger.info('Trying to send notifications to user: ' + userId, {});
                harvest.getUserTimeTrack(userId, new Date(), new Date(), function (err, harvestResponse) {
                    if (err === null) {
                        notifier.notify('users', {
                            harvestUserId : userId,
                            harvestResponse : harvestResponse
                        });
                    } else {
                        logger.error("Failed fetching user timeline from Harvest API for user " + userId, err, {});
                    }
                });
            });
        };
    
        /* 
         * Every work day at 16.30 send slack notification to all users
         */
        var cronTime1;
        if (!config.notify.cronTime) {
            cronTime1 = '00 ' + config.notify.minutes + ' ' + config.notify.hour + ' * * 1-5';
        } else {
            cronTime1 = config.notify.cronTime;
        }
        var CronJob = cron.CronJob;
        logger.info('Setting up cron job for auto notifications with cron time: ', cronTime1, {});
        var job1 = new CronJob(cronTime1, autoNotify);

        job1.start();
    }
    
    
    if (config.preload) {
        var  preloadApiData = function ()
        {
            logger.info('Loading projects from Harvest API...', {});
            harvest.doGetProjects();
            logger.info('Loading clients from Harvest API...', {});
            harvest.doGetClients();
        };
        
        /**
         * Every period populate the projects and clients with fresh data from the
         * Harvest API
         */
        var cronTime2 = !!config.preload.cronTime 
                            ?   config.preload.cronTime 
                            :   consts.preload.CRON_TIME;   // by default every hour, every week day, from 7am to 8pm
        logger.info('Setting up cron job for auto fetching clients and projects from Harvest API with cron time: ', cronTime2, {});
        // Every hour refresh the list of clients and projects
        var job2 = new CronJob(cronTime2, preloadApiData);
        job2.start();

        preloadApiData();
    }
    
    
    
    if (config.report) {
        var dateFrom = config.report.dateFromText || consts.report.DATE_FROM_TEXT,
            dateTo = config.report.dateToText || consts.report.DATE_TO_TEXT,
            prepareReport = function ()
            {

                var dateFromObject = tools.dateFromString(dateFrom),
                    dateToObject = tools.dateFromString(dateTo);
                
                logger.info('Preparing management report from: ' + dateFromObject + ' to ' + dateToObject, {});
                notifier.notify('management', {
                    reportTitle : config.report.reportTitle || consts.report.DEFAULT_REPORT_TITLE,
                    channel : config.report.channel,
                    fromDate : dateFromObject,
                    toDate : dateToObject
                });
            },
        
            cronTime3 = !!config.report.cronTime 
                            ?   config.report.cronTime 
                            :   consts.report.CRON_TIME,   // by default every hour, every week day, from 7am to 8pm;              
            job3 = new CronJob(cronTime3, prepareReport);
        
        logger.info('Setting up cron job for auto management notifications: ', cronTime3, {});
        job3.start();
        prepareReport();
    }
};