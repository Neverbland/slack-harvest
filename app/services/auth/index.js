/*jshint node: true*/
'use strict';

module.exports = function (app, config) {
    
    var auth = require('./lib/auth.js')(app, config);
    
    // Register handlers in the auth object
    require('./lib/handlers.js')(auth, config);
    
    app.use(function (req, res, next) {
        if (auth.hasAccess(req)) {
            next();
        } else {
            throw new require('./lib/error.js')("Access denied!", auth.getErrors());
        }
    });
}