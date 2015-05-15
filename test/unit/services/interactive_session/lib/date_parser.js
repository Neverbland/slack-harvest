/*jshint node: true*/
'use strict';

var expect          = require('chai').expect,
    dateParser      = require('./../../../../../app/services/interactive_session/lib/date_parser.js'),
    _               = require('lodash')
;


describe('date_parser', function () {
    
    describe('date_parser.getDefault', function () {
        it('Should return same instance of Parser', function () {
            expect(dateParser.getDefault()).to.equal(dateParser.getDefault());
            expect((dateParser.getDefault()).constructor.name).to.be.equal('Parser');
        });
    });
    
    describe('date_parser.createDefault', function () {
        it('Should not return same instance of Parser', function () {
            expect(dateParser.createDefault()).to.not.equal(dateParser.createDefault());
            expect((dateParser.createDefault()).constructor.name).to.be.equal('Parser');
        });
    });
    
    
    describe('date_parser.error', function () {
        it('Should reference the constructor of DateError', function () {
            expect((new dateParser.error()).constructor.name).to.be.equal('DateError');
        });
    });
    
    
    describe('Parser.parse', function () {
        it('Should be able to parse the date format: dd-mm-yyyy or dd/mm/yyyy or dd.mm.yyyy or dd mm yyyy', function () {
            
            var dates = [
                {given : '22-05-2015', expected : '20150522'},
                {given : '22/05/2015', expected : '20150522'},
                {given : '22.05.2015', expected : '20150522'},
                {given : '22 05 2015', expected : '20150522'}
                
            ];
            
            _.each(dates, function (timeObject) {
                var given = timeObject.given,
                    expected = timeObject.expected
                ;
                
                expect(dateParser.getDefault().parse(given)).to.be.equal(expected);
            });
        });
        
        it ('Should throw DateError instance if given time string cannot be parsed', function () {
            var invalidDate = 'this is an invalid time string';
            expect(function () {
                dateParser.getDefault().parse(invalidDate);
            }).to.throw(dateParser.error);
        });
    });
});