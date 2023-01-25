'use strict';
const itParam = require('mocha-param');
const expect = require('chai').expect;
const assert = require('chai').assert;
const winston = require('./config/winston_test.js');

const fs = require('fs')
const fetch_file = require('./../fetch_module_descriptor.js')
const RetrievedValues = require('./../RetrievedValues.js');
const NodeParameterNames = require('./../Definitions/Text_NodeParameterNames.js');



// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), but can't be changed through reassigment or redeclared


describe('fetch_module_descriptor tests', function(){

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------ fetch_module_descriptor unit tests ------------'});
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



    //
	it("test_module_descriptor_read_pass", function () {
		
		// setup module variables
		RetrievedValues.data["NAME"] = 'CANTEST'; 
		RetrievedValues.data["nodeParameters"]["1"] = { "value": '165', "name": NodeParameterNames[1] };
		RetrievedValues.data["nodeParameters"]["7"] = { "value": '2', "name": NodeParameterNames[7] };
		RetrievedValues.data["nodeParameters"]["2"]  = { "value": '117', "name": NodeParameterNames[2] };
		
        var module_descriptor = fetch_file.module_descriptor('./unit_tests/module_descriptors/', RetrievedValues);
        assert.exists(module_descriptor, 'test module_descriptor exists');
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor, null, "    ")}`});
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor.nodeParameters["0"].name)}`});
        winston.info({message: 'UNIT TEST: module_descriptor_read ended'});
    })

	it("test_module_descriptor_read_fail", function () {
		// setup module variables
		RetrievedValues.data["NAME"] = 'UNKNOWN'; 
		RetrievedValues.data["nodeParameters"]["1"] = { "value": '165', "name": NodeParameterNames[1]};
		RetrievedValues.data["nodeParameters"]["7"] = { "value": '2' , "name": NodeParameterNames[7]};
		RetrievedValues.data["nodeParameters"]["2"]  = { "value": '117' , "name": NodeParameterNames[2]};
		
		// delete existing file if there
		try {
			fs.unlinkSync('./unit_tests/module_descriptors/UNKNOWN_165_2_117.json')
		} catch (err) {
		}

        var module_descriptor = fetch_file.module_descriptor('./unit_tests/module_descriptors/', RetrievedValues);
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor, null, "    ")}`});
		
        assert.exists(module_descriptor, 'test module_descriptor exists');

        winston.info({message: 'UNIT TEST: module_descriptor_read ended'});
    })


})