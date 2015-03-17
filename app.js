/*jshint node: true*/
'use strict';

/*
 * Main application body and dispatch point for
 * Slack - Harvest integration miniserver
 * 
 * @author Maciej Garycki <maciej@neverbland.com>
 */

var express = require('express'),
    app = express(),
    config = require('./config.json'),
    logger = require('./app/services/logger.js')('default', config.logger),
    harvest = require('./app/services/harvest')('default', config.harvest),
    slack = require('./app/services/slack')('default', config.slack),
    notifier = require('./app/services/notifier'),
    reportNotifier = require('./app/services/report')(),
    slackNotifier = require('./app/services/slack/notifier')(slack, harvest);

harvest.setUsers(config.users);
slack.setUsers(config.users);
notifier.addNotifier('users', slackNotifier);
notifier.addNotifier('management', reportNotifier);

require('./app/event_listeners')(app);
require('./app/api')(app, config.api);
require('./app/services/cronjobs')(app, config.cron);

var server = app.listen(config.app.port, function () {
    logger.info('Started web server with config : ', config, {});
});