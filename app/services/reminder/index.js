/*jshint node: true*/
'use strict';

var harvest                 =   require('./../harvest')('default'),
    notifier                =   require('./../notifier'),
    _                       =   require('lodash'),
    logger                  =   require('./../logger.js')('default'),
    Q                       =   require('q')
;


/**
 * Notifies the user given by harvest ID
 * 
 * @param   {Number} harvestId
 * @returns {undefined}
 */
function doNotify (harvestId)
{
    notifier.notify('reminder', {
       harvestUserId : harvestId
   });
}


/**
 * Returns true if notification needs to be sent
 * 
 * @param       {Array}         dayEntries  An array of day entries provided
 *                              by Harvest  API
 * @returns     {Boolean}
 */
function needsNotification (dayEntries)
{
    return !dayEntries.length;
}


var Reminder = {
    
    /**
     * Reminds users if the users have no harvest day entries assigned
     * 
     * @param   {Object}    users           harvestID -> slackName pairs
     * @param   {Function}  initCallback    Called after the user timetrack was initiated
     * @param   {Function}  callback        Takes an object containing: success (list of succeeded users)
     *                                                                  notified (list of the users that needed to be notified)
     *                                                                  errors  (list of failed users)
     */
    remind : function (users, initCallback, callback)
    {
        var errors = {}, 
            successes = {},
            notified = {},
            promises = []
        ;
        _.each(users, function (slackName, harvestId) {
            var def = Q.defer();
            harvest.getUserTimeTrack(harvestId, new Date(), new Date(), function (err, harvestResponse) {
                if (err === null) {
                    successes[harvestId] = slackName;
                    if (needsNotification(harvestResponse)) {
                        doNotify(harvestId);
                        notified[harvestId] = slackName;
                    }
                } else {
                    logger.error("Failed fetching user timeline from Harvest API for user " + harvestId, err, {});
                    errors[harvestId] = slackName;
                }
                def.resolve(harvestId);
            });
            
            promises.push(def.promise);
        });
        
        Q.all(promises).then(function (items) {
            if (typeof callback === 'function') {
                callback({
                    successes : successes,
                    errors : errors,
                    notified : notified
                });
            }
        });
        
        if (typeof initCallback === 'function') {
            initCallback();
        }
    }
};


module.exports = Reminder;