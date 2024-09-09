'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../../utilities.js');



exports.test_input =  async function test_input(connection, test_adapter, RetrievedValues, channel) {
  var hasTestPassed = false;
  
  // set channel of unit under test to input
  await setChanneltoInput(connection, RetrievedValues.getNodeNumber(), channel)

  // set channel of test_adapter to Output
  await test_adapter.setChanneltoOutput(channel)

  //set test_adapter output to 0 - but don't test response - we're setting initial state
  await test_adapter.setOutput(channel, 0)

  // test input 'ON'
  await exports.test_input_on(connection, test_adapter, RetrievedValues, channel)

  // test input 'OFF'
  await exports.test_input_off(connection, test_adapter, RetrievedValues, channel)

}


exports.test_input_off =  async function test_input_on(connection, test_adapter, RetrievedValues, channel) {
  var hasTestPassed = false;
  
  if (channel > 0){
    /*
    // set channel of unit under test to input
    await setChanneltoInput(connection, RetrievedValues.getNodeNumber(), channel)

    // set channel of test_adapter to Output
    await test_adapter.setChanneltoOutput(channel)
    */

    // test input 'OFF'
    hasTestPassed = false;
    connection.messagesIn = [];
    await test_adapter.setOutput(channel, 0)    // set test_adapter output to 'off'
    await utils.sleep(100);
    connection.messagesIn.forEach(msg => {
      if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
        if (msg.mnemonic == "ACOF"){
          winston.info({message: 'universal: input test: node ' + RetrievedValues.getNodeNumber() + ' received ACON '});
          if (msg.eventNumber == channel){
            hasTestPassed = true;
          }
        }
      }
    })
    utils.processResult(RetrievedValues, hasTestPassed, 'input ON');
  } else {
    winston.info({message: 'universal: input test: invalid channel value 0'});
  }
  return hasTestPassed
}


exports.test_input_on =  async function test_input_on(connection, test_adapter, RetrievedValues, channel) {
  var hasTestPassed = false;
  
  if (channel > 0){
    /*
    // set channel of unit under test to input
    await setChanneltoInput(connection, RetrievedValues.getNodeNumber(), channel)

    // set channel of test_adapter to Output
    await test_adapter.setChanneltoOutput(channel)
    */

    // test input 'ON'
    connection.messagesIn = [];
    await test_adapter.setOutput(channel, 1)    // set test_adapter output to 'on'
    await utils.sleep(100);
    connection.messagesIn.forEach(msg => {
      if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
        if (msg.mnemonic == "ACON"){
          winston.info({message: 'universal: input test: node ' + RetrievedValues.getNodeNumber() + ' received ACON '});
          if (msg.eventNumber == channel){
            hasTestPassed = true;
          }
        }
      }
    })
    utils.processResult(RetrievedValues, hasTestPassed, 'input ON');
  } else {
    winston.info({message: 'universal: input test: invalid channel value 0'});
  }
  return hasTestPassed
}


async function setChanneltoInput(connection, nodeNumber, channel){
  winston.info({message: 'universal: UUT: set channel ' + channel + ' to input '});
  // set channel to output (where channel is 1 to 16)
    // node variable index for I/O type is 16 + (channel-1) * 7
    // node variable value for 'input' I/O type is 0
    var nodeVariableIndex = 16 + ((channel-1) * 7) 
    var msgData = cbusLib.encodeNVSET(nodeNumber, nodeVariableIndex, 0);
    await connection.write(msgData);
}