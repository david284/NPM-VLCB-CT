'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../../utilities.js');



exports.test_input =  async function test_input(connection, test_adapter, RetrievedValues, channel) {
  await test_adapter.setOutput(channel, 0)

  // test input 'ON'
  connection.messagesIn = [];
  await test_adapter.setOutput(channel, 1)    // set test_adapter output to 'on'
  await utils.sleep(100);
  connection.messagesIn.forEach(msg => {
    if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
      if (msg.mnemonic == "ACON"){
        winston.info({message: 'universal: input test: node ' + RetrievedValues.getNodeNumber() + ' received ACON '});
      }
    }
  })

  // test input 'OFF'
  connection.messagesIn = [];
  await test_adapter.setOutput(channel, 0)    // set test_adapter output to 'off'
  await utils.sleep(100);
  connection.messagesIn.forEach(msg => {
    if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
      if (msg.mnemonic == "ACOF"){
        winston.info({message: 'universal: input test: node ' + RetrievedValues.getNodeNumber() + ' received ACOF '});
      }
    }
  })
}