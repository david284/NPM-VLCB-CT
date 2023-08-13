'use strict';
const winston = require('winston');		// use config from root instance
const net = require('net');
const io = require('socket.io-client');
const cbusLib = require('cbuslibrary');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


module.exports = class IP_Network {

  constructor(NET_ADDRESS, NET_PORT) {
    winston.debug({message: 'IP_NETWORK: Connecting to ' + NET_ADDRESS + ':' + NET_PORT + '\n'});
    this.messagesIn = [];
    this.testStarted = false;
    this.callback = this.dummyFunction;
      
    this.testClient = new net.Socket()
    this.testClient.connect(NET_PORT, NET_ADDRESS, function () {
      winston.debug({message: 'IP_NETWORK: Client Connected at port ' + this.testClient.remotePort});
    }.bind(this))
      
    this.testClient.on('data', function (data) {
      const msgArray = data.toString().split(";");
      for (var msgIndex = 0; msgIndex < msgArray.length - 1; msgIndex++) {
        msgArray[msgIndex] += ';'           // replace terminator removed by split function
        var decodedMsg = cbusLib.decode(msgArray[msgIndex]);
        this.messagesIn.push(decodedMsg)
        winston.debug({message: 'IP_NETWORK: <<< receive ' + msgArray[msgIndex] + " " + decodedMsg.text});
        if (this.testStarted) {
          // stops console filling up with heartb messages whilst waiting for user input
          winston.info({message: 'VLCB:      <<< received: ' + decodedMsg.text});
        } 
        this.callback(decodedMsg);
      }
    }.bind(this));
      
    this.testClient.on('end', function () {
        winston.debug({message: 'IP_NETWORK: Client Disconnected at port ' + this.testClient.remotePort});
    }.bind(this));
    
    this.testClient.on('error', function(err) {
        winston.info({message: '\nIP_NETWORK: Socket error ' + err});
        winston.info({message: '\nVLCB: ==== terminating \n'});
        process.exit()
    }.bind(this));
      
  } // end constructor

	write(msgData) {
    var decodedMsg = cbusLib.decode(msgData);
    this.testClient.write(msgData);
    winston.debug({message: 'IP_NETWORK: transmit >>> ' + decodedMsg.encoded + ' ' + decodedMsg.text});		
    winston.info({message: 'VLCB:      >>> transmitted: ' + decodedMsg.text}); 
  }
	
	closeConnection(){
		this.testClient.end();
	}
	
	dummyFunction(msg) {
    // do nothing - this function will be replaced at runtime
	}
}

