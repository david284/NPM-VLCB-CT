'use strict';
const winston = require('winston');		// use config from root instance
const fs = require('fs');
const Service_Definitions = require('./Definitions/Service_Definitions.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class RetrievedValues {

    constructor() {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '------------ RetrievedValues Constructor'});
		
		this.data = { "DateTime" : new Date(),	// include datetime of test run start
								"NAME": null,
								"nodeNumber": null,
								"TestsPassed": 0,
								"TestsFailed": 0,
								"setup_completed": null,
								"HEARTB": 'failed',			// assume HEARTB not received to begin with
								"nodeParameters": {},
								"ServiceCount":null,
								"Services": {},
								"modules": {}
		};	
		this.retrieved_values = this.data;
	}

	getNodeNumber(){ return this.data.nodeNumber; };
	setNodeNumber(nodeNumber) { this.data.nodeNumber = nodeNumber; };
	
	getNodeVariableCount(serviceIndex) {
		var count = 0;
		if (this.data.Services[serviceIndex] != null) {
			if (this.data.Services[serviceIndex].nodeVariables != null) {
				for (var item in this.data.Services[serviceIndex].nodeVariables) {
					if (item != 0) {	// ignore node variable 0 from count
						count++;
					}
				}
			}
		}		
		return count;
	}
	
	addService(ServiceIndex, ServiceType, ServiceVersion){
		if (this.data["Services"][ServiceIndex] == null) {
			this.data["Services"][ServiceIndex] = {"ServiceIndex":ServiceIndex};
		}
		this.data.Services[ServiceIndex]["ServiceType"] = ServiceType;
		this.data.Services[ServiceIndex]["ServiceVersion"] = ServiceVersion;
		if (this.data.Services[ServiceIndex]["Diagnostics"] == null) {
			this.data.Services[ServiceIndex]["Diagnostics"] = {};
		}
		if(Service_Definitions[ServiceType] != null) {
			this.data.Services[ServiceIndex]["ServiceName"] = Service_Definitions[ServiceType].name;
		} else{
			this.data.Services[ServiceIndex]["ServiceName"] = "Unknown Service"
		}

	}

	addServiceData(ServiceIndex, Data1, Data2, Data3, Data4){
		if (this.data["Services"][ServiceIndex] == null) {
			this.data["Services"][ServiceIndex] = {"ServiceIndex":ServiceIndex};
		}
		this.data["Services"][ServiceIndex]["Data1"] = Data1;
		this.data["Services"][ServiceIndex]["Data2"] = Data2;
		this.data["Services"][ServiceIndex]["Data3"] = Data3;
		this.data["Services"][ServiceIndex]["Data4"] = Data4;
		
	}

	
	writeToDisk(path) {
		// now write retrieved_values to disk
		var text = JSON.stringify(this.data, null, '    ');
		fs.writeFileSync(path, text);
		winston.debug({message: 'MERGLCB: Write to disk: retrieved_values \n' + text});
	}


}

module.exports = new RetrievedValues();
