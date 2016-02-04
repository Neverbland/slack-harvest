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
               logger.error(i18n.__("Failed fetching user timeline from Harvest API for user %s", userId) , err, {});
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

module.exports = function (app, config)
{
    app.use('/api/notify-all', notifyAllController);
};