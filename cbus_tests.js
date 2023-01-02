'use strict';
var winston = require('winston');		// use config from root instance
const net = require('net');
const io = require('socket.io-client');
const jsonfile = require('jsonfile')
var cbusLib = require('cbuslibrary');

var NodeParameterText = [
    "Number of parameters",		        // 0
    "Manufacturer’s Id",                // 1
    "Minor Version",                    // 2
    "Module Type",                      // 3
    "No. of events supported",          // 4
    "No. of Event Variables per event", // 5
    "No. of Node Variables",            // 6
    "Major Version",                    // 7
	"Node Flags"						// 8
    ];
	

// storage for values retrieved from module under test	
var retrieved_values = {};

// JSON array of expected module values to test against
var module_descriptor;

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)


class cbus_tests {


    constructor(NET_ADDRESS, NET_PORT) {
		winston.info({message: '\Connecting to ' + NET_ADDRESS + ':' + NET_PORT + '\n'});
        this.hasTestPassed = false;
        this.inSetupMode = false;
        this.test_nodeNumber = 0;
        this.response_time = 200;
        this.passed_count = 0;
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
                if(decodedMsg.mnemonic == "RQNN") {
                    this.test_nodeNumber = decodedMsg.nodeNumber;
                    this.inSetupMode = true;
                    winston.info({message: 'MERGLCB: module ' + this.test_nodeNumber + ' in setup mode '});
                }
            }
        }.bind(this));
        
        this.testClient.on('end', function () {
            winston.info({message: 'MERGLCB: Client Disconnected at port ' + this.testClient.remotePort});
        }.bind(this));
        
        this.testClient.on('error', function(err) {
            winston.info({message: 'MERGLCB: Socket error ' + err});
        }.bind(this));
        
    }


    async runTests() {
        winston.info({message: 'MERGLCB: put module into setup'});
        var setup_tries = 0;
        while (1){
            await this.sleep(1000);
            setup_tries++;
            if (this.inSetupMode) break;
            if (setup_tries > 20) break;
            winston.info({message: 'MERGLCB: waiting for RQNN (setup) ' + setup_tries + ' of 20' });
        }
		
		// need module to be in setup mode to start the tests
        if (this.inSetupMode) {
            this.passed_count=1;     // passed first test if in setup
            // do opcodes only possible in setup mode
            await this.test_RQMN();
            await this.test_RQNP();
            await this.test_SNN();      // takes module out of setup mode
			
			// now setup mode completed, we should have retrieved all the identifying info about the module (RQMN & RQNP)
			// so fetch matching module descriptor file
			module_descriptor = this.module_descriptor_read(retrieved_values); 			
			
			// now do rest of 'normal' opcodes, but only if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){
				
				// check for response to QNN from module under test
				await this.test_QNN(this.test_nodeNumber);
				
				// now get node parameter 0, as it tells us how many more node parameters there are
				// we don't get that info from the RQNP command unfortunately
				await this.test_RQNPN(0, module_descriptor);
				
				// now retrieve all the other node parameters, and check against module_descriptor file
				for (var i=1; i<retrieved_values["Number of parameters"]+1; i++) {
					await this.test_RQNPN(i, module_descriptor);
				}
				
				//
				// Add more tests.......
				//
				
			} else {
				winston.info({message: 'MERGLCB: tests aborted - failed to retrieve module descriptor file'});
			}
			
        } else {
            winston.info({message: ''});
            winston.info({message: 'MERGLCB: failed to go into setup'});
        }
		
        this.testClient.end()
        winston.info({message: ' '});                       // blank line to separate tests
        winston.info({message: 'Test run finished - Passed count : ' + this.passed_count});                       // blank line to separate tests
    }

    sleep(timeout) {
        return new Promise(function (resolve, reject) {
            //here our function should be implemented 
            setTimeout(()=>{
                resolve();
                ;} , timeout
            );
        });
    }

    //
    // get first instance of a received message with the specified mnemonic
    //
    getMessage(mnemonic){
        var message = undefined;
        for (var i=0; i<this.messagesIn.length; i++){
            message = this.messagesIn[i];
            if (message.mnemonic == mnemonic){
                winston.debug({message: 'MERGLCB: Found message ' + mnemonic});
                break;
            }
        }
        if (message == undefined){                 
            winston.debug({message: 'MERGLCB: No message found for' + mnemonic});
        }
        return message
    }
    
        
    test_RQNP() {
        return new Promise(function (resolve, reject) {
            //here our function should be implemented 
            winston.debug({message: 'MERGLCB: BEGIN RQNP test'});
            this.hasTestPassed = false;
            this.messagesIn = [];
            var msgData = cbusLib.encodeRQNP();
            this.testClient.write(msgData);
            setTimeout(()=>{
                if (this.messagesIn.length > 0){
                    var message = this.getMessage('PARAMS');
                    if (message.mnemonic == "PARAMS"){
                        winston.info({message: 'MERGLCB: RQNP passed'});
                        this.passed_count++;
                        this.hasTestPassed = true;
						retrieved_values [NodeParameterText[1]] = message.param1;
						retrieved_values [NodeParameterText[2]] = message.param2;
						retrieved_values [NodeParameterText[3]] = message.param3;
						retrieved_values [NodeParameterText[4]] = message.param4;
						retrieved_values [NodeParameterText[5]] = message.param5;
						retrieved_values [NodeParameterText[6]] = message.param6;
						retrieved_values [NodeParameterText[7]] = message.param7;
                        winston.info({message: '      RQNP: ' + NodeParameterText[1] + ' : ' + message.param1});
                        winston.info({message: '      RQNP: ' + NodeParameterText[2] + '  : ' + message.param2});
                        winston.info({message: '      RQNP: ' + NodeParameterText[3] + '      : ' + message.param3});
                        winston.info({message: '      RQNP: ' + NodeParameterText[4] + '  : ' + message.param4});
                        winston.info({message: '      RQNP: ' + NodeParameterText[5] + ' : ' + message.param5});
                        winston.info({message: '      RQNP: ' + NodeParameterText[6] + '  : ' + message.param6});
                        winston.info({message: '      RQNP: ' + NodeParameterText[7] + '  : ' + message.param7});
                    }
                }
                if (!this.hasTestPassed){ winston.info({message: 'MERGLCB: RQNP failed'}); }
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
    
    test_RQMN() {
        return new Promise(function (resolve, reject) {
            //here our function should be implemented 
            winston.debug({message: 'MERGLCB: BEGIN RQMN test'});
            this.hasTestPassed = false;
            this.messagesIn = [];
            var msgData = cbusLib.encodeRQMN();
            this.testClient.write(msgData);
            setTimeout(()=>{
                if (this.messagesIn.length > 0){
                    var message = this.getMessage('NAME');
                    if (message.mnemonic == "NAME"){
                        winston.info({message: 'MERGLCB: RQMN passed'});
                        this.passed_count++;
                        this.hasTestPassed = true;
						retrieved_values ["NAME"] = message.name;
                        winston.info({message: '      RQMN: Name  : ' + message.name});
                    }
                }
                if (!this.hasTestPassed){ winston.info({message: 'MERGLCB: RQMN failed'}); }
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
    
    test_SNN() {
        return new Promise(function (resolve, reject) {
            //here our function should be implemented 
            winston.debug({message: 'MERGLCB: BEGIN SNN test'});
            this.hasTestPassed = false;
            this.messagesIn = [];
            var msgData = cbusLib.encodeSNN(this.test_nodeNumber);
            this.testClient.write(msgData);
            setTimeout(()=>{
                if (this.messagesIn.length > 0){
                    var message = this.getMessage('NNACK');
                    if (message.mnemonic == "NNACK"){
                        if (message.nodeNumber == this.test_nodeNumber) {
                            winston.info({message: 'MERGLCB: SNN passed'});
                            this.passed_count++;
                            this.hasTestPassed = true;
                        }
                    }
                }
                if (!this.hasTestPassed){ winston.info({message: 'MERGLCB: SNN failed'}); }
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
    
    test_QNN(test_node_number) {
        return new Promise(function (resolve, reject) {
            //here our function should be implemented 
            winston.debug({message: 'MERGLCB: BEGIN QNN test'});
            this.hasTestPassed = false;
            this.messagesIn = [];
            var msgData = cbusLib.encodeQNN();
            this.testClient.write(msgData);
            setTimeout(()=>{
                if (this.messagesIn.length > 0){
					
		            this.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						winston.info({message: msg.text});
						if (msg.mnemonic == "PNN"){
							if (msg.nodeNumber == test_node_number){
								winston.info({message: 'MERGLCB: QNN passed'});
								this.passed_count++;
								this.hasTestPassed = true;
							}
						}
					});
				}
				
                if (!this.hasTestPassed){ winston.info({message: 'MERGLCB: QNN failed'}); }
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
    
    test_RQNPN(parameterIndex, module_descriptor) {
        return new Promise(function (resolve, reject) {
            //here our function should be implemented 
            winston.debug({message: 'MERGLCB: Get Param ' + parameterIndex});
            this.hasTestPassed = false;
            this.messagesIn = [];
            var msgData = cbusLib.encodeRQNPN(this.test_nodeNumber, parameterIndex);
            this.testClient.write(msgData);
            setTimeout(()=>{
                if (this.messagesIn.length > 0){
                    var message = this.getMessage('PARAN');
                    if (message.mnemonic == "PARAN"){
						if ( parameterIndex == 0) {
							retrieved_values [NodeParameterText[0]] = message.parameterValue;
						}
						
						// ok - we have a value, so assume the test has passed - now do additional consistency tests
						// and fail the test if any of these tests fail
						this.hasTestPassed = true;
						if (retrieved_values [NodeParameterText[parameterIndex]] != null){
							if ( retrieved_values [NodeParameterText[parameterIndex]] != message.parameterValue){
								winston.info({message: 'MERGLCB: Node parameter failed retrieved value ' 
												+ NodeParameterText[parameterIndex]});
								this.hasTestPassed = false;
							}
						}
						
						if (module_descriptor.nodeParameters[parameterIndex] != null) {
							if ( module_descriptor.nodeParameters[parameterIndex].value != message.parameterValue) {
								winston.info({message: 'MERGLCB: Node parameter failed module_descriptor value ' 
												+ module_descriptor.nodeParameters[parameterIndex].name
												+ ' expected : ' + module_descriptor.nodeParameters[parameterIndex].value });
								this.hasTestPassed = false;
							}
						} else {
							winston.info({message: 'MERGLCB: Warning: No module_descriptor file entry for Node Parameter ' + parameterIndex});
						}
					}
				}
				if (this.hasTestPassed) {
                    winston.info({message: 'MERGLCB: RQNPN index ' + parameterIndex + ' passed'});
                    winston.debug({message: 'MERGLCB: RQNPN value ' + message.parameterValue});
					this.passed_count++;
				} else {
					winston.info({message: 'MERGLCB: RQNPN failed'});
				}
				winston.debug({message: '-'});
                resolve();
                ;} , 100
            );
        }.bind(this));
    }
 
    
    test_harness()
    {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN test_harness'});
			
            setTimeout(()=>{
                winston.debug({message: 'MERGLCB: test_harness timeout done'});
                this.test_function();
				winston.debug({message: '-'});
                resolve();
                ;} , 100
            );
        }.bind(this));
    }

    test_function(){

        winston.debug({message: 'MERGLCB: test_function'});
    }

//
// module_descriptor_read
//
// Synchronous file read, so will block execution till completed, so no timeouts needed
// input - json array with values retrieved from module under test
//
	module_descriptor_read(retrieved_values)
	{
		
		try {
			winston.debug({message: `MERGLCB: retrieved_values : ${JSON.stringify(retrieved_values)}`});
			// use values retrieved from module to create filename
			var filename = retrieved_values["NAME"] + '_' + 
			retrieved_values["Manufacturer’s Id"] + '_' + 
			retrieved_values["Major Version"] + '_' + 
			retrieved_values["Minor Version"] +
			'.json';

			const module_descriptor = jsonfile.readFileSync('./module_descriptors/' + filename)
			winston.info({message: `MERGLCB: module descriptor file read succesfully : ` + filename});
			return module_descriptor;
		} catch (err) {
			winston.debug({message: `MERGLCB: module descriptor file read failed : ` + err});
			winston.info({message: `MERGLCB: failed to read module descriptor file : ` + filename});
		}
		winston.debug({message: '-'});
	}

}

module.exports = {
    cbus_tests: cbus_tests
}