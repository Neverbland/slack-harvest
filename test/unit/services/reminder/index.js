'use strict';

var expect          = require('chai').expect,
    slack           = require('./../../../../app/services/slack')('default'),
    harvest         = require('./../../../../app/services/harvest')('default'),
    requestMock,
    dayEntriesMock,
    reminder        = require('./../../../../app/services/reminder/index.js')
;


dayEntriesMock = {
    some_user1 : [],
    some_user2 : [{day_entry:
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
                        is_billed: false}}],
    some_user3 : []
};


describe('reminder', function () {
    
    describe('remind', function () {
        
        it('Should send reminder messages to all people whose harvest day entries reports are empty.', function (done) {
            var users = {
                    '1234' : 'some_user1',
                    '2345' : 'some_user2',
                    '3456' : 'some_user3'
                }, 
                counter = 0,
                sendMessage = slack.sendMessage
            ;
            
            harvest.users = users;
            
            slack.sendMessage = function (text, config, callback) 
            {
                expect(text).to.be.equal([
                    'You have no tasks running on *Harvest*!',
                    'Click here <https://neverbland.harvestapp.com/time> to add them or use the timer command on Slack'
                ].join('\n'));
                callback(null, true, '');
            };
            
            harvest.harvest.client.get = function (url, data, cb) {
                counter++;
                var userId = (function (url) {
                        var split = url.split('/entries');
                        return split[0].split('/people/')[1];
                    })(url),
                    slackName = users[userId],
                    entries = dayEntriesMock[slackName]
                ;
                cb(null, entries);
            };
            
            reminder.remind(users, null, function (results) {

                slack.sendMessage = sendMessage;
                expect(counter).to.be.equal(3);
                expect(results).to.be.a('object');
                expect(results.successes).to.be.a('object');
                expect(results.errors).to.be.a('object');
                expect(results.notified).to.be.a('object');
                
                
                expect(results.successes).to.be.deep.equal({
                    '1234' : 'some_user1',
                    '2345' : 'some_user2',
                    '3456' : 'some_user3'
                });
                
                expect(results.notified).to.be.deep.equal({
                    '1234' : 'some_user1',
                    '3456' : 'some_user3'
                });
                
                expect(results.errors).to.be.deep.equal({});
                
                done();
            });
        });
    });
});

