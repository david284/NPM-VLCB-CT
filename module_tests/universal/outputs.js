'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../../utilities.js');


exports.test_output =  async function test_output(connection, test_adapter, RetrievedValues, channel) {
  var hasTestPassed = false;

  // set channel of test_adapter to input
  await test_adapter.setChanneltoInput(channel)

  // set channel of unit under test to output
  await setChanneltoOutput(connection, RetrievedValues.getNodeNumber(), channel)

  // assume default events exist
  // the default event number for outputs is the I/O channel number

  //set UUT output to 0 - but don't test response - we're setting initial state
  var msgData = cbusLib.encodeACOF(RetrievedValues.getNodeNumber(), channel)
  await connection.write(msgData);

  // test output 'ON'
  await exports.test_output_on(connection, test_adapter, RetrievedValues, channel)
  
  // test output 'OFF'
  await exports.test_output_off(connection, test_adapter, RetrievedValues, channel)

}

exports.test_output_off =  async function test_output_off(connection, test_adapter, RetrievedValues, channel) {
  var hasTestPassed = false;
  if (channel > 0){
    connection.messagesIn = [];
    var msgData = cbusLib.encodeACOF(RetrievedValues.getNodeNumber(), channel)
    await connection.write(msgData);
    await utils.sleep(100);
    connection.messagesIn.forEach(msg => {
      if (msg.nodeNumber == test_adapter.getNodeNumber()){
        if (msg.mnemonic == "ACOF"){
          winston.info({message: 'universal: output test: node ' + msg.nodeNumber + ' received ACOF '});
          if (msg.eventNumber == channel){
            hasTestPassed = true;
          }
        }
      }
    })
    utils.processResult(RetrievedValues, hasTestPassed, 'output OFF');
    } else {
    winston.info({message: 'universal: output test: invalid channel value 0'});
  }
  return hasTestPassed
  
}


exports.test_output_on =  async function test_output_off(connection, test_adapter, RetrievedValues, channel) {
  var hasTestPassed = false;
  if (channel > 0){
    connection.messagesIn = [];
    var msgData = cbusLib.encodeACON(RetrievedValues.getNodeNumber(), channel)
    await connection.write(msgData);
    await utils.sleep(100);
    connection.messagesIn.forEach(msg => {
      if (msg.nodeNumber == test_adapter.getNodeNumber()){
        if (msg.mnemonic == "ACON"){
          winston.info({message: 'universal: output test: node ' + msg.nodeNumber + ' received ACON '});
          if (msg.eventNumber == channel){
            hasTestPassed = true;
          }
        }
      }
    })
    utils.processResult(RetrievedValues, hasTestPassed, 'output ON');
    } else {
    winston.info({message: 'universal: output test: invalid channel value 0'});
  }
  return hasTestPassed  
}



async function setChanneltoOutput(connection, nodeNumber, channel){
  winston.info({message: 'universal: UUT: set channel ' + channel + ' to output '});
  // set channel to output (where channel is 1 to 16)
    // node variable index for I/O type is 16 + (channel-1) * 7
    // node variable value for 'output' I/O type is 1
    var nodeVariableIndex = 16 + ((channel-1) * 7) 
    var msgData = cbusLib.encodeNVSET(nodeNumber, nodeVariableIndex, 1);
    await connection.write(msgData);
}