/*jshint node: true*/
'use strict';

var harvest                 =   require('./../../../services/harvest')('default'),
    notifier                =   require('./../../../services/notifier'),
    _                       =   require('lodash'),
    logger                  =   require('./../../../services/logger.js')('default')
;


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


module.exports = function (app, config)
{
    app.use('/api/notify-user/:user', notifyUserController);
};