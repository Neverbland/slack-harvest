/*jshint node: true*/
'use strict';

/**
 * Main application body and dispatch point for
 * Slack - Harvest integration miniserver
 * 
 * @author Maciej Garycki <maciej@neverbland.com>
 */

var express = require('express');
var app = express();
var config = require('./config.json');

require('./app/event_listeners')(app);
require('./app/api')(app, config.api);

var server = app.listen(config.app.port);