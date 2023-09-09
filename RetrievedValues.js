'use strict';
const winston = require('winston');		// use config from root instance
const fs = require('fs');
const Service_Definitions = require('./Definitions/Service_Definitions.js');
const NodeParameterNames = require('./Definitions/Text_NodeParameterNames.js');


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
                "DescriptorIdentity": null,
                "CANID": null,
								"nodeNumber": null,
								"TestsPassed": 0,
								"TestsFailed": 0,
								"setup_completed": null,
                "inLearnMode": false,
								"HEARTB": 'failed',			// assume HEARTB not received to begin with
								"nodeParameters": {},
                "nodeVariables":{},
                "events": {},
                "EventSpaceLeft": null,
                "StoredEventCount" : null,
                "ServicesActualCount": 0,
								"ServicesReportedCount": null,
								"MaxServiceIndex": 0,
								"Services": {},
								"modules": {}
		};	
		this.retrieved_values = this.data;
	}

	getNodeNumber(){ return this.data.nodeNumber; };
	setNodeNumber(nodeNumber) { this.data.nodeNumber = nodeNumber; };
	
	
  ///////////////////////////////////////////////////////////////////////////////
  //
  // Node Parameter related methods
  //

	addNodeParameter(parameterIndex, parameterValue) {
		this.data.nodeParameters[parameterIndex]= { "value": parameterValue }
    if (NodeParameterNames[parameterIndex]){
		  this.data.nodeParameters[parameterIndex]["name"] = NodeParameterNames[parameterIndex]
    } else{
		  this.data.nodeParameters[parameterIndex]["name"] = 'unknown node parameter'
    }
	}
	
  ///////////////////////////////////////////////////////////////////////////////
  //
  // Node Variable related methods
  //

	
	getNodeVariableCount() {
		var count = 0;
				for (var item in this.data.nodeVariables) {
					if (item != 0) {	// ignore node variable 0 from count
						count++;
					}
				}
		return count;
	}


  ///////////////////////////////////////////////////////////////////////////////
  //
  // Service related methods
  //

	
	addService(ServiceIndex, ServiceType, ServiceVersion){
    if ( (ServiceIndex != null) && (ServiceType != null) && (ServiceVersion != null)){
      if (this.data.Services[ServiceIndex] == null) {
        this.data.Services[ServiceIndex]= {"ServiceName": "Unknown Service"};
        this.data.Services[ServiceIndex]["ServiceIndex"] = ServiceIndex;
        this.data.Services[ServiceIndex]["ServiceType"] = ServiceType;
        this.data.Services[ServiceIndex]["ServiceVersion"] = ServiceVersion;
        this.data.Services[ServiceIndex]["diagnosticExpectedCount"] = 0;
        this.data.Services[ServiceIndex]["diagnosticReportedCount"] = 0;
        this.data.Services[ServiceIndex]["diagnosticCodeExpectedBitfield"] = 0;
        this.data.Services[ServiceIndex]["diagnosticCodeReceivedBitfield"] = 0;
        this.data.Services[ServiceIndex]["MaxDiagnosticCode"] = 0;
        this.data.Services[ServiceIndex]["diagnostics"] = {};

        if(Service_Definitions[ServiceType] != null) {
          this.data.Services[ServiceIndex]["ServiceName"] = Service_Definitions[ServiceType].name;
        }

        this.data.ServicesActualCount++;
        if (ServiceIndex > this.data.MaxServiceIndex) {this.data.MaxServiceIndex = ServiceIndex};
        winston.debug({message: 'VLCB: RetrievedValues: service added - index ' + ServiceIndex});
      } else {
        winston.debug({message: 'VLCB:      WARNING: service already exists - index ' + ServiceIndex});
      }
      
      // create a bit field & count for expected diagnostic codes for this service 
      // so we can check against actual received diagnostic codes
      if(Service_Definitions[ServiceType] != null) {
        if ( (Service_Definitions[ServiceType].version!= null) 
          && (Service_Definitions[ServiceType].version[ServiceVersion]!= null)
          && (Service_Definitions[ServiceType].version[ServiceVersion].diagnostics != null)) {
          for (var entry in Service_Definitions[ServiceType].version[ServiceVersion].diagnostics) {
            this.data["Services"][ServiceIndex].diagnosticCodeExpectedBitfield |= 2 ** entry;
            this.data["Services"][ServiceIndex].diagnosticExpectedCount++;
          }
        }
      }

    } else {
      winston.error({message: 'VLCB: RetrievedValues: addService(): invalid parameter ' + ServiceIndex + ' ' + ServiceType + ' ' + ServiceVersion});  
    }
  }


	addServiceData(ServiceIndex, Data1, Data2, Data3, Data4){
		if (this.data.Services[ServiceIndex] == null) {
			this.addService(ServiceIndex, null, null);
		}
		this.data["Services"][ServiceIndex]["Data1"] = Data1;
		this.data["Services"][ServiceIndex]["Data2"] = Data2;
		this.data["Services"][ServiceIndex]["Data3"] = Data3;
		this.data["Services"][ServiceIndex]["Data4"] = Data4;
		
	}

  clearAllServices(){
    this.data["Services"] = {}
    this.data.ServicesActualCount = 0;
    this.data.ServicesReportedCount = 0;
  }
	
  getServiceName(ServiceIndex){
    if (ServiceIndex == 0){
      return ''                         // no name if zero index, so don't try to find a match
    } else if (this.data.Services[ServiceIndex] == null) {
      return 'unknown service'
    } else {
      return this.data.Services[ServiceIndex].ServiceName
    }
  }

	ServiceToString(ServiceIndex) {
		if (this.data.Services[ServiceIndex] != null) {
			var service = this.data.Services[ServiceIndex];
			return 'ServiceIndex ' + service.ServiceIndex
					+ ' ServiceType ' + service.ServiceType
					+ ' ServiceVersion ' + service.ServiceVersion
					+ ' - ' + service.ServiceName;
		} else {
			return 'ServiceIndex ' + ServiceIndex + ' No matching service found';
		}
	}
	
	ServiceDataToString(ServiceIndex) {
		if (this.data.Services[ServiceIndex] != null) {
			var service = this.data.Services[ServiceIndex];
			return 'ServiceIndex: ' + service.ServiceIndex
					+ ' ServiceType: ' + service.ServiceType
					+ ' Data1: ' + service.Data1 + ' Data2: ' + service.Data2 + ' Data3: ' + service.Data3 + ' Data4: ' + service.Data4;
		} else {
			return 'ServiceIndex ' + ServiceIndex + ' No matching service found';
		}
	}

	
  ///////////////////////////////////////////////////////////////////////////////
  //
  // Diagnostics related methods
  //

  // add a diagnostic code, but only if the service has already been created
	addDiagnosticCode(ServiceIndex, DiagnosticCode, DiagnosticValue){
		if (this.data["Services"][ServiceIndex] != null) {
		
      // lets create a shorter reference to make the code a bit more readable
      const service = this.data["Services"][ServiceIndex];
      
      if (service.diagnostics[DiagnosticCode] == null){
        // new diagnostic code
        service.diagnosticReportedCount++;
        // keep a record of highest diagnostic code
        if (DiagnosticCode > service.MaxDiagnosticCode) { service.MaxDiagnosticCode = DiagnosticCode }
        service.diagnosticCodeReceivedBitfield |= 2 ** DiagnosticCode;
        service.diagnostics[DiagnosticCode] = {};
      }

      var DiagnosticName = "Unknown Diagnostic Code";	//assume diagnostic code is unknown to start with
      
      // we can't get the name unless we have the service type & version
      if ( (service.ServiceType != null) & (service.ServiceVersion != null)) {
        var serviceType = service.ServiceType;
        var serviceVersion = service.ServiceVersion;
        // have type & version, lets see if we can get a matching name
        if ( Service_Definitions[serviceType] != null) {
          //lets see if we have a name this diagnostic code for this service type
          if ((Service_Definitions[serviceType].version!= null) 
            && (Service_Definitions[serviceType].version[serviceVersion]!= null)
            && (Service_Definitions[serviceType].version[serviceVersion].diagnostics != null)
            && (Service_Definitions[serviceType].version[serviceVersion].diagnostics[DiagnosticCode] != null) ) {
            DiagnosticName = Service_Definitions[serviceType].version[serviceVersion].diagnostics[DiagnosticCode].name;
          }	
        }
      }
      // do these in this order so name is first (more readable)
      service.diagnostics[DiagnosticCode]["DiagnosticName"] = DiagnosticName;
      service.diagnostics[DiagnosticCode]["DiagnosticCode"] = DiagnosticCode;
      service.diagnostics[DiagnosticCode]["DiagnosticValue"] = DiagnosticValue;
      return true
    } else {
      winston.info({message: 'VLCB:      FAIL: RetrievedValues: add diagnostic code: service index does not exist: ' + ServiceIndex});
      return false      
    }

	}


	DiagnosticCodeToString(ServiceIndex, DiagnosticCode) {
		// check we have a service for this index
		if (this.data.Services[ServiceIndex] != null) {
			// lets create a shorter reference to make the code a bit more readable
			const service = this.data["Services"][ServiceIndex];
			// check we have a matching diagnostic code
			if ((service.diagnostics != null) & (service.diagnostics[DiagnosticCode] != null)) {
				return "ServiceIndex " + ServiceIndex
						+ ' ' + service.ServiceName + ' ' + service.ServiceType
						+ ' DiagnosticCode ' + DiagnosticCode
						+ ' Value ' + service.diagnostics[DiagnosticCode].DiagnosticValue
						+ ' - ' + service.diagnostics[DiagnosticCode].DiagnosticName;
			} else {
				return "ServiceIndex " + ServiceIndex
						+ ' ' + service.ServiceName + ' ' + service.ServiceType
						+ ' DiagnosticCode ' + DiagnosticCode
						+ ' - Diagnostic Code not found';
			}
		} else {
			return "ServiceIndex " + ServiceIndex
					+ ' - Service not found';			
		}
	}

  ///////////////////////////////////////////////////////////////////////////////
  //
  // events related methods
  //


  storeEventVariableValue(eventIdentifier, eventVariableIndex, eventVariableValue){
    var selectedEvent = null;
    var eventCount = 0;
    // find out if the event already exists
    for (var event in this.data.events) {
      eventCount++
      if (this.data.events[event].eventIdentifier == eventIdentifier) {
        selectedEvent = this.data.events[event]
        winston.debug({message: 'VLCB: storeEventVariable: matching event found'});
      }
    }
    // if it doesn't, then create it
    if (selectedEvent == null) { 
      this.data.events[eventCount+1] = {}
      selectedEvent = this.data.events[eventCount+1]
      selectedEvent.eventIdentifier = eventIdentifier
      winston.debug({message: 'VLCB: storeEventVariable: new event added'});
    }
    // add variables array if it doesn't exist
    if (selectedEvent.eventVariables == undefined) {selectedEvent.eventVariables = {}}
    // now store value
    selectedEvent.eventVariables[eventVariableIndex] = eventVariableValue
    winston.debug({message: 'VLCB: event Variable stored' + JSON.stringify(selectedEvent)});
  }

  clearEvents(){
    this.data.events = {}
  }

  getEvent(eventIdentifier){
    for (var event in this.data.events) {
      if (this.data.events[event].eventIdentifier == eventIdentifier) {
        winston.debug({message: 'VLCB: RetrievedValues.getEvent: matching event found'});
        return this.data.events[event]
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  //
  // File related methods
  //

	writeToDisk(path) {
		// now write retrieved_values to disk
		var text = JSON.stringify(this.data, null, '    ');
		fs.writeFileSync(path, text);
		winston.debug({message: 'VLCB: Write to disk: retrieved_values \n' + text});
	}


}

module.exports = new RetrievedValues();
