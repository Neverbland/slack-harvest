/*jshint node: true*/
'use strict';

var httpCodes               =   require('./../codes.js'),
    harvest                 =   require('./../../services/harvest')('default'),
    notifier                =   require('./../../services/notifier'),
    _                       =   require('lodash'),
    logger                  =   require('./../../services/logger.js')('default'),
    consts                  =   require('./../../../consts.json'),
    tools                   =   require('./../../services/tools.js'),
    timerCommandParser      =   require('./../../services/timer.js'),
    commandSessionResolver  =   require('./../../services/interactive_session');
    
    
/**
 * Validates the date string and throws a TypeError if invalid. If valid, creates
 * the date
 * 
 * @param       {String}        dateString
 * @returns     {Date}
 * @throws      {TypeError}     If invalid input string provided
 */
function validateCreateDate (dateString) 
{
    var date = new Date(dateString);
    if (date.toString() === 'Invalid Date') {
        throw new TypeError('Provided date ' + dateString + ' is invalid!');
    }
    
    return date;
}


function getHarvestUserId (users, userId)
{
    var harvestUserId = null;
    _.each(users, function (slackName, harvestId) {
        if ((String(harvestId) === String(userId)) || (String(slackName) === String(userId))) {
            harvestUserId = harvestId;
        }
    });

    return harvestUserId;
}


/**
 * API controllers
 * 
 * @author      Maciej Garycki <maciej@neverbland.com>
 * @param       {express}       app         The application
 * @param       {Object}        config      The application config
 */
