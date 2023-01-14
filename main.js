'use strict';
const winston = require('./config/winston.js');
const fs = require('fs');

const IP_Network = require('./ip_network.js')
const SetupMode_tests = require('./Tests_SetupMode.js');
const MNS_tests = require('./Tests_MinimumNodeService.js');
const example_tests = require('./Tests_examples.js');
const fetch_file = require('./fetch_module_descriptor.js')
const ServiceTypeNames = require('./Text_ServiceTypeNames.js');



// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), but can't be changed through reassigment or redeclared

const NET_ADDRESS = "127.0.0.1"
const NET_PORT = 5550;

winston.info({message: ' '});
winston.info({message: '================================================================================'});
//                      01234567890123456789012345678901234567899876543210987654321098765432109876543210
winston.info({message: '--------------------------- MERGLCB Compliance Test ----------------------------'});
winston.info({message: '------------------------------- Version 0.0.0.0 --------------------------------'});
winston.info({message: '================================================================================'});
winston.info({message: ' '});

winston.info({message: 'Test Run : ' + new Date()+ '\n'});
		
// create network conenction for tests to use
const  Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);


// create instances of tests
const SetupMode = new SetupMode_tests.SetupMode_tests(Network);
const MNS = new MNS_tests.MinimumNodeServiceTests(Network);
const examples = new example_tests.ExampleTests(Network);

// Block to call tests to ensure they run in sequence
// this relies on the underlying functions being themselves async functions, which can be called with an 'await' method
// Only code within this code block will be executed in sequence
async function runtests() {
	// retrieved_values is used to store information gleaned from the module under test
	// and is shared with, & updated by, all tests
	var retrieved_values = { "DateTime" : new Date(),	// include datetime of test run start
							"TestsPassed": 0,
							"TestsFailed": 0};	

	retrieved_values = await (SetupMode.runTests(retrieved_values));
	
	if (retrieved_values.setup_completed){
		// now setup mode completed, we should have retrieved all the identifying info about the module (RQMN & RQNP)
		// so fetch matching module descriptor file
		var module_descriptor = fetch_file.module_descriptor('./module_descriptors/', retrieved_values); 			
		
		// now do all the other tests - passing in retrieved_values & module_descriptor
		// capture returned retrieved_values as it may be updated
		retrieved_values = await (MNS.runTests(retrieved_values, module_descriptor));
		retrieved_values = await (examples.runTests(retrieved_values, module_descriptor));
		

		// check that retrieved_values is still defined, and not lost by one of the tests
		if (retrieved_values == null) {
			winston.info({message: 'MERGLCB: ****** ERROR - retrieved_values is invalid'});
		}	
		
		// now do tests dependant on the retrieved service types the nodule supports
		for (var key in retrieved_values["Services"]) {
			var serviceType = retrieved_values["Services"][key]["ServiceType"];
			switch (serviceType) {
				case 1:
					winston.info({message: 'MERGLCB: add tests for ' + ServiceTypeNames[1]});
					break;
				case 2:
					winston.info({message: 'MERGLCB: add tests for ' + ServiceTypeNames[2]});
					break;
				case 3:
					winston.info({message: 'MERGLCB: add tests for ' + ServiceTypeNames[3]});
					break;
				//
				// add more types...
				//
				default:
					winston.info({message: 'MERGLCB: unknown ServiceType ' + serviceType});
			}
			
		}
	} else {
		winston.info({message: '\nFailed to complete setup - further tests aborted\n'});
	}
		

	//
	// all tests done, so do final items
	//
	winston.info({message: '\n\nAll Tests finished \n Passed count : ' + retrieved_values.TestsPassed + '\n Failed count : ' + retrieved_values.TestsFailed + '\n'});

	
	// now write retrieved_values to disk
	var text = JSON.stringify(retrieved_values, null, '    ');
	fs.writeFileSync('./Retrieved Values.txt', text);
	winston.debug({message: 'MERGLCB: Write to disk: retrieved_values \n' + text});

	Network.closeConnection()
	winston.info({message: '\nMERGLCB: End of test sequence\n'});
	winston.info({message: '\nMERGLCB: a copy of these results has been saved as TestReport.txt\n'});
	winston.info({message: 'MERGLCB: a copy of the values retrieved from the module under test has been saved as Retrieved Values.txt\n'});

}

// actually invoke block of tests
// (can't use async on top level code)
runtests();







