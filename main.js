'use strict';
const winston = require('./config/winston.js');
const fs = require('fs');
var pjson = require('./package.json');
const readline = require('readline');
const files = require('./copy_files.js');
const CANUSB4 = require('./canusb4.js')
		

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
winston.info({message: '----------------------------- VLCB Compliance Test -----------------------------'});
winston.info({message: '--------------------------------------------------------------------------------'});
winston.info({message: '- Test Version : ' + pjson.version});
winston.info({message: '- Test Run : ' + new Date()});
winston.info({message: '================================================================================'});
winston.info({message: ' '});

let connection = null;

// Now setup for console input to get the node number of the module we're testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//
// NOTE: Much use is made of the async/await methods
// as many tests have to wait for an expected response to check if it's passed or failed
// and waiting for a function to complete (await) is only possible from an async function
// (in native node.js anyway)
//

run_main()

async function run_main(){
  if (networkSelected()){
    // create network connection for tests to use
    connection = new IP_Network(NET_ADDRESS, NET_PORT);
    winston.info({message: '---- network selected ----'});
  } else {
    let canbus4_info = {'path': null}  // seems we have to create an object so it passes by ref
    utils.findCANUSB4(canbus4_info)
    await utils.sleep(500);   // wait for serial port check to complete
    winston.debug({message: '---- canusb4 result ' + JSON.stringify(canbus4_info)});
    if (canbus4_info.path) {
      connection = new CANUSB4.CANUSB4(canbus4_info.path)
      winston.info({message: 'VLCB: CANUSB4 found ' + canbus4_info.path + '\n'});
    }else{
      winston.info({message: '\nVLCB: ******** ERROR: No CANUSB4 found - terminating \n'});
      process.exit()
    }
  }

  if (connection) {
    winston.info({message: ' ==== enter node number to be tested, followed by enter'});
    winston.info({message: ' ==== or just enter if putting module into setup using the button'});

    // This will prompt for the node number, and then run the tests
    rl.question('\n Enter Node number > ', function(answer) {
      RetrievedValues.setNodeNumber(parseInt(answer));	// store nodenumber for use by tests
      RetrievedValues.data['enteredNodeNumber'] = parseInt(answer)
      winston.info({message: ' '});
      winston.info({message: 'VLCB: ==== Node number entered - ' + RetrievedValues.getNodeNumber()});
      winston.info({message: ' '});
      runtests();                        // ok - now run actual tests.........
    });
  } else {
    // end app if no connection found (this condition should never occur, but still.....)
    winston.info({message: '\nnVLCB: ******** ERROR: no connection found - terminating \n'});
    process.exit()
  }
}


// Block to call tests to ensure they run in sequence
// this relies on the underlying functions being themselves async functions, which can be called with an 'await' method
// Only code within this code block will be executed in sequence
async function runtests() {
  // create instances of tests
  const examples = new example_tests.ExampleTests(connection);
  const callback = new callback_tests.callbackTests(connection);
  const SetupMode = new SetupMode_tests.SetupMode_tests(connection);
  //
  const MNS = new Type1_MNS.MinimumNodeServiceTests(connection);
  const NVS = new Type2_NVS.NodeVariableServiceTests(connection);
  const CAN = new Type3_CAN.CANServiceTests(connection);
  const Teaching = new Type4_Teaching.TeachingServiceTests(connection);
  const Producer = new Type5_Producer.ProducerServiceTests(connection);
  const Consumer = new Type6_Consumer.ConsumerServiceTests(connection);
  const EventAck = new Type9_EventAck.EventAcknowledgeServiceTests(connection);
  const Bootloader = new Type10_Bootloader.BootloaderServiceTests(connection);
  const Bootloader2 = new Type11_Bootloader2.Bootloader2ServiceTests(connection);
  const FastClock = new Type12_FastClock.FastClockServiceTests(connection);
  const DCC_CAB = new Type13_DCC_CAB.DCC_CAB_ServiceTests(connection);
  const DCC_CMD = new Type14_DCC_CMD.DCC_CMD_ServiceTests(connection);
  const CANBridge = new Type15_CANBridge.CANBridgeServiceTests(connection);
  const SLiM = new Type16_SLiM.SLiMServiceTests(connection);
  const LongMessage = new Type17_LongMessage.LongMessageServiceTests(connection);


	// RetrievedValues is used to store information gleaned from the module under test
	// and is shared with, & updated by, all tests

  // tell network we've started tests (enables messages to console)
  connection.testStarted = true;
							
	// attach callback tests to connection, to manage unsolicited messages from modules
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
					winston.info({message: 'VLCB:      unknown ServiceType ' + serviceType});
          utils.processResult(RetrievedValues, false, 'ServiceType');
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
	
	
	await utils.sleep(500);		// delay to allow the log writes to catch up

	connection.closeConnection()
	winston.info({message: '\nVLCB: test sequence completed'});
	rl.close();
	process.stdin.destroy();
	
	files.copyFiles(RetrievedValues.data.DescriptorIdentity);
	winston.info({message: '\n\nVLCB: End\n\n\n'});
	
}	// endRunTests()


function networkSelected() {
	// command line arguments will be 'node' <javascript file started> '--' <arguments starting at index 3>
	for (var item in process.argv){
    winston.debug({message: 'main: argv ' + item + ' ' + process.argv[item]});
    if (process.argv[item].toLowerCase() == 'network'){
      return true;
    }
	}
  return false;
}
  




