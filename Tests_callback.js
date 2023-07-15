'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


//
// This class is to process unsolicited messages received (i.e. not provoked by any specific test)
// Initial example if the heartbeat message sent on a repetative basis
// need to attach callback to network to receive all messages as the're received
//

class callbackTests {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- callback Constructor'});

		this.network = NETWORK;
    }

	attach(RetrievedValues){
		this.RetrievedValues = RetrievedValues;
		this.RetrievedValues.data["HEARTB"] = 'failed';				// assume we never receive a HEARTB to begin with
		this.network.callback = this.callbackFunction.bind(this);		
	}

	// actual function that gets called back from NETWORK process
	callbackFunction(msg) {
		
		// test for heartbeat message, but only interested in ones from node under test
		if (msg.mnemonic == 'HEARTB') {
			if (msg.nodeNumber == this.RetrievedValues.getNodeNumber()) {
				this.RetrievedValues.data["HEARTB"] = 'passed';
				winston.debug({message: 'VLCB: ' + msg.text});		
				winston.info({message: 'VLCB: >>>> HEARTB received'});
			}
		}
	}
	
}

module.exports = {
    callbackTests: callbackTests
}