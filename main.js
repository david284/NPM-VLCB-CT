'use strict';
const winston = require('./config/winston.js');
const fs = require('fs');
var pjson = require('./package.json');
const readline = require('readline');
const files = require('./copy_files.js');
const SerialGC = require('./serialGC.js')
		

const utils = require('./utilities.js');
const IP_Network = require('./ip_network.js')
const fetch_file = require('./fetch_module_descriptor.js')
const Service_Definitions = require('./Definitions/Service_Definitions.js');
let RetrievedValues = require('./RetrievedValues.js');		// can't be const as we re-declare it with returned object

const callback_tests = require('./Test_suites/Tests_callback.js');
const SetupMode_tests = require('./Test_suites/Tests_SetupMode.js');
const Type1_MNS = require('./Test_suites/Type1_MinimumNodeService.js');
const Type2_NVS = require('./Test_suites/Type2_NodeVariableService.js');
const Type3_CAN = require('./Test_suites/Type3_CANService.js');
const Type4_Teaching = require('./Test_suites/Type4_TeachingService.js');
const Type5_Producer = require('./Test_suites/Type5_ProducerService.js');
const Type6_Consumer = require('./Test_suites/Type6_ConsumerService.js');
const Type9_EventAck = require('./Test_suites/Type9_EventAcknowledgeService.js');
const Type10_Bootloader = require('./Test_suites/Type10_BootloaderService.js');
const Type11_Bootloader2 = require('./Test_suites/Type11_Bootloader2Service.js');
const Type12_FastClock = require('./Test_suites/Type12_FastClockService.js');
const Type13_DCC_CAB = require('./Test_suites/Type13_DCC_CAB_Service.js');
const Type14_DCC_CMD = require('./Test_suites/Type14_DCC_CMD_Service.js');
const Type15_CANBridge = require('./Test_suites/Type15_CANBridgeService.js');
const Type16_SLiM = require('./Test_suites/Type16_SLiMService.js');
const Type17_LongMessage = require('./Test_suites/Type17_LongMessageService.js');


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
winston.info({message: "*** use 'npm start help' to show command line options ***"});
winston.info({message: '================================================================================'});
winston.info({message: ' '});

let connection = null;

// Now setup for console input to get the node number of the module we're testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


let options = {};

//
// NOTE: Much use is made of the async/await methods
// as many tests have to wait for an expected response to check if it's passed or failed
// and waiting for a function to complete (await) is only possible from an async function
// (in native node.js anyway)
//

run_main()

async function run_main(){

	getCommandLineOptions();
	if(options.help){
    winston.info({message: ' Command line options...'});
    winston.info({message: '   help             - just shows this, and terminates'});
    winston.info({message: '   auto             - (or blank) attempts to automatically find CANUSB4'});
    winston.info({message: '   network          - uses tcp connection'});
    winston.info({message: '   serialPort=<XXX> - selects specific serial port (e.g. COM3)'});
    winston.info({message: '   showserials      - just lists all serial ports, and terminates'});
    winston.info({message: '\n'});
    await utils.sleep(100);   // wait for printing
		process.exit()
  }

  if(options.showSerials){
    utils.checkSerialPort()
    await utils.sleep(500);   // wait for serial port check to complete
		process.exit()
	}

	if(options.connection == 'network'){
    // create network connection for tests to use
    connection = new IP_Network(NET_ADDRESS, NET_PORT);
    winston.info({message: '---- network selected ----'});
	}
	if(options.connection == 'auto'){
    let canbus4_info = {'path': null}  // seems we have to create an object so it passes by ref
    utils.findCANUSB4(canbus4_info)
    await utils.sleep(500);   // wait for serial port check to complete
    winston.debug({message: '---- canusb4 result ' + JSON.stringify(canbus4_info)});
    if (canbus4_info.path) {
      connection = new SerialGC.SerialGC(canbus4_info.path)
      winston.info({message: 'VLCB: CANUSB4 found ' + canbus4_info.path + '\n'});
    }else{
      winston.info({message: '\nVLCB: ******** ERROR: No CANUSB4 found - terminating \n'});
      process.exit()
    }
	}
	if(options.connection == 'serialPort'){
    let serialPort_info = {'path': options.serialPort}
		utils.checkSerialPort(serialPort_info)
    await utils.sleep(500);   // wait for serial port check to complete
		if(serialPort_info.valid){
			connection = new SerialGC.SerialGC(serialPort_info.path)
		} else {
			winston.info({message: '\nVLCB: ******** ERROR: port ' + options.serialPort + ' not found - terminating \n'});
      process.exit()
		}
	}


  if (connection) {
		winston.info({message: '\n'});
    winston.info({message: ' --------------------------- Test Instructions ------------------------------'});
		winston.info({message: '\n'});
    winston.info({message: 'If the module is already programmed with a node number, then just enter that node number and hit return'});
		winston.info({message: '\n'});
    winston.info({message: "If the module is uninitialised (no node number), or you don't know if it does, then follow the next two steps "});
    winston.info({message: "First:  hit enter with no node number "});
    winston.info({message: "        (the test will allocate a free node number if the module doesn't have one) "});
    winston.info({message: "Second: put the module into setup (yellow led flashing), by holding the button down"});
    winston.info({message: "        (or any other method appropriate for the module under test)"});
    winston.info({message: "        The test will wait for up to 20 seconds for the module to go into setup "});
		winston.info({message: '\n'});
		

    // This will prompt for the node number, and then run the tests
    rl.question('\n Enter Node number > ', function(answer) {
      RetrievedValues.setNodeNumber(parseInt(answer));	// store nodenumber for use by tests
      RetrievedValues.data['enteredNodeNumber'] = parseInt(answer)
      winston.info({message: ' '});
			if (Number.isNaN(RetrievedValues.getNodeNumber())){
				winston.info({message: 'VLCB: ==== No Node number entered'});
			} else {
	      winston.info({message: 'VLCB: ==== Node number entered - ' + RetrievedValues.getNodeNumber()});
			}
      winston.info({message: ' '});
      runtests();                        // ok - now run actual tests.........
    });
  } else {
    // end app if no connection found (this condition should never occur, but still.....)
    winston.info({message: '\nnVLCB: ******** ERROR: no connection found - terminating \n'});
    process.exit()
  }
}


