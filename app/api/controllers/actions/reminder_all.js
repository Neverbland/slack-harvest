/*jshint node: true*/
'use strict';

var harvest                 =   require('./../../../services/harvest')('default'),
    notifier                =   require('./../../../services/notifier'),
    _                       =   require('lodash'),
    logger                  =   require('./../../../services/logger.js')('default'),
    reminder                =   require('./../../../services/reminder/index')
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
   notifier.notify('reminder', {
       harvestUserId : userId,
       harvestResponse : harvestResponse
   });
}


/**
 * Notifies all mapped slack users to activate their Harvest if that's not done.
 * 
 * @param   {Object}        req         The request object
 * @param   {Object}        res         The response object
 * @param   {Function}      next        The next callback to apply
 * @returns {undefined}
 */
function remindAllController (req, res, next)
{
    reminder.remind(harvest.users, function () {
        res.success = true;
        next();
    });
}

module.exports = function (app, config)
{
    app.use('/api/remind-all', remindAllController);
};