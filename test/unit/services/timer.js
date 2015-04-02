'use strict';

var chai            = require('chai'),
    _               = require('lodash'),
    expect          = require('chai').expect,
    timer           = require('./../../../app/services/timer.js');
    
    
describe('api.controllers.timer', function () {
    
    describe('timer.parseTimerConfig', function () {
        
        it('Should prepare proper harvest request config object for a correctly defined input command nontaining action name', function () {
            var validCommand = "start project_name";
            var config = timer.parseTimerConfig(validCommand);
            
            expect(config.action).to.be.equal('start');
            expect(config.name).to.be.a('string');
            expect(config.name).to.be.equal('project_name');
           
        });
        
        
        it('Should prepare proper harvest request config object for a correctly defined input command not containing action name', function () {
            var validCommand = "1";
            var config = timer.parseTimerConfig(validCommand);
            
            expect(config.action).to.be.equal(null);
            expect(config.name).to.be.a('undefined');
            expect(config.value).to.be.equal("1");
           
        });
    });
    
    
    describe('timer.findMatchingClientsOrProjects', function () {
        var projects = [{name: 'Website Maintenance',
                code: '',
                id: 3906589,
                billable: false,
                tasks: [Object],
                client: 'Sample Client 58',
                client_id: 1456809,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'New Phase',
                code: '',
                id: 7492773,
                billable: true,
                tasks: [Object],
                client: 'Sample Client 58',
                client_id: 1560768,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Website Maintenance',
                code: '',
                id: 6277432,
                billable: false,
                tasks: [Object],
                client: 'Sample Client 58',
                client_id: 1560768,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'App',
                code: '',
                id: 3097821,
                billable: false,
                tasks: [Object],
                client: 'Conjure',
                client_id: 1561330,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Test Site',
                code: '',
                id: 3322251,
                billable: false,
                tasks: [Object],
                client: 'Sample Client 55',
                client_id: 1561330,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Holiday',
                code: '',
                id: 4445437,
                billable: false,
                tasks: [Object],
                client: 'NEVERBLAND',
                client_id: 1441113,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Sample Task 8',
                code: '',
                id: 4847113,
                billable: false,
                tasks: [Object],
                client: 'NEVERBLAND',
                client_id: 1441113,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Internal',
                code: '',
                id: 3058542,
                billable: false,
                tasks: [Object],
                client: 'NEVERBLAND',
                client_id: 1441113,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Website Maintenance',
                code: '',
                id: 6258456,
                billable: false,
                tasks: [Object],
                client: 'Sample Client 2',
                client_id: 1795160,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Backend',
                code: '',
                id: 7074009,
                billable: true,
                tasks: [Object],
                client: 'Sample Client 2',
                client_id: 3094246,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Awesome task',
                code: '',
                id: 7479901,
                billable: false,
                tasks: [Object],
                client: 'Sample client 2',
                client_id: 1575859,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Sample project 4',
                code: '',
                id: 4047500,
                billable: true,
                tasks: [Object],
                client: 'Sample client 3',
                client_id: 1867831,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Test project',
                code: '',
                id: 5897618,
                billable: false,
                tasks: [Object],
                client: 'S+O',
                client_id: 1448780,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Sample project 2',
                code: '',
                id: 7420124,
                billable: false,
                tasks: [Object],
                client: 'Slate',
                client_id: 1549998,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Sample project 2',
                code: '',
                id: 3294106,
                billable: false,
                tasks: [Object],
                client: 'Slate',
                client_id: 1549998,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Sample project 1',
                code: '',
                id: 3717796,
                billable: false,
                tasks: [Object],
                client: 'Slate',
                client_id: 1549998,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Old Stuff maintenance',
                code: '',
                id: 7492008,
                billable: false,
                tasks: [Object],
                client: 'Slate',
                client_id: 1549998,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Sample project 1',
                code: '',
                id: 7549919,
                billable: false,
                tasks: [Object],
                client: 'Slate',
                client_id: 1549998,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Sample project 2',
                code: '',
                id: 4611867,
                billable: false,
                tasks: [Object],
                client: 'Slate',
                client_id: 1549998,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'},
            {name: 'Sample project 3',
                code: '',
                id: 6031218,
                billable: false,
                tasks: [Object],
                client: 'Sample client 3',
                client_id: 1447817,
                client_currency: 'British Pound - GBP',
                client_currency_symbol: '£'}];
        
        
        var projectDataSamples = [
            {
                name : 'NEVERBLAND',
                expected : [
                    {
                        client : 'NEVERBLAND',
                        project : 'Holiday',
                        clientId : 1441113,
                        projectId : 4445437
                    },
                    {
                        client : 'NEVERBLAND',
                        project : 'Sample Task 8',
                        clientId : 1441113,
                        projectId : 4847113
                    },
                    {
                        client : 'NEVERBLAND',
                        project : 'Internal',
                        clientId : 1441113,
                        projectId : 3058542
                    }
                ]
            },
            
        ];
       
        it('Should find best matches for given array of projects and name', function () {
            _.each(projectDataSamples, function (sample) {
                var expected = sample.expected,
                    name = sample.name,
                    matching = timer.findMatchingClientsOrProjects(name, projects);
                    
                expect(matching).to.be.a('array');
                expect(matching).to.deep.equal(expected);
            });
        });
    });
    
});
    