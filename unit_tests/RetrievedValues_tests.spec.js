'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const RetrievedValues = require('./../RetrievedValues.js');


// Assert style
var assert = require('chai').assert;



describe('RetrievedValues tests', function(){


	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '--------------- Retrieved Values unit tests ----------------'});
		winston.info({message: '============================================================'});
		winston.info({message: ' '});


	})
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
        // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
            // timeout to allow tests to print
            winston.info({message: ' '});   // blank line to separate tests
            winston.info({message: 'UNIT TEST: tests finished '});
            setTimeout(function(){
                    // timeout to allow the finish text above to print
                     done();
            }, 100);
		}, 100);
    });


///////////////////////////////////////////////////////////////////////////////
//
// 						Testing examples tests
//

    //
	it("RetrievedValues Constructor test", function () {
        winston.info({message: 'Constructed object \n' + JSON.stringify(RetrievedValues.retrieved_values, null, '    ')});        
		expect(RetrievedValues.getNodeNumber()).to.be.null;
    })

    //
	it("Node Number test", function () {
        RetrievedValues.setNodeNumber(300);
		expect(RetrievedValues.getNodeNumber()).to.equal(300);
    })


    //
	it("Add Service test", function () {
        RetrievedValues.addService(1,2,3);
        winston.info({message: 'Constructed object \n' + JSON.stringify(RetrievedValues.data, null, '    ')});        
		expect(RetrievedValues.data.Services[1].ServiceIndex).to.equal(1);
		expect(RetrievedValues.data.Services[1].ServiceType).to.equal(2);
		expect(RetrievedValues.data.Services[1].ServiceVersion).to.equal(3);
    })


    //
	it("Add Service Data test", function () {
        RetrievedValues.addService(2,2,3);
		//
        RetrievedValues.addServiceData(2,3,4,5,6);
        winston.info({message: 'Constructed object \n' + JSON.stringify(RetrievedValues.data, null, '    ')});        
		expect(RetrievedValues.data.Services[2].ServiceIndex).to.equal(2);
		expect(RetrievedValues.data.Services[2].Data1).to.equal(3);
		expect(RetrievedValues.data.Services[2].Data2).to.equal(4);
		expect(RetrievedValues.data.Services[2].Data3).to.equal(5);
		expect(RetrievedValues.data.Services[2].Data4).to.equal(6);
    })


    function GetTestCase_DiagnosticCode() {
		var arg1, arg2, testCases = [];
		for (var a = 1; a< 3; a++) {
			if (a == 1) {arg1 = 999; arg2 = "Unknown Diagnostic Code";}
			if (a == 2) {arg1 = 5; arg2 = "STATUS";}
			testCases.push({'ServiceIndex':arg1, 'DiagnosticName': arg2});
		}
		return testCases;
	}

    //
//	it("Add Diagnostic Code test", function () {
	itParam("Add Diagnostic Code test ${JSON.stringify(value)}", GetTestCase_DiagnosticCode(), function (value) {
        RetrievedValues.addService(5,1,1);		// add index 5, type 1 (MNS), version 1
		//
        RetrievedValues.addDiagnosticCode(value.ServiceIndex, 1, 2);
        winston.info({message: 'Constructed object \n' + JSON.stringify(RetrievedValues.data, null, '    ')});        
		expect(RetrievedValues.data.Services[value.ServiceIndex].ServiceIndex).to.equal(value.ServiceIndex);
		expect(RetrievedValues.data.Services[value.ServiceIndex].diagnostics[1].DiagnosticName).to.equal(value.DiagnosticName);
		expect(RetrievedValues.data.Services[value.ServiceIndex].diagnostics[1].DiagnosticCode).to.equal(1);
		expect(RetrievedValues.data.Services[value.ServiceIndex].diagnostics[1].DiagnosticValue).to.equal(2);
    })


    //
	it("RetrievedValues Write test", function () {
        RetrievedValues.writeToDisk('./unit_tests/Retrieved Values unit test.txt');
    })


})