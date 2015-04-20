'use strict';

var expect   = require('chai').expect,
    tools    = require('./../../../app/services/tools'),
    _        = require('lodash'),
    exampleEntries = [
        {day_entry:
                    {id: 311036476,
                        notes: '',
                        spent_at: '2015-03-16',
                        hours: 1.6,
                        user_id: 449849,
                        project_id: 2,
                        task_id: 1815946,
                        created_at: '2015-03-16T15:00:02Z',
                        updated_at: '2015-03-17T08:28:27Z',
                        adjustment_record: false,
                        timer_started_at: null,
                        is_closed: false,
                        is_billed: false}},
        {day_entry:
                    {id: 310859756,
                        notes: '',
                        spent_at: '2015-03-16',
                        hours: 6.55,
                        user_id: 449849,
                        project_id: 2,
                        task_id: 1815946,
                        created_at: '2015-03-16T08:27:20Z',
                        updated_at: '2015-03-16T15:00:02Z',
                        adjustment_record: false,
                        timer_started_at: null,
                        is_closed: false,
                        is_billed: false}},
        {day_entry:
                    {id: 311351742,
                        notes: 'Harvest - Slack integration',
                        spent_at: '2015-03-17',
                        hours: 3.08,
                        user_id: 449849,
                        project_id: 3,
                        task_id: 1815946,
                        created_at: '2015-03-17T08:28:51Z',
                        updated_at: '2015-03-17T14:44:31Z',
                        adjustment_record: false,
                        timer_started_at: null,
                        is_closed: false,
                        is_billed: false}},
        {day_entry:
                    {id: 311471459,
                        notes: 'PL Office devs meeting',
                        spent_at: '2015-03-17',
                        hours: 0.99,
                        user_id: 449849,
                        project_id: 1,
                        task_id: 1815946,
                        created_at: '2015-03-17T14:44:31Z',
                        updated_at: '2015-03-17T15:43:58Z',
                        adjustment_record: false,
                        timer_started_at: null,
                        is_closed: false,
                        is_billed: false}},
        {day_entry:
                    {id: 311371886,
                        notes: '',
                        spent_at: '2015-03-17',
                        hours: 2.72,
                        user_id: 449849,
                        project_id: 3,
                        task_id: 1815946,
                        created_at: '2015-03-17T09:55:59Z',
                        updated_at: '2015-03-17T13:46:44Z',
                        adjustment_record: false,
                        timer_started_at: null,
                        is_closed: false,
                        is_billed: false}},
        {day_entry:
                    {id: 311388706,
                        notes: 'RockHound',
                        spent_at: '2015-03-17',
                        hours: 1.33,
                        user_id: 449849,
                        project_id: 2,
                        task_id: 1815946,
                        created_at: '2015-03-17T11:12:32Z',
                        updated_at: '2015-03-17T16:35:54Z',
                        adjustment_record: false,
                        timer_started_at: null,
                        is_closed: false,
                        is_billed: false}},
        {day_entry:
                    {id: 311774684,
                        notes: 'Slack - Harvest integration',
                        spent_at: '2015-03-18',
                        hours: 4.18,
                        user_id: 449849,
                        project_id: 3,
                        task_id: 1815946,
                        created_at: '2015-03-18T09:07:21Z',
                        updated_at: '2015-03-18T15:56:44Z',
                        adjustment_record: false,
                        timer_started_at: null,
                        is_closed: false,
                        is_billed: false}},
        {day_entry:
                    {id: 311767624,
                        notes: '',
                        spent_at: '2015-03-18',
                        hours: 3.67,
                        user_id: 449849,
                        project_id: 1,
                        task_id: 1815946,
                        created_at: '2015-03-18T08:34:59Z',
                        updated_at: '2015-03-18T16:25:27Z',
                        adjustment_record: false,
                        timer_started_at: null,
                        is_closed: false,
                        is_billed: false}}

    ];


