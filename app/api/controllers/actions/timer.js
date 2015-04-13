/*jshint node: true*/
'use strict';

var httpCodes               =   require('./../../codes.js'),
    harvest                 =   require('./../../../services/harvest')('default'),
    _                       =   require('lodash'),
    logger                  =   require('./../../../services/logger.js')('default'),
    tools                   =   require('./../../../services/tools.js'),
    timerCommandParser      =   require('./../../../services/timer.js'),
    consts                  =   require('../../../../consts.json'),
    commandSessionResolver  =   require('./../../../services/interactive_session');


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
 * Notifies management about stats of given user(s) work
 * 
 * @param   {Object}        req         The request object
 * @param   {Object}        res         The response object
 * @param   {Function}      next        The next callback to apply
 * @returns {undefined}
 */
function manageTimerController(req, res, next)
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
        res.set('Content-Type', 'text/html');
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
}


module.exports = function (app, config)
{
    var sessionTime = config.sessionTime || consts.userSession.sessionTime;
    commandSessionResolver.setSesstionTime(sessionTime);
    app.use('/api/timer', manageTimerController);
};