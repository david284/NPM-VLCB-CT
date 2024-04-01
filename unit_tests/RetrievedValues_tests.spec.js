'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const RetrievedValues = require('./../RetrievedValues.js');
const utils = require('./../utilities.js');
var assert = require('chai').assert;
const FLAGS = require('./../Definitions/Flags_definitions.js')



describe('RetrievedValues unit tests', function(){


	before(function() {
    utils.DisplayUnitTestHeader('RetrievedValues unit tests');
    RetrievedValues.setFilePath('./unit_tests/logs/Retrieved Values unit test.txt');
	})
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      winston.debug({message: 'UNIT TEST: RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, "    ")});
      utils.DisplayUnitTestFooter('RetrievedValues unit tests finished');
      setTimeout(function(){
        // timeout to allow the finish text above to print
        done();
      }, 100);
		}, 100);
  });





///////////////////////////////////////////////////////////////////////////////
//
// 						Generic test cases
//

function GetTestCase_Boolean() {
		var arg1, testCases = [];
		for (var a = 1; a< 3; a++) {
			if (a == 1) {arg1 = true}
			if (a == 2) {arg1 = false}
			testCases.push({'arg1':arg1});
		}
		return testCases;
	}

///////////////////////////////////////////////////////////////////////////////
//
// 						Tests
//

    //
	it("Node Number test", function () {
		winston.info({message: 'UNIT TEST: BEGIN Node Number test'});
    RetrievedValues.setNodeNumber(300);
		expect(RetrievedValues.getNodeNumber()).to.equal(300);
		winston.info({message: 'UNIT TEST: END Node Number test'});
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

	itParam("isVLCB test ${JSON.stringify(value)}", GetTestCase_Boolean(), function (value) {
		winston.info({message: 'UNIT TEST: BEGIN isVLCB test'});
		//condition ? true : false
		value.arg1 ? RetrievedValues.addNodeParameter(8, FLAGS.VLCB) : RetrievedValues.addNodeParameter(8, 0);
		var result = RetrievedValues.isVLCB();
		winston.info({message: 'UNIT TEST: returned result ' + result});
		expect(result).to.equal(value.arg1);
		winston.info({message: 'UNIT TEST: END isVLCB test'});
    })


///////////////////////////////////////////////////////////////////////////////
//
// Service related tests
//


    //
	it("Add Service test", function () {
		winston.info({message: 'UNIT TEST: BEGIN Add Service test'});
    RetrievedValues.clearAllServices();
    RetrievedValues.addService(1,2,3);
    winston.debug({message: 'Constructed object \n' + JSON.stringify(RetrievedValues.data.Services, null, '    ')});        
		expect(RetrievedValues.data.Services[1].ServiceIndex).to.equal(1);
		expect(RetrievedValues.data.Services[1].ServiceType).to.equal(2);
		expect(RetrievedValues.data.Services[1].ServiceVersion).to.equal(3);
		winston.info({message: 'UNIT TEST: END Add Service test'});
  })

  //
  it("Add Undefined Service test", function () {
    winston.info({message: 'UNIT TEST: BEGIN Add Undefined Service test'});
    RetrievedValues.clearAllServices();
    RetrievedValues.addService(2,9999,3);
    winston.debug({message: 'Constructed object \n' + JSON.stringify(RetrievedValues.data.Services, null, '    ')});        
    expect(RetrievedValues.data.Services[2].ServiceIndex).to.equal(2);
    expect(RetrievedValues.data.Services[2].ServiceType).to.equal(9999);
    expect(RetrievedValues.data.Services[2].ServiceVersion).to.equal(3);
    winston.info({message: 'UNIT TEST: END Add Undefined Service test'});
  })

  //
	it("Add Service Data test", function () {
		winston.info({message: 'UNIT TEST: BEGIN Add Service Data test'});
    RetrievedValues.addService(2,2,3);
		//
    RetrievedValues.addServiceData(2,3,4,5,6);
    winston.debug({message: 'Constructed object \n' + JSON.stringify(RetrievedValues.data.Services, null, '    ')});        
		expect(RetrievedValues.data.Services[2].ServiceIndex).to.equal(2);
		expect(RetrievedValues.data.Services[2].Data1).to.equal(3);
		expect(RetrievedValues.data.Services[2].Data2).to.equal(4);
		expect(RetrievedValues.data.Services[2].Data3).to.equal(5);
		expect(RetrievedValues.data.Services[2].Data4).to.equal(6);
		winston.info({message: 'UNIT TEST: END Add Service Data test'});
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
			if (a == 1) {arg1 = 1; arg2 = "STATUS";}
			if (a == 2) {arg1 = 255; arg2 = "Unknown Diagnostic Code";}
			testCases.push({'DiagnosticCode':arg1, 'DiagnosticName': arg2});
		}
		return testCases;
	}

    //
	itParam("Add Diagnostic Code test ${JSON.stringify(value)}", GetTestCase_DiagnosticCode(), function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN Add Diagnostic Code test: ' + JSON.stringify(value)});
    var serviceIndex = 5
    RetrievedValues.addService(serviceIndex,1,1);		// add index 5, type 1 (MNS), version 1
		//
    var result = RetrievedValues.addDiagnosticCode(serviceIndex, value.DiagnosticCode, 2);
    winston.info({message: 'result: ' + result});        
		expect(result).to.equal(true);
		expect(RetrievedValues.data.Services[serviceIndex].ServiceIndex).to.equal(serviceIndex);      // double check service index added properly
		expect(RetrievedValues.data.Services[serviceIndex].diagnostics[value.DiagnosticCode].DiagnosticName).to.equal(value.DiagnosticName);
		expect(RetrievedValues.data.Services[serviceIndex].diagnostics[value.DiagnosticCode].DiagnosticCode).to.equal(value.DiagnosticCode);
		expect(RetrievedValues.data.Services[serviceIndex].diagnostics[value.DiagnosticCode].DiagnosticValue).to.equal(2);
		winston.info({message: 'UNIT TEST:: END Add Diagnostic Code test: '});
  })


    //
	itParam("Add Diagnostic Code Invalid Service test ${JSON.stringify(value)}", GetTestCase_DiagnosticCode(), function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN Add Diagnostic Code Invalid Service test: ' + JSON.stringify(value)});
    var serviceIndex = 255  // use service index 255 - doesn't exist
    RetrievedValues.addService(5,1,1);		// add index 5, type 1 (MNS), version 1
		//
    var result = RetrievedValues.addDiagnosticCode(serviceIndex, value.DiagnosticCode, 2);
    winston.info({message: 'result: ' + result});        
		expect(result).to.equal(false);
		winston.info({message: 'UNIT TEST:: END Add Diagnostic Invalid Service Code test: '});
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
		winston.info({message: 'UNIT TEST: BEGIN Retrieved values write to disk test'});
    RetrievedValues.writeToDisk('./unit_tests/logs/Retrieved Values unit test.txt');
  })


})