describe ('Prototypes and object modifications', function () {
    
    describe('Object.size', function () {
    
        it ('Should add a method that would result with similar output to Array.prototype.length property but on hash table-ish objects.', function () {
            var input = [
                {
                    given : {},
                    expected : 0
                },
                {
                    given : {
                        property1: "value 1",
                        property2: "value 2",
                        'property 3': "value 3"
                    },
                    expected : 3
                }
            ];

            _.each(input, function (givenObject) {
                var given = givenObject.given,
                    expected = givenObject.expected
                ;

                expect(Object.size(given)).to.be.equal(expected);
            });
        });
    });
});


describe('tools', function () {
    describe('tools.formatTime', function () {
        it ('Should return time in HH:MM format for given float number of hours.', function () {
            var input = [
                { given : 1, expected : "01:00"},
                { given : 1.5, expected : "01:30"},
                { given : 2.29, expected : "02:17"},
                { given : 2.31, expected : "02:18"},
                { given : 34.20, expected : "34:12"},
            ];


            _.each(input, function (value) {
                var expected = value.expected,
                    given = value.given,
                    returned = tools.formatTime(given);

                    expect(returned).to.equal(expected);
            });
        });
    });
    
    describe('tools.getIds', function () {
        it ('Should return an array of unique ids for given array of entries with defined parameters', function () {
            var given = exampleEntries,
            expected = [1,2,3],
            returned = tools.getIds(given, 'day_entry', 'project_id'),
            emptyReturned = tools.getIds([], 'day_entry', 'project_id');
            
            expect(returned).to.be.a('array');
            expect(returned).to.include.members(expected);
            
            expect(emptyReturned).to.be.a('array');
            expect(emptyReturned).to.be.empty;
        });
    });
    
    
    describe('tools.byId', function () {
        it ('Should return an object of objects from given array but each stored under key representing it\'s id and simplified.', function () {
            var given = exampleEntries,
            expected = {
                '311036476' : given[0]['day_entry'],
                '310859756' : given[1]['day_entry'],
                '311351742' : given[2]['day_entry'],
                '311471459' : given[3]['day_entry'],
                '311371886' : given[4]['day_entry'],
                '311388706' : given[5]['day_entry'],
                '311774684' : given[6]['day_entry'],
                '311767624' : given[7]['day_entry'],
                
            },
            returned = tools.byId(given, 'day_entry'),
            emptyReturned = tools.byId([], 'day_entry');
            
            expect(returned).to.be.a('object');
            expect(returned).to.be.deep.equal(expected);
            
            expect(emptyReturned).to.be.a('object');
            expect(emptyReturned).to.be.empty;
        });
    });
    
    
    describe('tools.getHours', function () {
        it ('Should return a total number of hours for given resource.', function () {
            var input = [
                {given : {hours : 2.5}, expected : 2.5},
                {given : {hours : 0.1}, expected : 0.1},
                {given : {hours : 0.1, hours_with_timer : 5}, expected : 5},
                {given : {hours : 3, hours_with_timer : 1}, expected : 3},
                {given : {hours : 0, hours_with_timer : 0}, expected : 0},
            ];


            _.each(input, function (value) {
                var expected = value.expected,
                    given = value.given,
                    returned = tools.getHours(given);

                    expect(returned).to.equal(expected);
            });
        });
    });
    
    
    
    describe('tools.validateGet', function () {
        it ('Should return a value of given object for given key', function () {
            var input = [
                {given : {someKey : 'Some Value'}, expected : "Some Value"},
                {given : {someKey : 1}, expected : 1},
                {given : {someKey : true}, expected : true},
                {given : {someKey : false}, expected : false}
            ];
            

            _.each(input, function (value) {
                var expected = value.expected,
                    given = value.given,
                    returned = tools.validateGet(given, 'someKey');

                    expect(returned).to.equal(expected);
            });
        });
        
        it ('Should throw an error with expected default message if value is not present', function () {
            var given = {
                someKey : 'Some value'
            };
            expect(function () {
                tools.validateGet(given, 'param');
            }).to.throw(Error, 'Param param does not exist.')
        });
        
        it ('Should throw an error with expected defined message if value is not present', function () {
            var given = {
                    someKey : 'Some value'
                },
                errorMessage = 'Some error message';
            expect(function () {
                tools.validateGet(given, 'param', errorMessage);
            }).to.throw(Error, errorMessage)
        });
    });
});