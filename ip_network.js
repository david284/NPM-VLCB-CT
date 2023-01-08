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


class IP_Network {

    constructor(NET_ADDRESS, NET_PORT) {
		winston.info({message: '\Connecting to ' + NET_ADDRESS + ':' + NET_PORT + '\n'});
        this.messagesIn = [];
        
        this.testClient = new net.Socket()
        this.testClient.connect(NET_PORT, NET_ADDRESS, function () {
            winston.debug({message: 'MERGLCB: Client Connected at port ' + this.testClient.remotePort});
        }.bind(this))
        
        this.testClient.on('data', function (data) {
            const msgArray = data.toString().split(";");
            for (var msgIndex = 0; msgIndex < msgArray.length - 1; msgIndex++) {
                msgArray[msgIndex] += ';'           // replace terminator removed by split function
                var decodedMsg = cbusLib.decode(msgArray[msgIndex]);
                winston.debug({message: 'MERGLCB: Test client: data received ' + msgArray[msgIndex] + " " + decodedMsg.text});
                this.messagesIn.push(decodedMsg)
            }
        }.bind(this));
        
        this.testClient.on('end', function () {
            winston.debug({message: 'MERGLCB: Client Disconnected at port ' + this.testClient.remotePort});
        }.bind(this));
        
        this.testClient.on('error', function(err) {
            winston.info({message: 'MERGLCB: Socket error ' + err});
        }.bind(this));
        
    }

	write(msgData) {
        this.testClient.write(msgData);
        var decodedMsg = cbusLib.decode(msgData);
        winston.debug({message: 'MERGLCB: Network transmit ' + decodedMsg.text});		
	}
	
	closeConnection(){
		this.testClient.end();
	}
}

module.exports = {
    IP_Network: IP_Network
}