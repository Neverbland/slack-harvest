/*jshint node: true*/
'use strict';

var 
    jobs =   require('./lib/jobs.js'),
    walk =   require('walk')
;
    
  

module.exports = function (app, config) {

    var walker,
        cronJobs = jobs(config)
    ;
    
    walker  = walk.walk(__dirname + '/jobs', {
        followLinks : false 
    });
    
    walker.on('file', function (root, stat, next) {
        var file = __dirname + '/jobs/' + stat.name,
            baseName = stat.name.substr(0, stat.name.length - 3),
            conf = config[baseName] || {},
            job = require(file)
        ;
        if (job.getJob() !== null) {
            cronJobs.addJob(job, conf);
        }
        
        next();
    });
        
    walker.on('end', function () {
        cronJobs.run();
    });
};