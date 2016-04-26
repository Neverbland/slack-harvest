/*jshint node: true*/
'use strict';

/*
 * Main application body and dispatch point for
 * Slack - Harvest integration miniserver
 * 
 * @author Maciej Garycki <maciej@neverbland.com>
 */



var 
    express = require('express'),
    app = express(),
    config = require('./config/index.js'),
    logger = require('./app/services/logger.js')('default', config.logger),
    harvest = require('./app/services/harvest')('default', config.harvest),
    slack = require('./app/services/slack')('default', config.slack),
    notifier = require('./app/services/notifier'),
    reportNotifier = require('./app/services/report')(slack, harvest),
    slackNotifier = require('./app/services/slack/notifier')(slack, harvest),
    slackForecastNotifier = require('./app/services/slack/notifier/forecast')(slack, harvest),
    slackReminder = require('./app/services/slack/notifier/remind')(slack, harvest),
    i18n = require('i18n'),
    forecast = require('./app/services/forecast')('default', config.forecast),
    server
;


i18n.configure({
    locales : ['en'],
    directory: __dirname + '/locales',
    logDebugFn : function (msg) {
        logger.info(msg, {});
    },
    logWarnFn: function (msg) {
        logger.warn(msg, {});
    },
    logErrorFn: function (msg) {
        logger.error(msg, {});
    }
});
harvest.setUsers(config.users);
slack.setUsers(config.users);

// Defining three notification channels
notifier.addNotifier('users', slackNotifier);
notifier.addNotifier('forecast', slackForecastNotifier);
notifier.addNotifier('reminder', slackReminder);
notifier.addNotifier('management', reportNotifier);

require('./app/event_listeners')(app);
require('./app/api')(app, config.api);
require('./app/services/cronjobs')(app, config.cron);

module.exports = app;

if (!module.parent) {
    server = app.listen(config.app.port, function () {
        logger.info('Started web server with config : ', config, {});
    });
}