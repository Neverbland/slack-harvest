'use strict';

var view_builder        = require('./../../../../../app/services/report/lib/view_builder.js'),
    expect              = require('chai').expect
;


describe('view_builder', function () {
    describe('view_builder.prepareTitle', function () {
        it('Should provide a properly formatted title for given input title.', function () {
            var title_string = 'title',
                expected_title = '*title*\n',
                title_object = {
                    title : 'title'
                }
            ;
            
            expect(view_builder.prepareTitle(title_string)).to.be.equal(expected_title);
            expect(view_builder.prepareTitle(title_object)).to.be.equal(expected_title);
        });
    });
    
    describe('view_builder.prepareString', function () {
        var project_data        = {
                clientsById : {
                    1234567 : {
                        id : 1234567,
                        name: 'Test Client'
                    }
                },
                projectsById : {
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
                            client_id: 1234567,
                            client_currency: 'British Pound - GBP',
                            client_currency_symbol: '£'
                        }
                },
                    
                dayEntries : [{
                        harvestId : 23456,
                        slackName : 'test_name',
                        error : false,
                        dayEntries: [
                            {
                                day_entry: {
                                    timer_started_at: '2015-04-14T07:28:26Z',
                                    project_id: '7585993',
                                    project: 'Test Project',
                                    user_id: 23456,
                                    spent_at: '2015-04-14',
                                    task_id: '1815946',
                                    task: 'Test Task',
                                    client: 'Test Client',
                                    id: 320497172,
                                    notes: 'Test Note',
                                    created_at: '2015-04-14T07:28:20Z',
                                    updated_at: '2015-04-14T07:28:26Z',
                                    hours_without_timer: 0.2,
                                    hours: 3.61
                                }
                            }
                        ]
                    }]
            },
            formatted_data      = [
                '*test_name*\n',
                'Test Client - Test Project - Test Note - 03:36', 
                'Total: 03:36'
            ].join('\n')
        ;
        
        
        it('Should provide a properly formatted output for given user data.', function () {
            expect(view_builder.prepareString(project_data)).to.be.equal(formatted_data);
        });
    });
});