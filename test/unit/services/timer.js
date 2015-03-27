'use strict';

var chai            = require('chai'),
    _               = require('lodash'),
    expect          = require('chai').expect,
    timer           = require('./../../../app/services/timer.js');
    
    
describe('api.controllers.timer', function () {
    
    describe('timer.parseTimerConfig', function () {
        
        it('Should prepare proper harvest request config object for a correctly defined input command containing note', function () {
            var validCommand = "start project_name   task_name This is some note.";
            var config = timer.parseTimerConfig(validCommand);
            
            expect(config.action).to.be.equal('start');
            expect(config.projectData).to.be.a('array');
            expect(config.projectData).to.include.members([
                'project_name',
                'task_name',
                'This',
                'is', 
                'some', 
                'note.'
            ]);
           
        });
        
        it('Should throw error for invalid action name', function () {
            var invalidCommand = "invalid_action project_name   task_name ";
            expect(function () {
                timer.parseTimerConfig(invalidCommand);
            }).to.throw(Error, /Invalid action/);
            
        });
        
        it('Should throw error when invalid number of parameters in the command passed.', function () {
            var invalidCommand = "project_name   task_name ";
            expect(function () {
                timer.parseTimerConfig(invalidCommand);
            }).to.throw(Error, /Invalid number of paramerers/);
        });
    });
    
    
    describe('timer.findProject', function () {
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
            {name: 'Testing',
                code: '',
                id: 3071493,
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
                projectData : ['NEVERBLAND', 'Internal'],
                expected : {client : 1441113, project : 3058542}
            },
            {
                projectData : ['Sample', 'client', '3', 'Sample', 'project', '3'],
                expected : {client : 1447817, project : 6031218}
            }
        ];
       
        it('Should find best matches for given array of project name/task name keys and daily harvest available projects.', function () {
            _.each(projectDataSamples, function (sample) {
                var expected = sample.expected,
                    projectData = sample.projectData;
                    
                var project = timer.findProject(projectData, projects);
                expect(project).to.be.a('object');
                expect(project).to.deep.equal(expected);
            });
        });
    });
    
});
    