'use strict';
const winston = require('winston');		// use config from root instance
const utils = require('./../utilities.js');

const OpCodes_0x = require('./../Test_cases/opcodes_0x.js');
const OpCodes_7x = require('./../Test_cases/opcodes_7x.js');
const fetch_file = require('./../fetch_module_descriptor.js')



// Block to call test suites to ensure they run in sequence
// this relies on the underlying functions being themselves async functions, which can be called with an 'await' method
// Only code within this code block will be executed in sequence
exports.run_module_tests =  async function run_module_tests(connection, RetrievedValues) {
  // create instances of test suites
  //                      12345678901234567890123456789012345678900987654321098765432109876543210987654321
  winston.info({message: '  '});
  winston.info({message: '............................. Module tests invoked .............................'});
  winston.info({message: '  '});

  const opcodes_0x = new OpCodes_0x(connection);
  const opcodes_7x = new OpCodes_7x(connection);

  // check for response to QNN from module under test - otherwise node might not be responding
  await opcodes_0x.test_QNN(RetrievedValues);

// fetch matching module descriptor file
	var module_descriptor = fetch_file.module_descriptor('./module_descriptors/', RetrievedValues); 			

  // now get node parameter 0, as it tells us how many more node parameters there are
	// as well as provoking all the parameters to be sent (as it's VLCB)
	await opcodes_7x.test_RQNPN(RetrievedValues, module_descriptor, 0);

  winston.debug({message: 'VLCB: Module tests : RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, "    ")});

}