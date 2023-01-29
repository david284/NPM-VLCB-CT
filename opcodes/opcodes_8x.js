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
    }


	
	// 0x87 - RDGN
    test_RDGN(RetrievedValues, ServiceIndex, DiagnosticCode) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN RDGN test - ServiceIndex ' + ServiceIndex});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
			//
			// Need to calculate an extended timeout if it's a '0' command that returns multiple messages
			var RDGN_timeout = 100;
			if ( ServiceIndex == 0) { RDGN_timeout = 1500; } 
			else if ( DiagnosticCode == 0) { RDGN_timeout = 500; }
			winston.debug({message: 'MERGLCB: RDGN_timeout set to ' + RDGN_timeout}); 
			
			// now create message and start test
            var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), ServiceIndex, DiagnosticCode);
            this.network.write(msgData);
            setTimeout(()=>{
				var nonMatchingCount = 0;
                if (this.network.messagesIn.length > 0){
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
							// ok - it's the right node
							if (msg.mnemonic == "DGN"){
								
								// lets findout if we have an entry for this service
								if (RetrievedValues.data.Services[msg.ServiceIndex] == null)
								{
									winston.debug({message: 'MERGLCB: No Matching service found for serviceIndex ' + msg.ServiceIndex});
									this.hasTestPassed = false;
								} else {
									// we have a matching service entry, so mark as passed
									this.hasTestPassed = true;
								}
								
								// store diagnostic code anyway, even if no matching service (will create a new service entry)
								RetrievedValues.addDiagnosticCode(msg.ServiceIndex, msg.DiagnosticCode, msg.DiagnosticValue);
								// display what we have
								winston.info({message: 'MERGLCB:      ' + RetrievedValues.DiagnosticCodeToString(msg.ServiceIndex, msg.DiagnosticCode)}); 
							}
						}
					});
				}
				
				var testType = "\'ServiceIndex " + ServiceIndex + "\'";
				if(ServiceIndex == 0) {	testType = "\'all services\'"; } // overwrite if index = 0
				
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