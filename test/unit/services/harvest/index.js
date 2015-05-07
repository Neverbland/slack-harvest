'use strict';

var chai            = require("chai"),
    expect          = require('chai').expect,
    sinon           = require("sinon"),
    sinonChai       = require("sinon-chai"),
    harvest         = require('./../../../../app/services/harvest')('default', {
        subdomain   : "test",
        email       : "test@test.com",
        password    : "password"
    }),
    harvestModule   = harvest.harvest;
    chai.use(sinonChai);

describe('harvest', function () {
    describe('harvest.getUserTimeTrack', function () {
        it('Should send a request to Harvest API with valid user data', function () {
            
            var userId = 123456,
                dateForm = {
                    date : new Date(0),
                    string : '19700101'
                },
                dateTo = {
                    date : new Date(0),
                    string : '19700101'
                },
                expectedUrl = '/people/' + userId + '/entries?from=' + dateForm.string + '&to=' + dateTo.string,
                cb = function (err, result) {};
                
            
            harvestModule.client.get = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
            };  
            
            
            harvest.getUserTimeTrack(userId, dateForm.date, dateTo.date, cb);
        });
    });
    
    describe('harvest.getProjectTimeTrack', function () {
        it('Should send a request to Harvest API with valid project data', function () {
            
            var projectId = 123456,
                dateForm = {
                    date : new Date(0),
                    string : '19700101'
                },
                dateTo = {
                    date : new Date(0),
                    string : '19700101'
                },
                expectedUrl = '/projects/' + projectId + '/entries?from=' + dateForm.string + '&to=' + dateTo.string,
                cb = function (err, result) {};
                
            
            harvestModule.client.get = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
            };  
            
            
            harvest.getProjectTimeTrack(projectId, dateForm.date, dateTo.date, cb);
        });
    });
    
    
    describe('harvest.getProjects', function () {
        it('Should send a request to Harvest API for given projects url if projects not present and load not foeced.', function () {
            
            var expectedUrl = '/projects',
                cb = function (err, result) {};
                
            
            harvestModule.client.get = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
            };  
            
            
            harvest.getProjects(cb);
        });
        
        it('Should not send a request to Harvest API for given projects url if projects are present and load not foeced.', function () {
            
            var cb = sinon.spy();
            harvest.projects = {id : {}};       // Some not null stuff
            harvestModule.client.get = function (url, data, cb) {
                throw new Error("Random error to ensure this method is not executed.");
            };  
            harvest.getProjects(cb);
            expect(cb).to.have.been.calledWith(null, harvest.projects);
            harvest.projects = {};
        });
        
        it('Should send a request to Harvest API for given projects url even if projects are present if load is foeced.', function () {
            
            var expectedUrl = '/projects',
                cb = sinon.spy();
                
            

            harvest.projects = {id : {}};       // Some not null stuff
            
            harvestModule.client.get = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
            };  
            
            
            harvest.getProjects(cb, true);
            harvest.projects = {};
        });
    });
    
    
    
    describe('harvest.getClients', function () {
        it('Should send a request to Harvest API for given clients url if clients not present and load not foeced.', function () {
            
            var expectedUrl = '/clients',
                cb = function (err, result) {};
                
            
            harvestModule.client.get = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
            };  
            
            
            harvest.getClients(cb);
        });
        
        it('Should not send a request to Harvest API for given clients url if clients are present and load not foeced.', function () {
            
            var cb = sinon.spy();
            harvest.clients = {id : {}};       // Some not null stuff
            harvestModule.client.get = function (url, data, cb) {
                throw new Error("Random error to ensure this method is not executed.");
            };  
            harvest.getClients(cb);
            expect(cb).to.have.been.calledWith(null, harvest.clients);
            harvest.clients = {};
        });
        
        it('Should send a request to Harvest API for given clients url even if clients are present if load is foeced.', function () {
            
            var expectedUrl = '/clients',
                cb = sinon.spy();
                
            

            harvest.clients = {id : {}};       // Some not null stuff
            
            harvestModule.client.get = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
            };  
            
            
            harvest.getClients(cb, true);
            harvest.clients = {};
        });
    });
    
    
    describe('harvest.getProject', function () {
        it('Should send a request to Harvest API for given project url.', function () {
            
            var projectId = 12345,
                expectedUrl = '/projects/' + projectId,
                cb = function (err, result) {};
                
            harvestModule.client.get = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
            };  
            
            harvest.getProject(projectId, cb);
        });
    });
    
    
    describe('harvest.getClient', function () {
        it('Should send a request to Harvest API for given client url.', function () {
            
            var clientId = 12345,
                expectedUrl = '/clients/' + clientId,
                cb = function (err, result) {};
                
            harvestModule.client.get = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
            };  
            
            harvest.getClient(clientId, cb);
        });
    });
    
    
    describe('harvest.getProjectsByIds', function () {
        it('Should call a callback with empty array if given ids array is empty.', function () {
            
            var cb = sinon.spy(),
                emptyIds = [];
                
            harvest.getProjectsByIds(emptyIds, cb);
            expect(cb).to.have.been.calledWith(null, emptyIds);
        });
        
        it('Should call a callback with an array of projects without calling an API if the projects are preloaded.', function () {
            var projectsById = {
                    1 : "Dummy Item 1",
                    2 : "Dummy Item 2",
                    3 : "Dummy Item 3"
                },
                cb = function (err, results) {
                    expect(err).to.be.equal(null);
                    expect(results).to.include.members([
                        projectsById[1],
                        projectsById[2],
                        projectsById[3]
                    ]);
                },
                ids = [1,2,3];
            
            harvest.projects = projectsById;
            harvestModule.client.get = function (url, data, cb) {
                throw new Error("Random error to ensure this method is not executed.");
            }; 
            
            harvest.getProjectsByIds(ids, cb);
            harvest.projects = {};
        });
        
        
        it('Should call a callback with an array of projects with calling an API if the projects are not preloaded.', function () {
            var projectsById = {
                    1 : "Dummy Item 1",
                    2 : "Dummy Item 2",
                    3 : "Dummy Item 3"
                },
                cb = function (err, results) {
                    expect(err).to.be.equal(null);
                    expect(results).to.include.members([
                        "Dummy Item 2",
                        "Dummy Item 3",
                        "Dummy Item 4"
                    ]);
                },
                ids = [2,3,4];
            
            harvest.projects = projectsById;
            harvestModule.client.get = function (url, data, cb) {
                expect(url).satisfy(function (givenUrl) {
                    return (['/projects/3', '/projects/4'].indexOf(givenUrl) === -1) ? false : true;
                });
                
                var splitUrl = url.substr(1).split('/');
                cb(null, "Dummy Item " + splitUrl[1]);
            }; 
            
            harvest.getProjectsByIds(ids, cb);
            harvest.projects = {};
        });
    });
    
    
    describe('harvest.getClientsByIds', function () {
        it('Should call a callback with empty array if given ids array is empty.', function () {
            
            var cb = sinon.spy(),
                emptyIds = [];
                
            harvest.getClientsByIds(emptyIds, cb);
            expect(cb).to.have.been.calledWith(null, emptyIds);
        });
        
        it('Should call a callback with an array of clients without calling an API if the clients are preloaded.', function () {
            var clientsById = {
                    1 : "Dummy Item 1",
                    2 : "Dummy Item 2",
                    3 : "Dummy Item 3"
                },
                cb = function (err, results) {
                    expect(err).to.be.equal(null);
                    expect(results).to.include.members([
                        clientsById[1],
                        clientsById[2],
                        clientsById[3]
                    ]);
                },
                ids = [1,2,3];
            
            harvest.clients = clientsById;
            harvestModule.client.get = function (url, data, cb) {
                throw new Error("Random error to ensure this method is not executed.");
            }; 
            
            harvest.getClientsByIds(ids, cb);
            harvest.clients = {};
        });
        
        
        it('Should call a callback with an array of clients with calling an API if the clients are not preloaded.', function () {
            var clientsById = {
                    1 : "Dummy Item 1",
                    2 : "Dummy Item 2",
                    3 : "Dummy Item 3"
                },
                cb = function (err, results) {
                    expect(err).to.be.equal(null);
                    expect(results).to.include.members([
                        "Dummy Item 2",
                        "Dummy Item 3",
                        "Dummy Item 4"
                    ]);
                },
                ids = [2,3,4];
            
            harvest.clients = clientsById;
            harvestModule.client.get = function (url, data, cb) {
                expect(url).satisfy(function (givenUrl) {
                    return (['/clients/3', '/clients/4'].indexOf(givenUrl) === -1) ? false : true;
                });
                
                var splitUrl = url.substr(1).split('/');
                cb(null, "Dummy Item " + splitUrl[1]);
            }; 
            
            harvest.getClientsByIds(ids, cb);
            harvest.clients = {};
        });
    });
    
    
    describe('harvest.toggle', function () {
        it('Should send a request to Harvest API for given day entry id url.', function () {
            
            var dayEntryId = 12345,
                userId = 23456,
                expectedUrl = '/daily/timer/' + dayEntryId + '?of_user=' + userId,
                cb = function (err, result) {};
                
            harvestModule.client.get = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
            };  
            
            harvest.toggle(userId, dayEntryId, cb);
        });
    });
    
    
    describe('harvest.createEntry', function () {
        it('Should send a request to Harvest API making a POST call with proper params.', function () {
            
            var dayEntryId = 12345,
                projectId = 23456,
                userId = 9876,
                taskId = 6789,
                expectedUrl = '/daily/add?of_user=' + userId,
                cb = function (err, result) {};
                
            harvestModule.client.post = function (url, data, cb) {
                expect(url).to.be.equal(expectedUrl);
                expect(cb).to.be.equal(cb);
                expect(data).to.be.deep.equal({
                    task_id : taskId,
                    project_id : projectId,
                    hours: ''
                });
            };  
            
            harvest.createEntry(userId, projectId, taskId, cb);
        });
    });
});