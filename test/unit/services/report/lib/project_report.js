'use strict';

var report              = require('./../../../../../app/services/report/lib/project_report.js'),
    expect              = require('chai').expect,
    harvest             = require('./../../../../../app/services/harvest')('default', {
        subdomain       : "test",
        email           : "test@test.com",
        password        : "password"
    }),
    harvestModule       = harvest.harvest,
    dayEntriesMock      = [
        {
            day_entry : {
                timer_started_at: '2015-04-14T07:28:26Z',
                project_id: '7585993',
                user_id: 2,
                spent_at: '2015-04-14',
                task_id: '1815946',
                id: 320497172,
                notes: '',
                created_at: '2015-04-14T07:28:20Z',
                updated_at: '2015-04-14T07:28:26Z',
                hours_without_timer: 0.2,
                hours: 3.61
            }
        }
    ],
    projectsMock        = {
        7585993 : {
            name: 'Test Project',
            code: '',
            id: 7585993,
            billable: true,
            tasks: [
                { name: 'Test Task', billable: false, id: 1815946 },
                { name: 'Design', billable: false, id: 1815943 }
            ],
            client: 'Test Client',
            client_id: 3,
            client_currency: 'British Pound - GBP',
            client_currency_symbol: '£'
        },
        7585994 : {
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
    },
    clientsMock = {
        3 : {
            client : {
                id : 3,
                name : 'Test client'
            }
        }
    }
;


describe('project_report', function () {
    
    describe('project_report.getReport', function () {
        
        
        it('Should provide a report for given project id listing out all users that have been working on given project in given preiod of time.', function () {
            
            var dateFrom = '20150401',
                dateTo = '20150405',
                projectId = 1,
                users = {
                    2 : 'some_user1',
                },      
                userId = 2,
                clientId = 3,
                expectedUrlBeginningUsers = '/people/' + userId + '/entries',
                expectedUrlBeginningClient = '/clients/' + clientId
            ;
            
            harvest.users = users;
            
            harvestModule.client.get = function (url, data, cb) {
                if (url.substr(0, expectedUrlBeginningUsers.length) === expectedUrlBeginningUsers) {
                    cb(null, dayEntriesMock);
                    return;
                } else if (url.substr(0, expectedUrlBeginningClient.length) === expectedUrlBeginningClient) {
                    cb(null, clientsMock[3]);
                    return;
                }
            };  
            
            
            report.getReport(projectId, dateFrom, dateTo, function (err, view) {
                
                
                
            });
            
            
        });
        
    });
    
});