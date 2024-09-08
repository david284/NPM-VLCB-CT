'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../../utilities.js');

const testAdapter = require('./../../module_tests/universal/test_adapter.js')
const inputs = require('./../../module_tests/universal/inputs.js')

exports.run_tests =  async function run_tests(connection, RetrievedValues) {
  winston.info({message: 'universal: run tests '});
  const test_adapter = new testAdapter(connection, 65535)

  // test all the I/O channels as inputs
  for (var channel =1; channel <= 8; channel++){
    await inputs.test_input(connection, test_adapter, RetrievedValues, channel)
  }
  
}