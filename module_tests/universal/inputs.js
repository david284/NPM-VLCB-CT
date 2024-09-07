'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../../utilities.js');



exports.test_input =  async function test_input(connection, test_adapter, RetrievedValues, input) {
  test_adapter.setOutput(1)
}