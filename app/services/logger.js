/*jshint node: true*/
'use strict';

var Syslogh = require('syslogh'),
        _ = require('lodash'),
        uuid = require('node-uuid'),
        util = require('util'),
        moment = require('moment'),
        winston = require('winston');

function Logger(config) {
    this.logger = null;
    this.config = config;

    this._init();
}

/**
 * Setup Logger transports and configuration
 *
 * @private
 */
Logger.prototype._init = function () {
    // prepare logger transports
    var transports = [];
    
    if (this.config.file) {
        transports.push(new winston.transports.File({
            filename: this.config.file,
            json: true,
            stringify: function (obj) {
                return JSON.stringify(obj);
            }
        }));
    }

    // add console transport if defined
    if (this.config.console) {
        transports.push(new (winston.transports.Console)({
            json: true,
            stringify: function (obj) {
                return JSON.stringify(obj, null, '\t');
            }
        }));
    }

    this.logger = new (winston.Logger)({
        transports: transports
    });

    // enable syslog if defined
    if (this.config.syslog) {
        Syslogh.openlog(this.config.processName, Syslogh.PID, Syslogh.LOCAL0);
    }
};

/**
 * Basic logging metadata
 */
Logger.prototype._getLogBasicInfo = function () {
    return {
        created_at: moment().format(this.config.date_format),
        app: this.config.appHostname,
        process_name: this.config.processName,
        pid: process.pid
    };
};

/**
 * @param {Object} args
 * @param {Object} extendData
 * @returns {Object}
 */
Logger.prototype._extendLastArgument = function (args, extendData) {
    var lastArgument = args[args.length - 1];
    if (_.isObject(lastArgument)) {
        args[args.length - 1] = _.extend({}, extendData, lastArgument);
    }

    return args;
};

/**
 * @returns {String}
 */
Logger.prototype.generateLogId = function () {
    return uuid.v4();
};

/**
 * Log info
 */
Logger.prototype.info = function () {
    var modifiedArgs = this._extendLastArgument(arguments, this._getLogBasicInfo());
    this.logger.info.apply(this.logger, modifiedArgs);
};

/**
 * Log warn
 */
Logger.prototype.warn = function () {
    var modifiedArgs = this._extendLastArgument(arguments, this._getLogBasicInfo());
    this.logger.warn.apply(this.logger, modifiedArgs);
};

/**
 * Log error
 */
Logger.prototype.error = function () {
    if (this.config.syslog)
        Syslogh.syslog(Syslogh.ERR, util.format.apply(util, arguments));

    var modifiedArgs = this._extendLastArgument(arguments, this._getLogBasicInfo());
    this.logger.error.apply(this.logger, modifiedArgs);
};

/**
 * Log log
 */
Logger.prototype.log = function () {
    var modifiedArgs = this._extendLastArgument(arguments, this._getLogBasicInfo());
    this.logger.log.apply(this.logger, modifiedArgs);
};


/**
 * 
 * @type {Object} The instances of the logger
 */
var instances = {};


/**
 * Exports the logger factory
 *
 * @param       {String}    key
 * @param       {Object}    config
 * @returns     {Logger} 
 */
module.exports = function (key, config) {
    if (!!instances[key]) {
        return instances[key];
    } else {
        instances[key] = new Logger(config);
        return instances[key];
    }
};
