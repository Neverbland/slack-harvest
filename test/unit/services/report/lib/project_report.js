'use strict';

var report              = require('./../../../../../app/services/report/lib/project_report.js'),
    expect              = require('chai').expect,
    dayEntriesMock      = [
        {
            timer_started_at: '2015-04-14T07:28:26Z',
            project_id: '7585993',
            user_id: 23456,
            spent_at: '2015-04-14',
            task_id: '1815946',
            id: 320497172,
            notes: '',
            created_at: '2015-04-14T07:28:20Z',
            updated_at: '2015-04-14T07:28:26Z',
            hours_without_timer: 0.2,
            hours: 3.61
        }
    ],
    projectsMock        = [
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
            client_id: 3,
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
    clientsMock = [
        {
            client : {
                id : 3,
                name : 'Test client'
            }
        }
    ]
;


describe('project_report', function () {
    
    describe('project_report.getReport', function () {
        
        
        it('Should provide a report for given project id listing out all users that have been working on given project in given preiod of time.', function () {
            
            var dateFrom = '20150401',
                dateTo = '20150405',
                projectId = 1
            ;
            
            
            
            report.getReport(projectId, dateFrom, dateTo, function (err, view) {
                
                
                
            });
            
            
        });
        
    });
    
});