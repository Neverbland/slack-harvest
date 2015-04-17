/*jshint node: true*/
'use strict';

var notifier    =       require('./../../notifier'),
    harvest     =       require('./../../harvest')('default'),
    _           =       require('lodash'),
    tools       =       require('./../../tools.js'),
    logger      =       require('./../../logger.js')('default'),
    CronJob     =       require('cron').CronJob,
    consts      =       require('./../../../../consts.json'),
    reminder    =       require('./../../reminder/index.js')
;
    
    
/**
 * Constructs a JobsHolder instance
 * 
 * @returns         {undefined}
 * @constructor
 * @author          Maciej Garycki <maciej@neverbland.com>
 */
function JobsHolder () 
{
    this.jobs = [];
}


JobsHolder.prototype = {
    
    /**
     * Adds a job
     * 
     * @param       {Object}        job
     * @param       {Object}        jobConfig       This particular job config
     * @return      {JobsHolder}    This instance
     */
    addJob : function (job, jobConfig)
    {
        this.jobs.push({
            job : job,
            config : jobConfig
        });
        return this;
    },
    
    /**
     * Runs the jobs
     * 
     * @return      {JobsHolder}    This instance
     */
    run : function ()
    {
        _.each(this.jobs, function (jobObject) {
            var job = jobObject.job,
                config = jobObject.config,
                cronTime = job.getCronTime(config),
                handler = job.getJob(config),
                description = job.getDescription(),
                autoRun = job.shouldRunNow();
                
            logger.info('Setting up cron job for: "' + description + '" with cron time: ', cronTime, {});
            
            var job = new CronJob(cronTime, handler);
            job.start();
            if (autoRun) {
                logger.info('Immediately executing cron job for: "' + description + '".', {});
                handler();
            }
        });
        
        return this;
    }
    
};

JobsHolder.prototype.constructor = JobsHolder;

var defaultJobs = {
    notify : {
        
        /**
         * Returns the job function
         * 
         * @param   {Object}    config
         * @returns {Function}
         */
        getJob : function (config) 
        {
            return function ()
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
        },
        
        /**
         * Formats the cron time according to given config
         * 
         * @param       {Object}        config
         * @returns     {String}        The cron time format string
         */
        getCronTime : function (config)
        {
           /* 
            * Every work day at XX:XX send slack notification to all users
            */
           var cronTime;
           if (!config.cronTime) {
               cronTime = '00 ' + config.minutes + ' ' + config.hour + ' * * 1-5';
           } else {
               cronTime = config.cronTime;
           }
           
           return cronTime;
        },
        
        /**
         * Defines if given job should be ran independently from setting it up
         * with cron
         * 
         * @returns {Boolean}
         */
        shouldRunNow : function ()
        {
            return false;
        },
        
        
        /**
         * Returns description of the task
         * 
         * @returns {String}
         */
        getDescription : function ()
        {
            return 'Automatic notifications of harvest users on their Slack channels';
        }
    },
    
    preload : {
        /**
         * Returns the job function
         * 
         * @param   {Object}    config
         * @returns {Function}
         */
        getJob : function (config) 
        {
            return function ()
            {
                logger.info('Loading projects from Harvest API...', {});
                harvest.doGetProjects();
                logger.info('Loading clients from Harvest API...', {});
                harvest.doGetClients();
            };
        },
        
        /**
         * Formats the cron time according to given config
         * 
         * @param       {Object}        config
         * @returns     {String}        The cron time format string
         */
        getCronTime : function (config)
        {
        
            return !!config.cronTime 
                            ?   config.cronTime 
                            :   consts.preload.CRON_TIME;
        },
        
        /**
         * Defines if given job should be ran independently from setting it up
         * with cron
         * 
         * @returns {Boolean}
         */
        shouldRunNow : function ()
        {
            return true;
        },
        
        
        /**
         * Returns description of the task
         * 
         * @returns {String}
         */
        getDescription : function ()
        {
            return 'Automatic periodical fetching clients and projects from Harvest API';
        }
    },
    
    report : {
        /**
         * Returns the job function
         * 
         * @param   {Object}    config
         * @returns {Function}
         */
        getJob : function (config) 
        {
            var dateFrom    = config.dateFromText || consts.report.DATE_FROM_TEXT,
                dateTo      = config.dateToText || consts.report.DATE_TO_TEXT;
        
            return function ()
            {
                var dateFromObject  = tools.dateFromString(dateFrom),
                    dateToObject    = tools.dateFromString(dateTo),
                    reportTitle     = config.reportTitle || consts.report.DEFAULT_REPORT_TITLE;
                
                logger.info('Preparing management report from: ' + dateFromObject + ' to ' + dateToObject, {});
                notifier.notify('management', {
                    reportTitle : reportTitle,
                    channel : config.channel,
                    fromDate : dateFromObject,
                    toDate : dateToObject
                });
            };
        },
        
        /**
         * Formats the cron time according to given config
         * 
         * @param       {Object}        config
         * @returns     {String}        The cron time format string
         */
        getCronTime : function (config)
        {
        
            return !!config.cronTime 
                            ?   config.cronTime 
                            :   consts.report.CRON_TIME;   // by default every hour, every week day, from 7am to 8pm; 
        },
        
        /**
         * Defines if given job should be ran independently from setting it up
         * with cron
         * 
         * @returns {Boolean}
         */
        shouldRunNow : function ()
        {
            return false;
        },
        
        
        /**
         * Returns description of the task
         * 
         * @returns {String}
         */
        getDescription : function ()
        {
            return 'Automatic management channel notifications';
        }
    },
    
    
    remind : {
        
        /**
         * Returns the job function
         * 
         * @param   {Object}    config
         * @returns {Function}
         */
        getJob : function (config) 
        {
            return function ()
            {
                reminder.remind(harvest.users, null, function (results) {
                    _.each(results.notified, function (slackName) {
                        logger.info('Successfully notified user ' + slackName + ' about empty time tracker.', {});
                    });
                });
            };
        },
        
        /**
         * Formats the cron time according to given config
         * 
         * @param       {Object}        config
         * @returns     {String}        The cron time format string
         */
        getCronTime : function (config)
        {
           return !!config.cronTime 
                            ?   config.cronTime 
                            :   consts.remind.CRON_TIME;   // by default every midday of working day; 
        },
        
        /**
         * Defines if given job should be ran independently from setting it up
         * with cron
         * 
         * @returns {Boolean}
         */
        shouldRunNow : function ()
        {
            return false;
        },
        
        
        /**
         * Returns description of the task
         * 
         * @returns {String}
         */
        getDescription : function ()
        {
            return 'User notifications about empty tracker.';
        }
    }
};


module.exports = function (config, additionalJobs)
{
    var jobsHolder = new JobsHolder();
    var jobs = _.assign(defaultJobs, additionalJobs);
    _.each(config, function (configValues, jobName) {
        var job = jobs[jobName];
        if (!!job) {
            jobsHolder.addJob(job, configValues);
        }
    });
    
    return jobsHolder;
};