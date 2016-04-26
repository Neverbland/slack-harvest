/*jshint node: true*/
'use strict';

var 
    i18n        =       require('i18n'),
    notifier    =       require('./../../notifier/index.js'),
    consts      =       require('./../../../../consts.json'),
    forecast    =       require('./../../forecast')('default'),
    logger      =       require('./../../logger.js')('default'),
    moment      =       require('moment'),
    job         =       {
        
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
               if (forecast === null) {
                   return null;
               }
               var options = {
                   startDate : moment().startOf('day'),
                   endDate : moment().endOf('day')
               };
               
               forecast.assignments(options, function (error, assignments) {
                   if (error) {
                       logger.error(i18n.__('Failed loading forecast schedule.', {}));
                   } else {
                       notifier.notify('forecast', {
                           assignments : assignments
                       });
                   }
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
            var cronTime;
            if (!!config.cronTime) {
                cronTime = config.cronTime;
            } else if (!!config.minutes && !!config.hour) {
                cronTime = '00 ' + config.minutes + ' ' + config.hour + ' * * 1-5';
            }
            
            return !!cronTime ? cronTime : consts.forecast.CRON_TIME;   // by default every midday of working day; 
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
           return i18n.__('User notifications for their forecast schedule.');
        }
    }
;


module.exports = job;