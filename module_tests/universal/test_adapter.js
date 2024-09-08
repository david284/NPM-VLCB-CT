'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../../utilities.js');

const opcodes_9x = require('./../../Test_cases/opcodes_9x.js');
const opcodes_Dx = require('./../../Test_cases/opcodes_Dx.js');

//
// IMPORTANT: This test adapter must be a CANMIO-Universal
//


module.exports = class test_adapter {

  constructor(connection, nodeNumber) {
  //                        012345678901234567890123456789987654321098765432109876543210
  winston.debug({message:  '----------------- test_adapter Constructor -----------------'});
  this.connection = connection;
  this.nodeNumber = nodeNumber;
}

  async setOutput(channel, value) {
    winston.info({message: 'test_adapter: setOutput ' + channel + ' to ' + value});
    // set channel to output (where channel is 1 to 16)
    // node variable index for I/O type is 16 + (channel-1) * 7
    // node variable value for 'output' I/O type is 1
    var nodeVariableIndex = 16 + ((channel-1) * 7) 
    var msgData = cbusLib.encodeNVSET(this.nodeNumber, nodeVariableIndex, 1);
    await this.connection.write(msgData);

    // assume default event exists
    // the default event number is the I/O channel number
    // send event
    if (value == 0){
      var msgData = cbusLib.encodeACOF(this.nodeNumber, channel)
      await this.connection.write(msgData);
    }
    if (value == 1){
      var msgData = cbusLib.encodeACON(this.nodeNumber, channel)
      await this.connection.write(msgData);
    }
  }

  async setInput(channel) {
    winston.info({message: 'test_adapter: set channel ' + channel + ' to input '});
    // set channel to output (where channel is 1 to 16)
    // node variable index for I/O type is 16 + (channel-1) * 7
    // node variable value for 'input' I/O type is 0
    var nodeVariableIndex = 16 + ((channel-1) * 7) 
    var msgData = cbusLib.encodeNVSET(this.nodeNumber, nodeVariableIndex, 0);
    await this.connection.write(msgData);
  }


}