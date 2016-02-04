/*jshint node: true*/
'use strict';

var harvest                 =   require('./../../../services/harvest')('default'),
    notifier                =   require('./../../../services/notifier'),
    _                       =   require('lodash'),
    logger                  =   require('./../../../services/logger.js')('default'),
    i18n                    =   require('i18n')
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
                logger.error(i18n.__("Failed fetching user timeline from Harvest API for user %s", userId), err, {});
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
            i18n.__('Invalid user id %s', userId)
        ];
        next();
    }
}


module.exports = function (app, config)
{
    app.use('/api/notify-user/:user', notifyUserController);
};