'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const NodeParameterNames = require('./../Definitions/Text_NodeParameterNames.js');
const Service_Definitions = require('./../Definitions/Service_Definitions.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


class opcodes_8x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_8x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.response_time = 200;
    }


	
	// 0x87 - RDGN
    test_RDGN(RetrievedValues, ServiceIndex, DiagnosticCode) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN RDGN test - ServiceIndex ' + ServiceIndex});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), ServiceIndex, DiagnosticCode);
            this.network.write(msgData);
			if (RetrievedValues.data["Services"] == null){
				RetrievedValues.data["Services"] = {};
				RetrievedValues.data["ServiceCount"] = 0;
			}
			var RDGN_timeout = 100;
			if ( ServiceIndex == 0) {		// 0 = request all diagnostics, so extend timeout
				if (RetrievedValues.data.ServiceCount > 0) {RDGN_timeout = RDGN_timeout * RetrievedValues.data.ServiceCount}
				winston.debug({message: 'MERGLCB: RDGN - ServiceCount ' + RetrievedValues.data.ServiceCount});
			} else if ( DiagnosticCode == 0) {		// 0 = request all diagnostics for specific service, so extend timeout by less
				RDGN_timeout = RDGN_timeout * 5
			}
            setTimeout(()=>{
				var nonMatchingCount = 0;
                if (this.network.messagesIn.length > 0){
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if (msg.mnemonic == "DGN"){
							winston.debug({message: 'MERGLCB: ----- Processing ServiceIndex ' + msg.ServiceIndex
								+ ' DiagnosticCode ' + msg.DiagnosticCode});
							
							// ok we have a response - lets findout if we have an entry for this service
							//we can then display some info about this diagnostic
							if (RetrievedValues.data.Services[msg.ServiceIndex] != null)
							{
								
								// Now lets double check the results with info we've previously retrieved
								// we can fail the test if there's a mismatch
								//
								nonMatchingCount++;				// ok, got +1 message not yet matched
								// check for matching diagnostics to already known services
								for (var key in RetrievedValues.data["Services"]) {
									var serviceIndex = RetrievedValues.data["Services"][key]["ServiceIndex"];
									if (msg.ServiceIndex == serviceIndex){
										nonMatchingCount--; // message matches service, so decrement count
										winston.debug({message: 'MERGLCB: Matching service found '});

										// ok, matches a service, so store values if they don't already exist
										RetrievedValues.addDiagnosticCode(msg.ServiceIndex, msg.DiagnosticCode, msg.DiagnosticValue);
									}
								}
							} else {
								winston.debug({message: 'MERGLCB: No Matching service found for serviceIndex ' + msg.ServiceIndex});
							}
							
							// display what we have
							winston.info({message: 'MERGLCB:      ' + RetrievedValues.DiagnosticCodeToString(msg.ServiceIndex, msg.DiagnosticCode)}); 
						}
					});

					// to pass, all diagnostic messages must match an existing service (i.e. nonMatchedCount will be zero)
					if ( nonMatchingCount == 0) {this.hasTestPassed = true;}
				}
				
				var testType = "";
				if(ServiceIndex == 0) {
					testType = "\'all services\'";
				} else {
					testType = "\'ServiceIndex " + ServiceIndex + "\'";
				}
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: RDGN ' + testType + ' passed'}); 
					RetrievedValues.data.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: RDGN failed'});
					RetrievedValues.data.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , RDGN_timeout
            );
        }.bind(this));
    }
    
	

}

module.exports = {
    opcodes_8x: opcodes_8x
}