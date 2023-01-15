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
    test_RDGN(retrieved_values, ServiceIndex, DiagnosticCode) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN RDGN test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRDGN(retrieved_values.nodeNumber, ServiceIndex, DiagnosticCode);
            this.network.write(msgData);
			if (retrieved_values["Services"] == null){
				retrieved_values["Services"] = {};
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
							if (retrieved_values.Services[msg.ServiceIndex] != null)
							{
								//ok - we have a service entry, so lets get it's version & Type
								var serviceVersion = retrieved_values.Services[msg.ServiceIndex].ServiceVersion;
								var serviceType = retrieved_values.Services[msg.ServiceIndex].ServiceType;
								winston.debug({message: 'MERGLCB: retrived_service - ServiceType ' + serviceType 
									+ ' ServiceVersion ' + serviceVersion});
								
								// lets see if we have a definition for this service type & display
								// some user friendly names
								if ( Service_Definitions[serviceType] != null) {
									//lets see if we have a name this diagnostic code for this service type
									if ((Service_Definitions[serviceType].version!= null) 
										&& (Service_Definitions[serviceType].version[serviceVersion]!= null)
										&& (Service_Definitions[serviceType].version[serviceVersion].diagnostics != null)
										&& (Service_Definitions[serviceType].version[serviceVersion].diagnostics[msg.DiagnosticCode] != null) ) {
										var DiagnosticName = Service_Definitions[serviceType].version[serviceVersion].diagnostics[msg.DiagnosticCode].name;
										//winston.info({message: 'MERGLCB: ***** service ' + DiagnosticName });
									} else {
										var DiagnosticName = "Unknown Diagnostic Code";
									}
									winston.info({message: 'MERGLCB: ' + Service_Definitions[serviceType].name
										+ ': (' + serviceType + ') Diagnostic: (' + msg.DiagnosticCode 
										+ ') ' + DiagnosticName});	
								} else {
									winston.info({message: 'MERGLCB: unknown service type ' + serviceType
									+ ' Diagnostic ' + msg.DiagnosticCode});	
								}								
								
								// Now lets double check the results with info we've previously retrieved
								// we can fail the test if there's a mismatch
								//
								nonMatchingCount++;				// ok, got +1 message not yet matched
								// check for matching diagnostics to already known services
								for (var key in retrieved_values["Services"]) {
									var serviceIndex = retrieved_values["Services"][key]["ServiceIndex"];
									if (msg.ServiceIndex == serviceIndex){
										nonMatchingCount--; // message matches service, so decrement count
										winston.debug({message: 'MERGLCB: Matching service found '});

										// ok, matches a service, so store values if they don't already exist
										if (retrieved_values["Services"][key]["diagnostics"] == null) {
											retrieved_values["Services"][key]["diagnostics"] = {};
										}
										if (retrieved_values["Services"][key]["diagnostics"][msg.DiagnosticCode]== null) {
											retrieved_values["Services"][key]["diagnostics"][msg.DiagnosticCode] = {
												"DiagnosticCode": msg.DiagnosticCode,
												"DiagnosticeValue" : msg.DiagnosticValue
											};
										}
									}
								}
							} else {
								winston.debug({message: 'MERGLCB: No Matching service found for serviceIndex ' + msg.ServiceIndex});
							}
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
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: RDGN failed'});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
    
	

}

module.exports = {
    opcodes_8x: opcodes_8x
}