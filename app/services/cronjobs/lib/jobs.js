/*jshint node: true*/
'use strict';

var notifier    =       require('./../../notifier/index.js'),
    harvest     =       require('./../../harvest')('default'),
    forecast    =       require('./../../forecast')('default'),
    _           =       require('lodash'),
    tools       =       require('./../../tools.js'),
    logger      =       require('./../../logger.js')('default'),
    CronJob     =       require('cron').CronJob,
    consts      =       require('./../../../../consts.json'),
    reminder    =       require('./../../reminder/index.js'),
    util        =       require('util'),
    i18n        =       require('i18n')
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
                autoRun = job.shouldRunNow(config),
                cronJob
            ;
                
            logger.info(i18n.__('Setting up cron job for: "%s" with cron time: ', description), cronTime, {});
            
            cronJob = new CronJob(cronTime, handler);
            cronJob.start();
            if (autoRun) {
                logger.info(i18n.__('Immediately executing cron job for: "%s".', description), {});
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
                    logger.info(i18n.__('Trying to send notifications to user: %s', userId), {});
                    harvest.getUserTimeTrack(userId, new Date(), new Date(), function (err, harvestResponse) {
                        if (err === null) {
                            notifier.notify('users', {
                                harvestUserId : userId,
                                harvestResponse : harvestResponse
                            });
                        } else {
                            logger.error(i18n.__("Failed fetching user timeline from Harvest API for user %s", userId), err, {});
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
        shouldRunNow : function (config)
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
            return i18n.__('Automatic notifications of harvest users on their Slack channels');
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
                logger.info(i18n.__('Loading projects from Harvest API...'), {});
                harvest.doGetProjects();
                logger.info(i18n.__('Loading clients from Harvest API...'), {});
                harvest.doGetClients();
                logger.info(i18n.__('Loading forecast clients/projects/people from Forecast API...'));
                forecast.preload(true);
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
        
            return !!config.cronTime ? config.cronTime : consts.preload.CRON_TIME;
        },
        
        /**
         * Defines if given job should be ran independently from setting it up
         * with cron
         * 
         * @returns {Boolean}
         */
        shouldRunNow : function (config)
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
            return i18n.__('Automatic periodical fetching clients and projects from Harvest API');
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
                
                logger.info(i18n.__('Preparing management report from: {{dateFrom}} to {{dateTo}}', {
                    dateFrom : dateFromObject,
                    dateTo : dateToObject
                }), {});
                notifier.notify('management', {
                    reportTitle : reportTitle,
                    channel : config.channel,
                    fromDate : dateFromObject,
                    toDate : dateToObject,
                    projectId : config.projectId ? config.projectId : null
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
        
            return !!config.cronTime ? config.cronTime : consts.report.CRON_TIME;   // by default every hour, every week day, from 7am to 8pm; 
        },
        
        /**
         * Defines if given job should be ran independently from setting it up
         * with cron
         * 
         * @returns {Boolean}
         */
        shouldRunNow : function (config)
        {
            return Boolean(config.run) ? true : false;
        },
        
        
        /**
         * Returns description of the task
         * 
         * @returns {String}
         */
        getDescription : function ()
        {
            return i18n.__('Automatic management channel notifications');
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
                        logger.info(i18n.__('Successfully notified user %s about empty time tracker.', slackName), {});
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
           return !!config.cronTime ? config.cronTime : consts.remind.CRON_TIME;   // by default every midday of working day; 
        },
        
        /**
         * Defines if given job should be ran independently from setting it up
         * with cron
         * 
         * @returns {Boolean}
         */
        shouldRunNow : function (config)
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
            return i18n.__('User notifications about empty tracker.');
        }
    }
};


module.exports = function (config, additionalJobs)
{
    var jobsHolder = new JobsHolder(),
        jobs = _.assign(defaultJobs, additionalJobs)
    ;
    _.each(config, function (configValues, jobName) {
        var job = jobs[jobName];
        if (!!job) {
            if (!util.isArray(configValues)) {
                configValues = [configValues];
            }
            _.each(configValues, function (configValue) {
                if (job.getJob() !== null) {
                    jobsHolder.addJob(job, configValue);
                }
            });
        }
    });
    
    return jobsHolder;
};