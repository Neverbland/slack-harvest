'use strict';

 var HarvestMock = {
    
    hasError : false,
    
    users : {},
    
    timeTrack : [{
            day_entry:
                    {
                        id: 311036476,
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
                        is_billed: false
                    }
                }],
    
    projects : [{
            project : {
                id : 2,
                name : 'Test project',
                client_id : 3
            }
    }],
    
    clients : [{
            client : {
                id : 3,
                name : 'Test client'
            }
    }],


    /**
     * Sets the users
     * 
     * @param       {Object}        users
     * @returns     {HarvestMock}   This instance
     */
    setUsers : function (users) 
    {
        this.users = users;
        return this;
    },
    
    
    /**
     * If has error, the callbacks will have an error passed
     * 
     * @param       {Boolean}       hasError
     * @returns     {HarvestMock}
     */
    setHasError : function (hasError)
    {
        this.hasError = Boolean(hasError);
        return this;
    },
    
    getUserTimeTrack : function (user_id, fromDate, toDate, callback) 
    {
        
        if (this.hasError) {
            callback('Error', []);
        } else {
            callback(null, this.timeTrack);
        }
    },
    
    
    getProjectsByIds : function (ids, callback)
    {
        if (this.hasError) {
            callback('Error', []);
        } else {
            callback(null, this.projects);
        }
    },
    
    
    getClientsByIds : function (ids, callback)
    {
        if (this.hasError) {
            callback('Error', []);
        } else {
            callback(null, this.clients);
        }
    }
    
};



module.exports = HarvestMock;