module.exports = function (app, config) 
{
    
    /**
     * Sets json response
     * 
     * @param   {Object}        req
     * @param   {Object}        res
     * @param   {Function}      next
     * @returns {undefined}
     */
    function setResponse (req, res, next) 
    {
        var httpCode;
        if (!!res.success === false) {
            httpCode = httpCodes.BAD_REQUEST; // Unauthorized
        } else {
            httpCode = httpCodes.OK;
        }
        res.writeHead(httpCode);
        var responseJson = {
            success : Boolean(res.success),
            code: httpCode
        };
        if (!!res.errors) {
            responseJson.errors = res.errors;
        }
        res.write(JSON.stringify(responseJson));
        res.send();
    }
    
    
    /**
     * Notifies all mapped slack users about their Harvest
     * activities
     * 
     * @param   {Object}        req         The request object
     * @param   {Object}        res         The response object
     * @param   {Function}      next        The next callback to apply
     * @returns {undefined}
     */
    function notifyAllController (req, res, next)
    {
        var errors = [];
        var anySuccess = false;
        var ids = harvest.fromUserMap(harvest.users);
        _.each(harvest.fromUserMap(harvest.users), function (userId) {
            harvest.getUserTimeTrack(userId, new Date(), new Date(), function (err, harvestResponse) {
                ids.shift();
                if (err === null) {
                    anySuccess = true;
                    doNotify(harvestResponse, userId);
                } else {
                    logger.error("Failed fetching user timeline from Harvest API for user " + userId, err, {});
                    errors.push(err);
                }
                
                if (!ids.length) {
                    if (anySuccess) {
                        res.success = true;
                    } else {
                        res.success = false;
                    }
                    if (errors.length) {
                        res.errors = errors;
                    }
                    
                    next();
                }
            });
        });
    }
    
    
    /**
     * Notifies a single user given either by slack name or harvest id
     * 
     * @param   {Object}        req         The request object
     * @param   {Object}        res         The response object
     * @param   {Function}      next        The next callback to apply
     * @returns {undefined}
     */
    function notifyUserController (req, res, next)
    {
        var userId = getHarvestUserId(harvest.users, req.params.user);
        if (userId) {
            res.success = true;
            harvest.getUserTimeTrack(userId, new Date(), new Date(), function (err, harvestResponse) {
                if (err === null) {
                    doNotify(harvestResponse, userId);
                } else {
                    logger.error("Failed fetching user timeline from Harvest API for user " + userId, err, {});
                    res.success = false;
                    res.errors = [
                        err
                    ];
                }
                next();
            });
        } else {
            res.success = false;
            res.errors = [
                'Invalid user id'
            ];
            next();
        }
    }
    
    
    /**
     * Notifies the users on Slack
     * 
     * @param   {Object}        harvestResponse     The harvest API response
     * @param   {Number}        userId              The harvest user Id
     * @returns {undefined}
     */
    function doNotify (harvestResponse, userId)
    {
        notifier.notify('users', {
            harvestUserId : userId,
            harvestResponse : harvestResponse
        });
    }
    
    
    /**
     * Notifies management about stats of given user(s) work
     * 
     * @param   {Object}        req         The request object
     * @param   {Object}        res         The response object
     * @param   {Function}      next        The next callback to apply
     * @returns {undefined}
     */
    function notifyManagementController (req, res, next)
    {
        var from            = req.body.from    || null,
            to              = req.body.to      || null,
            channel         = req.body.channel,
            reportTitle     = req.body.reportTitle || consts.report.DEFAULT_REPORT_TITLE,
            dateFromObject  = from ? (function (date) {
                try {
                    return validateCreateDate(date);
                } catch (err) {
                    if (err instanceof TypeError) {
                        res.success = false;
                        res.errors = res.errors || [];
                        res.errors.push(err.message);
                        next();
                        return;
                    }
                }
            })(from) : tools.dateFromString(consts.report.DATE_FROM_TEXT),
            dateToObject  = to ? (function (date) {
                try {
                    return validateCreateDate(date);
                } catch (err) {
                    if (err instanceof TypeError) {
                        res.success = false;
                        res.errors = res.errors || [];
                        res.errors.push(err.message);
                        next();
                        return;
                    }
                }
            })(to) : tools.dateFromString(consts.report.DATE_TO_TEXT);
        
        if (!channel) {
            res.success = false;
            res.errors = [
                'A channel must be provided in \'channel\' post field.'
            ];
            next();
            return;
        }
        
        res.success = true;
        logger.info('Preparing management report from: ' + dateFromObject + ' to ' + dateToObject, {});
        notifier.notify('management', {
            reportTitle : reportTitle,
            channel : channel,
            fromDate : dateFromObject,
            toDate : dateToObject
        });
        
        next();
    }
    
    
    /**
     * Notifies management about stats of given user(s) work
     * 
     * @param   {Object}        req         The request object
     * @param   {Object}        res         The response object
     * @param   {Function}      next        The next callback to apply
     * @returns {undefined}
     */
    function manageTimerController (req, res, next)
    {
        var text = req.body.text || '',
            config,
            userName = (function () {
                try {
                    return tools.validateGet(req.body, 'user_name', "Invalid username provided!");
                } catch (err) {
                    res.success = false;
                    res.errors = [
                        err.message
                    ];
                    
                }
            })();
            if (!userName) {
                next();
                return;
            }
            
        try {
            config = timerCommandParser.parseTimerConfig(text);
            config.userId = getHarvestUserId(harvest.users, userName);
        } catch (err) {
            res.success = false;
            res.errors = [
                err.message
            ];
            next();
            return;
        }

        commandSessionResolver.runStep(config, function (err, view) {
            res.set('Content-Type', 'text/html')
            if (err === null) {
                res.writeHead(httpCodes.OK);
                res.write(view);
                res.send();
            } else {
                res.writeHead(httpCodes.BAD_REQUEST);
                res.write(view);
                res.send();
            }
        });
    };
    
    
    app.use('/api/notify-all', notifyAllController);
    app.use('/api/notify-user/:user', notifyUserController);
    app.use('/api/notify-management', notifyManagementController);
    
    app.use('/api/timer', manageTimerController);
    
    app.use(setResponse);
};