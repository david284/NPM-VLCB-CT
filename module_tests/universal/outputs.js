'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../../utilities.js');


exports.test_output =  async function test_output(connection, test_adapter, RetrievedValues, channel) {

  // set channel of test_adapter to input
  await test_adapter.setChanneltoInput(channel)

  // set channel of unit under test to output
  await setChanneltoOutput(connection, RetrievedValues.getNodeNumber(), channel)

  // assume default events exist
  // the default event number for outputs is the I/O channel number

  //set UUT output to 0 - but don't test response - we're setting initial state
  var msgData = cbusLib.encodeACOF(RetrievedValues.getNodeNumber(), channel)
  await connection.write(msgData);



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