// Block to call test suites to ensure they run in sequence
// this relies on the underlying functions being themselves async functions, which can be called with an 'await' method
// Only code within this code block will be executed in sequence
async function runtests() {
  // create instances of test suites
  const callback = new callback_tests(connection);
  const SetupMode = new SetupMode_tests(connection);
  const MNS = new Type1_MNS(connection);
  const NVS = new Type2_NVS(connection);
  const CAN = new Type3_CAN(connection);
  const Teaching = new Type4_Teaching(connection);
  const Producer = new Type5_Producer(connection);
  const Consumer = new Type6_Consumer(connection);
  const EventAck = new Type9_EventAck(connection);
  const Bootloader = new Type10_Bootloader(connection);
  const Bootloader2 = new Type11_Bootloader2(connection);
  const FastClock = new Type12_FastClock(connection);
  const DCC_CAB = new Type13_DCC_CAB(connection);
  const DCC_CMD = new Type14_DCC_CMD(connection);
  const CANBridge = new Type15_CANBridge(connection);
  const SLiM = new Type16_SLiM(connection);
  const LongMessage = new Type17_LongMessage(connection);


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
				case 7:
					utils.DisplayComment(RetrievedValues.data["Services"][key]["ServiceName"] + " tests not implemented")
					break;
				case 8:
					utils.DisplayComment(RetrievedValues.data["Services"][key]["ServiceName"] + " tests not implemented")
					break;
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
					var comment = 'No tests defined for ServiceType ' + serviceType
					winston.info({message: 'VLCB:      ' + comment + '\n'});        }
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

  // ensure RetrievedValues is updated on disk
  RetrievedValues.writeToDisk();
	
	await utils.sleep(500);		// delay to allow the log writes to catch up

	connection.closeConnection()
	winston.info({message: '\nVLCB: test sequence completed'});
	rl.close();
	process.stdin.destroy();

  // archive all results into zip file ...
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
  
function getCommandLineOptions(){
	// command line arguments will be 'node' <javascript file started> '--' <arguments starting at index 3>
	for (var item in process.argv){
    winston.debug({message: 'main: argv ' + item + ' ' + process.argv[item]});
		options["connection"] = 'auto'
    if (process.argv[item].toLowerCase() == 'help'){
      options["help"] = true
    }
    if (process.argv[item].toLowerCase() == 'network'){
      options["connection"] = 'network'
    }
    if (process.argv[item].toLowerCase() == 'showserials'){
      options["showSerials"] = true
    }
    if (process.argv[item].toLowerCase().includes('serialport')){
			const myArray = process.argv[item].split("=");
      options["connection"] = 'serialPort'
			options["serialPort"] = myArray[1]
    }
	}

	winston.info({message: '\noptions selected ' + JSON.stringify(options) + '\n'});

}



