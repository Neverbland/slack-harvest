/*jshint node: true*/
'use strict';

var httpCodes   =   require('./../codes.js'),
    harvest     =   require('./../../services/harvest')('default'),
    notifier    =   require('./../../services/notifier'),
    _           =   require('lodash'),
    logger      =   require('./../../services/logger.js')('default');

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
            httpCode = httpCodes.BAD_REQUEST;
        } else {
            httpCode = httpCodes.OK;
        }
        res.writeHead(httpCode); // Unauthorized
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
     * @param {type} req
     * @param {type} res
     * @param {type} next
     * @returns {undefined}
     */
    function notifyUserController (req, res, next)
    {
        var userId = (function (users, userId) {
            var harvestUserId = null;
            _.each(users, function (slackName, harvestId) {
                if ((String(harvestId) === String(userId)) || (String(slackName) === String(userId))) {
                    harvestUserId = harvestId;
                }
            });
            
            return harvestUserId;
        })(harvest.users, req.params.user);
        
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
    
    
    app.use('/api/notify-all', notifyAllController);
    app.use('/api/notify-user/:user', notifyUserController);
    
    app.use(setResponse);
};