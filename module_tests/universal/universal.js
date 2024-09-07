'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../../utilities.js');

const testAdapter = require('./../../module_tests/universal/test_adapter.js')
const inputs = require('./../../module_tests/universal/inputs.js')

exports.run_tests =  async function run_tests(connection, RetrievedValues) {
  winston.info({message: 'universal: run tests '});
  const test_adapter = new testAdapter(connection, 100)

  inputs.test_input(connection, test_adapter, RetrievedValues, 1)
  
}