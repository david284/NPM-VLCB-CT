'use strict';
const winston = require('./config/winston.js');
const fs = require('fs');
var pjson = require('./package.json');
const readline = require('readline');
const files = require('./copy_files.js');
		

const IP_Network = require('./ip_network.js')
const SetupMode_tests = require('./Tests_SetupMode.js');
const MNS_tests = require('./Tests_MinimumNodeService.js');
const example_tests = require('./Tests_examples.js');
const fetch_file = require('./fetch_module_descriptor.js')
const Service_Definitions = require('./Definitions/Service_Definitions.js');
const NVS_tests = require('./Tests_NodeVariableService.js');
const CAN_tests = require('./Tests_CANService.js');
const Teaching_tests = require('./Tests_TeachingService.js');
const Producer_tests = require('./Tests_ProducerService.js');
const Consumer_tests = require('./Tests_ConsumerService.js');
const callback_tests = require('./Tests_callback.js');
let RetrievedValues = require('./RetrievedValues.js');		// can't be const as we re-declare it with returned object


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
winston.info({message: '--------------------------------------------------------------------------------'});
winston.info({message: '- Test Version : ' + pjson.version});
winston.info({message: '- Test Run : ' + new Date()});
winston.info({message: '================================================================================'});
winston.info({message: ' '});

// create network connection for tests to use
const  Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);

// create instances of tests
const SetupMode = new SetupMode_tests.SetupMode_tests(Network);
const MNS = new MNS_tests.MinimumNodeServiceTests(Network);
const NVS = new NVS_tests.NodeVariableServiceTests(Network);
const CAN = new CAN_tests.CANServiceTests(Network);
const Teaching = new Teaching_tests.TeachingServiceTests(Network);
const Producer = new Producer_tests.ProducerServiceTests(Network);
const Consumer = new Consumer_tests.ConsumerServiceTests(Network);
const examples = new example_tests.ExampleTests(Network);
const callback = new callback_tests.callbackTests(Network);


// Now setup for console input to get the node number of the module we're testing

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

winston.info({message: ' ==== enter node number to be tested, followed by enter'});
winston.info({message: ' ==== or just enter if putting module into setup using the button'});

// This will prompt for the node number, and then run the tests
rl.question('\n Enter Node number > ', function(answer) {
	RetrievedValues.setNodeNumber(parseInt(answer));	// store nodenumber for use by tests
	winston.info({message: ' '});
	winston.info({message: 'MERGLCB: ==== Node number entered - ' + RetrievedValues.getNodeNumber()});
	winston.info({message: ' '});
	runtests();
});



// Block to call tests to ensure they run in sequence
// this relies on the underlying functions being themselves async functions, which can be called with an 'await' method
// Only code within this code block will be executed in sequence
async function runtests() {
	// RetrievedValues is used to store information gleaned from the module under test
	// and is shared with, & updated by, all tests
							
	// attach callback tests to network, to manage unsolicited messages from modules
	callback.attach(RetrievedValues);

	// now run setup mode tests
	RetrievedValues = await (SetupMode.runTests(RetrievedValues));
	
	if (RetrievedValues.data.setup_completed){
		// now setup mode completed, we should have retrieved all the identifying info about the module (RQMN & RQNP)
		// so fetch matching module descriptor file
		var module_descriptor = fetch_file.module_descriptor('./module_descriptors/', RetrievedValues); 			
		
		// now do all the other tests - passing in RetrievedValues & module_descriptor
		// capture returned RetrievedValues as it may be updated
		RetrievedValues = await (MNS.runTests(RetrievedValues, module_descriptor));
		

		// now do tests dependant on the retrieved service types the nodule supports
		for (var key in RetrievedValues.data["Services"]) {
			var serviceIndex = RetrievedValues.data["Services"][key]["ServiceIndex"];
			var serviceType = RetrievedValues.data["Services"][key]["ServiceType"];
			switch (serviceType) {
				case 1:
					// already run MNS tests, so can ignore this case
					break;
				case 2:
					RetrievedValues = await (NVS.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 3:
					RetrievedValues = await (CAN.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 4:
					RetrievedValues = await (Teaching.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 5:
					RetrievedValues = await (Producer.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 6:
					RetrievedValues = await (Consumer.runTests(RetrievedValues, module_descriptor, serviceIndex));
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
	// Now do any checks on RetrievedValues
	//	
	if (RetrievedValues.data.HEARTB == 'passed') {
		winston.info({message: '\nHEARTB passed\n'});
		RetrievedValues.data.TestsPassed++;
	} else {
		winston.info({message: '\nHEARTB failed\n'});
		RetrievedValues.data.TestsFailed++;
	}
		

	//
	// all tests done, so do final items
	//
	winston.info({message: '\n\nAll Tests finished' 
				+ '\n Passed count : ' + RetrievedValues.data.TestsPassed 
				+ '\n Failed count : ' + RetrievedValues.data.TestsFailed + '\n'});

	
	// now write RetrievedValues to disk
	RetrievedValues.writeToDisk('./Test_Results/Retrieved Values.txt');
	
	
	

	Network.closeConnection()
	winston.info({message: '\nMERGLCB: End of test sequence\n'});
	winston.info({message: '\nMERGLCB: a copy of these results has been saved in folder \Test_Results\n'});
	rl.close();
	process.stdin.destroy();
	
	files.copyFiles();
}








