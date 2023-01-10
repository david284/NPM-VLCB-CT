'use strict';
const winston = require('./config/winston.js');
const IP_Network = require('./ip_network.js')
const SetupMode_tests = require('./SetupModeTests.js');
const MNS_tests = require('./MinimumNodeServiceTests.js');
const example_tests = require('./exampletests.js');
const fetch_file = require('./fetch_module_descriptor.js')
const ServiceTypeNames = require('./ServiceTypeNames.js');



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

	// retrieved_values is used to store information gleaned from the module under test, and share it between tests
	var retrieved_values = await (SetupMode.runTests());
	
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
	winston.debug({message: 'MERGLCB: retrieved_values ' + JSON.stringify(retrieved_values)});
	
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
		


	// tests done, close connection
	Network.closeConnection()
	winston.info({message: '\nMERGLCB: End of test sequence\n'});
}

// actually invoke block of tests
// (can't use async on top level code)
runtests();







