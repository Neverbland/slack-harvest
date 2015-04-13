/*jshint node: true*/
'use strict';

var notifier                =   require('./../../../services/notifier'),
    _                       =   require('lodash'),
    logger                  =   require('./../../../services/logger.js')('default'),
    consts                  =   require('./../../../../consts.json'),
    tools                   =   require('./../../../services/tools.js')
;
  
   
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


/**
 * Notifies management about stats of given user(s) work
 * 
 * @param   {Object}        req         The request object
 * @param   {Object}        res         The response object
 * @param   {Function}      next        The next callback to apply
 * @returns {undefined}
 */
function notifyManagementController(req, res, next)
{
    var from = req.body.from || null,
        to = req.body.to || null,
        channel = req.body.channel,
        reportTitle = req.body.reportTitle || consts.report.DEFAULT_REPORT_TITLE,
        dateFromObject = from ? (function (date) {
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
        dateToObject = to ? (function (date) {
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
        })(to) : tools.dateFromString(consts.report.DATE_TO_TEXT)
    ;

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
        reportTitle: reportTitle,
        channel: channel,
        fromDate: dateFromObject,
        toDate: dateToObject
    });

    next();
}



module.exports = function (app)
{
    app.use('/api/notify-management', notifyManagementController);    
};