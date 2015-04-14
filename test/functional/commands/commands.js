'use strict';

var app                 = require('./../../../app.js'),
    expect              = require('chai').expect,
    http                = require('http'),
    codes               = require('./../../../app/api/codes.js'),
    request             = require('request'),
    auth                = require('./../../../app/services/auth/lib/auth.js'),
    applyHandlers       = require('./../../../app/services/auth/lib/handlers.js'),
    sinon               = require("sinon"),
    sinonChai           = require("sinon-chai"),
    harvest             = require('./../../../app/services/harvest')('default', {
        subdomain   : "test",
        email       : "test@test.com",
        password    : "password"
    }),
    harvestModule       = harvest.harvest,
    sampleTimelineData  = {
                        day_entries:
                                [
                                    {
                                        timer_started_at: '2015-04-14T07:28:26Z',
                                        project_id: '3058542',
                                        project: 'Test Project',
                                        user_id: 449849,
                                        spent_at: '2015-04-14',
                                        task_id: '1815946',
                                        task: 'Test Task',
                                        client: 'Test Client',
                                        id: 320497172,
                                        notes: 'Slack - Harvest integration',
                                        created_at: '2015-04-14T07:28:20Z',
                                        updated_at: '2015-04-14T07:28:26Z',
                                        hours_without_timer: 0.2,
                                        hours: 3.61
                                    }
                                ],
                        projects:
                                [
                                    {
                                        name: 'Test Project',
                                        code: '',
                                        id: 7585993,
                                        billable: true,
                                        tasks: [Object],
                                        client: 'Test Client',
                                        client_id: 1685324,
                                        client_currency: 'British Pound - GBP',
                                        client_currency_symbol: '£'
                                    }
                                ],
                        for_day: '2015-04-14'
                    }
;


describe('Functional: Non-dialogue commands', function () {
    
    var server;
    
    applyHandlers(auth, {
        token : 'thisissomeauthtoken'
    });
    harvest.setUsers({
        23456 : 'some_user'
    });
    
    before(function () {
        server = http.createServer(app).listen(3333);
    });
    
    
    describe ('Command: /timer status', function () {
        it ('Should call harvest API and provide a proper text response containing information, that there is no project currently being worked on.', function (done) {
            var userId = 23456,
                expectedUrl = '/daily?of_user=' + userId,
                spyCallback = sinon.spy(),
                timelineData = {}
            ;
            
            harvestModule.client.get = function (url, data, cb) {
                spyCallback(timelineData);
                expect(url).to.be.equal(expectedUrl);
                cb(null, timelineData);
            };
            
            request.post({
                url : 'http://localhost:3333/api/timer',
                form : {
                    token : 'thisissomeauthtoken',
                    user_name : 'some_user',
                    text : 'status'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(timelineData);
                expect(body).to.be.equal('Currently you have no running tasks.');
                done();
            });
        });
        
        
        it ('Should call harvest API and provide a proper text response containing information, which project is currently worked on by the user.', function (done) {
            var userId = 23456,
                expectedUrl = '/daily?of_user=' + userId,
                spyCallback = sinon.spy()
            
            harvestModule.client.get = function (url, data, cb) {
                spyCallback(sampleTimelineData);
                expect(url).to.be.equal(expectedUrl);
                cb(null, sampleTimelineData);
            };
            
            request.post({
                url : 'http://localhost:3333/api/timer',
                form : {
                    token : 'thisissomeauthtoken',
                    user_name : 'some_user',
                    text : 'status'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(sampleTimelineData);
                expect(body).to.be.equal([
                    'You are currently working on ',
                    'Test Client - Test Project - Test Task'
                ].join('\n'));
                done();
            });
        });
    });
    
    
    describe ('Command: /timer stop', function () {
        it ('Should call harvest API and provide a proper text response containing information, that there is no project to stop.', function (done) {
            var userId = 23456,
                expectedUrl = '/daily?of_user=' + userId,
                spyCallback = sinon.spy(),
                timelineData = {}
            ;
            
            harvestModule.client.get = function (url, data, cb) {
                spyCallback(timelineData);
                expect(url).to.be.equal(expectedUrl);
                cb(null, timelineData);
            };
            
            request.post({
                url : 'http://localhost:3333/api/timer',
                form : {
                    token : 'thisissomeauthtoken',
                    user_name : 'some_user',
                    text : 'stop'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(timelineData);
                expect(body).to.be.equal('Currently you have no running tasks.');
                done();
            });
        });
        
        
        it ('Should call harvest API and provide a proper text response containing information, which project is currently worked on by the user.', function (done) {
            var userId = 23456,
                expectedUrlTasks = '/daily?of_user=' + userId,
                expectedUrl = '/daily/timer/320497172?of_user=' + userId
            ;
            
            harvestModule.client.get = function (url, data, cb) {
                if (url === expectedUrlTasks) {
                    cb(null, sampleTimelineData);
                } else {
                    expect(url).to.be.equal(expectedUrl);
                    cb(null, {});
                }
            };
            
            request.post({
                url : 'http://localhost:3333/api/timer',
                form : {
                    token : 'thisissomeauthtoken',
                    user_name : 'some_user',
                    text : 'stop'
                }
            }, function (err, res, body) {
                expect(body).to.be.equal([
                    'Successfully stopped the timer for',
                    'Test Client - Test Project - Test Task'
                ].join('\n'));
                done();
            });
        });
    });
    
    
    after(function (done) {
        server.close(done);
    });
    
});