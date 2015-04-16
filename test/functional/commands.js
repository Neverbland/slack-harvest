'use strict';

var app                 = require('./../../app.js'),
    expect              = require('chai').expect,
    http                = require('http'),
    codes               = require('./../../app/api/codes.js'),
    request             = require('request'),
    auth                = require('./../../app/services/auth/lib/auth.js'),
    applyHandlers       = require('./../../app/services/auth/lib/handlers.js'),
    sinon               = require('sinon'),
    sinonChai           = require('sinon-chai'),
    commandName         = require('./../../config').api.controllers.timer.command,
    harvest             = require('./../../app/services/harvest')('default', {
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
                                        project_id: '7585993',
                                        project: 'Test Project',
                                        user_id: 23456,
                                        spent_at: '2015-04-14',
                                        task_id: '1815946',
                                        task: 'Test Task',
                                        client: 'Test Client',
                                        id: 320497172,
                                        notes: '',
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
                                        tasks: [
                                            { name: 'Test Task', billable: false, id: 1815946 },
                                            { name: 'Design', billable: false, id: 1815943 }
                                        ],
                                        client: 'Test Client',
                                        client_id: 1234567,
                                        client_currency: 'British Pound - GBP',
                                        client_currency_symbol: '£'
                                    },
                                    {
                                        name: 'Test Project 2',
                                        code: '',
                                        id: 7585994,
                                        billable: true,
                                        tasks: [
                                            { name: 'Test Task', billable: false, id: 1915946 },
                                            { name: 'Support', billable: false, id: 1918076 }
                                        ],
                                        client: 'Test Client',
                                        client_id: 1234567,
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
    
    
    describe ('Command: ' + commandName + ' status', function () {
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
    
    
    describe ('Command: ' + commandName + ' projects', function () {
        it ('Should call harvest API and provide a proper text response containing information, that there are no projects currently available.', function (done) {
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
                    text : 'projects'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(timelineData);
                expect(body).to.be.equal('Currently you have no available projects.');
                done();
            });
        });
        
        
        it ('Should call harvest API and provide a proper text response containing information, which projects are available.', function (done) {
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
                    text : 'projects'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(sampleTimelineData);
                expect(body).to.be.equal([
                    'Available projects',
                    '',
                    '1. Test Client - Test Project',
                    '2. Test Client - Test Project 2'
                ].join('\n'));
                done();
            });
        });
    });
    
    
    describe ('Command: ' + commandName + ' stop', function () {
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
    
    
    describe ('Command: ' + commandName + ' start', function () {
        
        it('Should call the api and provide info, that no project/client is matching given input string.', function (done) {
            var userId = 23456,
                expectedUrl = '/daily?of_user=' + userId,
                spyCallback = sinon.spy()
            ;
            
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
                    text : 'start nonexistingproject'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(sampleTimelineData);
                expect(body).to.be.equal('No projects matching given string found!');
                done();
            });
        });
        
        
        it('Should call the api and return step 1 dialogue message. After sending \'no\' response, should quit the dislogue.', function (done) {
            var userId = 23456,
                expectedUrl = '/daily?of_user=' + userId,
                spyCallback = sinon.spy()
            ;
            
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
                    text : 'start test'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(sampleTimelineData);
                expect(body).to.be.equal([
                    'Choose the awesome project you are working on today!',
                    '',
                    '1. Test Client - Test Project',
                    '2. Test Client - Test Project 2',
                    '',
                    'Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' to quit the timer setup'
                ].join('\n'));
                
                request.post({
                    url : 'http://localhost:3333/api/timer',
                    form : {
                        token : 'thisissomeauthtoken',
                        user_name : 'some_user',
                        text : 'no'
                    }
                }, function (err, res, body) {
                    expect(body).to.be.equal('Cool, try again later!');
                    done();
                });
            });
        });
    
    
    
        it('Should call the api and return step 2 dialogue message. After sending \'no\' response, should quit the dislogue.', function (done) {
            var userId = 23456,
                expectedUrl = '/daily?of_user=' + userId,
                spyCallback = sinon.spy()
            ;
            
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
                    text : 'start test'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(sampleTimelineData);
                expect(body).to.be.equal([
                    'Choose the awesome project you are working on today!',
                    '',
                    '1. Test Client - Test Project',
                    '2. Test Client - Test Project 2',
                    '',
                    'Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' to quit the timer setup'
                ].join('\n'));
                
                request.post({
                    url : 'http://localhost:3333/api/timer',
                    form : {
                        token : 'thisissomeauthtoken',
                        user_name : 'some_user',
                        text : '1'
                    }
                }, function (err, res, body) {
                    expect(body).to.be.equal([
                        'Cool, love that project!',
                        'What task are you on?',
                        '',
                        '1. Test Task (Currently running)',
                        '2. Design',
                        '',
                        'Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' if you picked the wrong project.'
                    ].join('\n'));
                    
                    request.post({
                        url : 'http://localhost:3333/api/timer',
                        form : {
                            token : 'thisissomeauthtoken',
                            user_name : 'some_user',
                            text : 'no'
                        }
                    }, function (err, res, body) {
                        expect(body).to.be.equal('Cool, try again later!');
                        done();
                    });
                });
            });
        });
        
        
        it('Should call the api to create new day entry and return step 3 dialogue message and success.', function (done) {
            var userId = 23456,
                expectedUrl = '/daily?of_user=' + userId,
                spyCallback = sinon.spy()
            ;
            
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
                    text : 'start test'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(sampleTimelineData);
                expect(body).to.be.equal([
                    'Choose the awesome project you are working on today!',
                    '',
                    '1. Test Client - Test Project',
                    '2. Test Client - Test Project 2',
                    '',
                    'Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' to quit the timer setup'
                ].join('\n'));
                
                request.post({
                    url : 'http://localhost:3333/api/timer',
                    form : {
                        token : 'thisissomeauthtoken',
                        user_name : 'some_user',
                        text : '1'
                    }
                }, function (err, res, body) {
                    expect(body).to.be.equal([
                        'Cool, love that project!',
                        'What task are you on?',
                        '',
                        '1. Test Task (Currently running)',
                        '2. Design',
                        '',
                        'Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' if you picked the wrong project.'
                    ].join('\n'));
                    
                    
                    expectedUrl = '/daily/add?of_user=' + userId;
                    
                    harvestModule.client.post = function (url, data, cb) {
                        expect(url).to.be.equal(expectedUrl);
                        expect(data).to.be.deep.equal({
                            task_id : 1815943,
                            project_id : 7585993,
                            hours: ''
                        });
                        
                        cb(null, {
                            timer_started_at: '2015-04-14T07:28:26Z',
                            project_id: '7585993',
                            project: 'Test Project',
                            user_id: 23456,
                            spent_at: '2015-04-14',
                            task_id: '1815943',
                            task: 'Design',
                            client: 'Test Client',
                            id: 320497175,
                            notes: '',
                            created_at: '2015-04-14T07:28:20Z',
                            updated_at: '2015-04-14T07:28:26Z',
                            hours_without_timer: 0.2,
                            hours: 3.61
                        });
                    };
                    
                    
                    request.post({
                        url : 'http://localhost:3333/api/timer',
                        form : {
                            token : 'thisissomeauthtoken',
                            user_name : 'some_user',
                            text : '2'
                        }
                    }, function (err, res, body) {
                        expect(spyCallback).to.have.been.calledWith(sampleTimelineData);
                        expect(body).to.be.equal([
                            'Successfully created and started an entry for',
                            '',
                            'Test Client - Test Project - Design'
                        ].join('\n'));
                        done();
                    });
                });
            });
        });
        
        
        it('Should call the api to toggle an existing day entry and return step 3 dialogue message and success.', function (done) {
            var userId = 23456,
                expectedUrl = '/daily?of_user=' + userId,
                spyCallback = sinon.spy()
            ;
            
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
                    text : 'start test'
                }
            }, function (err, res, body) {
                expect(spyCallback).to.have.been.calledWith(sampleTimelineData);
                expect(body).to.be.equal([
                    'Choose the awesome project you are working on today!',
                    '',
                    '1. Test Client - Test Project',
                    '2. Test Client - Test Project 2',
                    '',
                    'Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' to quit the timer setup'
                ].join('\n'));
                
                request.post({
                    url : 'http://localhost:3333/api/timer',
                    form : {
                        token : 'thisissomeauthtoken',
                        user_name : 'some_user',
                        text : '1'
                    }
                }, function (err, res, body) {
                    expect(body).to.be.equal([
                        'Cool, love that project!',
                        'What task are you on?',
                        '',
                        '1. Test Task (Currently running)',
                        '2. Design',
                        '',
                        'Just type ' + commandName + ' followed by a number to choose it or write \'' + commandName + ' no\' if you picked the wrong project.'
                    ].join('\n'));
                    
                    
                    expectedUrl = '/daily/timer/320497172?of_user=' + userId;
                    
                    harvestModule.client.get = function (url, data, cb) {
                        expect(url).to.be.equal(expectedUrl);
                        
                        
                        cb(null, {
                            timer_started_at: '2015-04-14T07:28:26Z',
                            project_id: '7585993',
                            project: 'Test Project',
                            user_id: 23456,
                            spent_at: '2015-04-14',
                            task_id: '1815946',
                            task: 'Test Task',
                            client: 'Test Client',
                            id: 320497172,
                            notes: '',
                            created_at: '2015-04-14T07:28:20Z',
                            updated_at: '2015-04-14T07:28:26Z',
                            hours_without_timer: 0.2,
                            hours: 3.61
                        });
                    };
                    
                    
                    request.post({
                        url : 'http://localhost:3333/api/timer',
                        form : {
                            token : 'thisissomeauthtoken',
                            user_name : 'some_user',
                            text : '1'
                        }
                    }, function (err, res, body) {
                        expect(spyCallback).to.have.been.calledWith(sampleTimelineData);
                        expect(body).to.be.equal([
                            'Successfully created and started an entry for',
                            '',
                            'Test Client - Test Project - Test Task'
                        ].join('\n'));
                        done();
                    });
                });
            });
        });
        
    });
    
    
    after(function (done) {
        server.close(done);
    });
    
});