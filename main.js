'use strict';
const winston = require('./config/winston.js');
const fs = require('fs');
var pjson = require('./package.json');
const readline = require('readline');
const files = require('./copy_files.js');
		

const utils = require('./utilities.js');
const IP_Network = require('./ip_network.js')
const fetch_file = require('./fetch_module_descriptor.js')
const Service_Definitions = require('./Definitions/Service_Definitions.js');
let RetrievedValues = require('./RetrievedValues.js');		// can't be const as we re-declare it with returned object

const example_tests = require('./Tests_examples.js');
const callback_tests = require('./Tests_callback.js');
const SetupMode_tests = require('./Tests_SetupMode.js');

const Type1_MNS = require('./Services/Type1_MinimumNodeService.js');
const Type2_NVS = require('./Services/Type2_NodeVariableService.js');
const Type3_CAN = require('./Services/Type3_CANService.js');
const Type4_Teaching = require('./Services/Type4_TeachingService.js');
const Type5_Producer = require('./Services/Type5_ProducerService.js');
const Type6_Consumer = require('./Services/Type6_ConsumerService.js');
const Type9_EventAck = require('./Services/Type9_EventAcknowledgeService.js');
const Type10_Bootloader = require('./Services/Type10_BootloaderService.js');
const Type11_Bootloader2 = require('./Services/Type11_Bootloader2Service.js');
const Type12_FastClock = require('./Services/Type12_FastClockService.js');
const Type13_DCC_CAB = require('./Services/Type13_DCC_CAB_Service.js');
const Type14_DCC_CMD = require('./Services/Type14_DCC_CMD_Service.js');
const Type15_CANBridge = require('./Services/Type15_CANBridgeService.js');
const Type16_SLiM = require('./Services/Type16_SLiMService.js');
const Type17_LongMessage = require('./Services/Type17_LongMessageService.js');


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
const examples = new example_tests.ExampleTests(Network);
const callback = new callback_tests.callbackTests(Network);
const SetupMode = new SetupMode_tests.SetupMode_tests(Network);
//
const MNS = new Type1_MNS.MinimumNodeServiceTests(Network);
const NVS = new Type2_NVS.NodeVariableServiceTests(Network);
const CAN = new Type3_CAN.CANServiceTests(Network);
const Teaching = new Type4_Teaching.TeachingServiceTests(Network);
const Producer = new Type5_Producer.ProducerServiceTests(Network);
const Consumer = new Type6_Consumer.ConsumerServiceTests(Network);
const EventAck = new Type9_EventAck.EventAcknowledgeServiceTests(Network);
const Bootloader = new Type10_Bootloader.BootloaderServiceTests(Network);
const Bootloader2 = new Type11_Bootloader2.Bootloader2ServiceTests(Network);
const FastClock = new Type12_FastClock.FastClockServiceTests(Network);
const DCC_CAB = new Type13_DCC_CAB.DCC_CAB_ServiceTests(Network);
const DCC_CMD = new Type14_DCC_CMD.DCC_CMD_ServiceTests(Network);
const CANBridge = new Type15_CANBridge.CANBridgeServiceTests(Network);
const SLiM = new Type16_SLiM.SLiMServiceTests(Network);
const LongMessage = new Type17_LongMessage.LongMessageServiceTests(Network);


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
				// service types 7 & 8 currently unused
				case 9:
					RetrievedValues = await (EventAck.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 10:
					RetrievedValues = await (Bootloader.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 11:
					RetrievedValues = await (Bootloader2.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 12:
					RetrievedValues = await (FastClock.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 13:
					RetrievedValues = await (DCC_CAB.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 14:
					RetrievedValues = await (DCC_CMD.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 15:
					RetrievedValues = await (CANBridge.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 16:
					RetrievedValues = await (SLiM.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;
				case 17:
					RetrievedValues = await (LongMessage.runTests(RetrievedValues, module_descriptor, serviceIndex));
					break;


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
		utils.processResult(RetrievedValues, true, 'HEARTB');
	} else {
		utils.processResult(RetrievedValues, false, 'HEARTB');
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
	rl.close();
	process.stdin.destroy();
	
	files.copyFiles(RetrievedValues.data.DescriptorIdentity);
}








