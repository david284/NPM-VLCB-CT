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
// 						Tests
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


///////////////////////////////////////////////////////////////////////////////
//
// Node Parameter related tests
//


    //
	it("Add Node Parameter test", function () {
		winston.info({message: 'UNIT TEST: BEGIN Add Node Parameter test'});
        RetrievedValues.addNodeParameter(1,2);
        winston.info({message: 'UNIT TEST: Node Parameters\n' + JSON.stringify(RetrievedValues.data.nodeParameters, null, '    ')});        
		expect(RetrievedValues.data.nodeParameters[1].name).to.equal("Manufacturer’s Id");
		expect(RetrievedValues.data.nodeParameters[1].value).to.equal(2);
		winston.info({message: 'UNIT TEST: END Add Node Parameter test'});
    })


///////////////////////////////////////////////////////////////////////////////
//
// Service related tests
//


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


    function GetTestCase_ServiceToString() {
		var arg1, arg2, testCases = [];
		for (var a = 1; a< 3; a++) {
			if (a == 1) {arg1 = 888; arg2 = "ServiceIndex 888 No matching service found";}
			if (a == 2) {arg1 = 5; arg2 = "ServiceIndex 5 ServiceType 1 ServiceVersion 1 - Minimum Node Service";}
			testCases.push({'ServiceIndex':arg1, 'expectedResult': arg2});
		}
		return testCases;
	}

	itParam("Service To String test ${JSON.stringify(value)}", GetTestCase_ServiceToString(), function (value) {
		winston.info({message: 'UNIT TEST: BEGIN Service To String test'});
        RetrievedValues.addService(5,1,1);				// add index 5, type 1 (MNS), version 1
		//
		var result = RetrievedValues.ServiceToString(value.ServiceIndex);
		winston.info({message: 'UNIT TEST: returned string: ' + result});
		expect(result).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST: END Service To String test'});
    })


    function GetTestCase_ServiceDataToString() {
		var arg1, arg2, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) {arg1 = 888; arg2 = "ServiceIndex 888 No matching service found";}
			if (a == 2) {arg1 = 5; arg2 = "ServiceIndex: 5 ServiceType: 1 Data1: 3 Data2: 4 Data3: 5 Data4: 6";}
			if (a == 3) {arg1 = 6; arg2 = "ServiceIndex: 6 ServiceType: 1 Data1: undefined Data2: undefined Data3: undefined Data4: undefined";}
			testCases.push({'ServiceIndex':arg1, 'expectedResult': arg2});
		}
		return testCases;
	}

	itParam("Service Data To String test ${JSON.stringify(value)}", GetTestCase_ServiceDataToString(), function (value) {
		winston.info({message: 'UNIT TEST: BEGIN Service Data To String test'});
        RetrievedValues.addService(5,1,1);				// add index 5, type 1 (MNS), version 1
        RetrievedValues.addServiceData(5,3,4,5,6);		// add data for index 5
        RetrievedValues.addService(6,1,1);				// add index 6
		//
		var result = RetrievedValues.ServiceDataToString(value.ServiceIndex);
		winston.info({message: 'UNIT TEST: returned string: ' + result});
		expect(result).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST: END Service To String test'});
    })


///////////////////////////////////////////////////////////////////////////////
//
// Diagnostics related tests
//


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


    function GetTestCase_DiagnosticCodeToString() {
		var arg1, arg2, arg3, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) {arg1 = 888; arg2 = 1; arg3 = "ServiceIndex 888 - Service not found";}
			if (a == 2) {arg1 = 5; arg2 = 1; arg3 = "ServiceIndex 5 Minimum Node Service 1 DiagnosticCode 1 Value 2 - STATUS";}
			if (a == 3) {arg1 = 5; arg2 = 999; arg3 = "ServiceIndex 5 Minimum Node Service 1 DiagnosticCode 999 - Diagnostic Code not found";}
			testCases.push({'ServiceIndex':arg1, 'DiagnosticCode':arg2, 'expectedResult': arg3});
		}
		return testCases;
	}

    //
	itParam("Diagnostic Code To String test ${JSON.stringify(value)}", GetTestCase_DiagnosticCodeToString(), function (value) {
		winston.info({message: 'UNIT TEST: BEGIN Diagnostic Code To String test'});
        RetrievedValues.addService(5,1,1);				// add index 5, type 1 (MNS), version 1
        RetrievedValues.addDiagnosticCode(5, 1, 2); 	// add diagnostic code for serviceIndex 5
		//
		var result = RetrievedValues.DiagnosticCodeToString(value.ServiceIndex, value.DiagnosticCode);
		winston.info({message: 'UNIT TEST: returned string: ' + result});
		expect(result).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST: END Diagnostic Code To String test'});
    })


    //
	it("RetrievedValues Write test", function () {
        RetrievedValues.writeToDisk('./unit_tests/Retrieved Values unit test.txt');
    })


})