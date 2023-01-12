'use strict';
var winston = require('winston');		// use config from root instance
const net = require('net');

const cbusLib = require('cbusLibrary')

//
//  *************** mock cbus network ********************
//  Only supports the functionality necessary to enable testing
//  It is not intended to fully simulate the actions of real modules
//
//		Grid connect CAN over serial message syntax
//     : <S | X> <IDENTIFIER> <N> <DATA-0> <DATA-1> … <DATA-7> ;
//
//	


//
//
//
function decToHex(num, len) {return parseInt(num).toString(16).toUpperCase().padStart(len, '0');}


//
//
//
function  arrayChecksum(array, start) {
    var checksum = 0;
    if ( start != undefined) {
        checksum = (parseInt(start, 16) ^ 0xFFFF) + 1;
    }
    for (var i = 0; i <array.length; i++) {
        checksum += array[i]
        checksum = checksum & 0xFFFF        // trim to 16 bits
    }
    var checksum2C = decToHex((checksum ^ 0xFFFF) + 1, 4)    // checksum as two's complement in hexadecimal
    return checksum2C
}




class mock_CbusNetwork {

    constructor(NET_PORT) {
		winston.debug({message: 'Mock CBUS Network: Starting'});
        
        this.clients = [];


		this.sendArray = [];
		this.socket;
		
        this.firmware = []
        this.firmwareChecksum = null
        
		this.modules = 	[
						new CANACC8 (0),
						new CANSERVO8C (1),
						new CANMIO (65535)
						]

		this.server = net.createServer(function (socket) {
			this.socket=socket;
			socket.setKeepAlive(true,60000);
            this.clients.push(socket);
            
			socket.on('data', function (data) {
				winston.debug({message: 'Mock CBUS Network: Receive <<<< Port: ' + socket.remotePort});
				const msgArray = data.toString().split(";");
				for (var i = 0; i < msgArray.length - 1; i++) {
					msgArray[i] = msgArray[i].concat(";");				// add back the ';' terminator that was lost in the split
					this.sendArray.push(msgArray[i]);					// store the incoming messages so the test can inspect them
                    var cbusMsg = cbusLib.decode(msgArray[i]);
                    if ( cbusMsg.ID_TYPE == 'S' ) {
                        this.processStandardMessage(cbusMsg)
                    } else if ( cbusMsg.ID_TYPE == 'X' ) {
                        this.processExtendedMessage(cbusMsg)
                    } else {
                        winston.info({message: 'Mock CBUS Network: Receive <<<< message UNKNOWN ID TYPE [' + msgIndex + '] ' +  message + " <<< "});
                    }
                }
			}.bind(this));

			socket.on('end', function () {
                this.clients.splice(this.clients.indexOf(socket), 1);
                var rport = socket.remotePort;
				winston.debug({message: 'Mock CBUS Network: Client Disconnected at port ' + rport});
			}.bind(this));
			
			socket.on('error', function(err) {
				winston.debug({message: 'Mock CBUS Network: Socket error ' + err});
			}.bind(this));
			
		}.bind(this));

		this.server.listen(NET_PORT);
		
		// emitted when new client connects
		this.server.on('connection',function(socket){
			var rport = socket.remotePort;
			winston.debug({message: 'Mock CBUS Network: remote client ' + this.clients.length + ' at port : ' + rport});
		}.bind(this));
	}

    processExtendedMessage(cbusMsg) {
        winston.debug({message: 'Mock CBUS Network: Receive <<<< EXTENDED ID message: ' + cbusMsg.text });
        if (cbusMsg.type == 'CONTROL') {
            switch (cbusMsg.SPCMD) {
                case 0:
                    winston.debug({message: 'Mock CBUS Network: <<< Received control message CMD_NOP <<< '});
                    break;
                case 1:
                    winston.debug({message: 'Mock CBUS Network: <<< Received control message CMD_RESET  <<< '});
                    this.firmware = []
                    break;
                case 2:
                    winston.debug({message: 'Mock CBUS Network: <<< Received control message CMD_RST_CHKSM <<< '});
                    break;
                case 3:
                    winston.debug({message: 'Mock CBUS Network: <<< Received control message CMD_CHK_RUN <<< '});
                    this.firmwareChecksum = arrayChecksum(this.firmware)
                    winston.debug({message: 'Mock CBUS Network: CMD_CHK_RUN: calculated checksum: ' + this.firmwareChecksum + ' received checksum: ' + decToHex(cbusMsg.CPDTH, 2) + decToHex(cbusMsg.CPDTL, 2)});
                    if (this.firmwareChecksum == decToHex(cbusMsg.CPDTH, 2) + decToHex(cbusMsg.CPDTL, 2)) {
                        this.outputExtResponse(1)   // 1 = ok
                    } else {
                        this.outputExtResponse(0)   // 0 = not ok
                    }
                    break;
                case 4:
                    winston.debug({message: 'Mock CBUS Network: <<< Received control message CMD_BOOT_TEST <<< '});
                    this.outputExtResponse(2)   // 2 = confirm boot load
                    this.firmware = []
                    break;
                default:
                    winston.debug({message: 'Mock CBUS Network: <<< Received control message UNKNOWN COMMAND ' + cbusMsg.text});
                    break
            }
        }
        if (cbusMsg.type == 'DATA') {
            for (var i = 0; i < 8; i++) {this.firmware.push(cbusMsg.data[i])}
//            winston.debug({message: 'Mock CBUS Network: <<< Received DATA - new length ' + this.firmware.length});
        }
    }


    outputExtResponse(value) {
		var msgData = cbusLib.encode_EXT_RESPONSE(value)
        this.broadcast(msgData)
    }


    processStandardMessage(cbusMsg) {
        winston.debug({message: 'Mock CBUS Network: Receive <<<< STANDARD ID message ' + cbusMsg.text });
        switch (cbusMsg.opCode) {
            case '0D':
                // Format: <MjPri><MinPri=3><CANID>]<0D>
                winston.debug({message: 'Mock CBUS Network: received QNN'});
                for (var i = 0; i < this.modules.length; i++) {
                    this.outputPNN(this.modules[i].getNodeNumber(), 
                        this.modules[i].getManufacturerId(),
                        this.modules[i].getModuleId(), 
                        this.modules[i].getFlags())
                }
                break;
			case '10': // RQNP
				for (var moduleIndex = 0; moduleIndex < this.modules.length; moduleIndex++) {
					// should only respond if in setup mode
					if (this.modules[moduleIndex].inSetupMode()){
						this.outputPARAMS(this.modules[moduleIndex].getNodeNumber());
					}
				}
				break;
			case '11': // RQMN
				this.outputNAME("CANTEST");			
				break;
			case '22':  // QLOC
                break;
            case '42':
                // Format: [<MjPri><MinPri=3><CANID>]<42><NNHigh><NNLow>
                var nodeNumber = cbusMsg.nodeNumber
                winston.debug({message: 'Mock CBUS Network: received SNN : new Node Number ' + nodeNumber});
				this.outputNNACK(nodeNumber);
                break;
            case '53':
                // Format: [<MjPri><MinPri=3><CANID>]<53><NN hi><NN lo>
                winston.debug({message: 'Mock CBUS Network: received NNLRN'});
                break;
            case '54':
                // Format: [<MjPri><MinPri=3><CANID>]<54><NN hi><NN lo>>
                winston.debug({message: 'Mock CBUS Network: received NNULN'});
                break;
            case '57':
                // Format: [<MjPri><MinPri=3><CANID>]<57><NN hi><NN lo>
                winston.debug({message: 'Mock CBUS Network: received NERD'});
                var nodeNumber = cbusMsg.nodeNumber
                if ( this.getModule(nodeNumber) != undefined) {
                    var events = this.getModule(nodeNumber).getStoredEvents();
                    //for (var i = 0; i < events.length; i++) {
                        //this.outputENRSP(nodeNumber, i);
                    //}
                    // only output first event (if it exists)
                    if (events.length > 0) {
                        this.outputENRSP(nodeNumber, events[0].eventName, 0);
                    }
                }

                break;
            case '58':
                // Format: [<MjPri><MinPri=3><CANID>]<58><NN hi><NN lo>
                winston.debug({message: 'Mock CBUS Network: received RQEVN'});
                var storedEventsCount = this.getModule(cbusMsg.nodeNumber).getStoredEventsCount();
                this.outputNUMEV(cbusMsg.nodeNumber, storedEventsCount);
                break;
            case '5C':
                // Format: [<MjPri><MinPri=3><CANID>]<5C><NN hi><NN lo>>
                winston.debug({message: 'Mock CBUS Network: received BOOTM: node ' + cbusMsg.nodeNumber });
                break;
            case '71':
                // Format: [<MjPri><MinPri=3><CANID>]<71><NN hi><NN lo><NV#>
                winston.debug({message: 'Mock CBUS Network: received NVRD'});
                break;
            case '73':
                // Format: [<MjPri><MinPri=3><CANID>]<73><NN hi><NN lo><Para#>
                winston.debug({message: 'Mock CBUS Network: received RQNPN'});
                var paramValue = this.getModule(cbusMsg.nodeNumber).getParameter(cbusMsg.parameterIndex);
                this.outputPARAN(cbusMsg.nodeNumber, cbusMsg.parameterIndex, paramValue);
                break;
            case '75':
                // Format: [<MjPri><MinPri=3><CANID>]<73><NN hi><NN lo><CANID>
                winston.debug({message: 'Mock CBUS Network: received CANID'});
                break;
            case '78':
                winston.debug({message: 'Mock CBUS Network: received RQSD'});
                // Format: [<MjPri><MinPri=3><CANID>]<78><NN hi><NN lo><ServiceIndex>
				if (cbusMsg.ServiceIndex == 0) {
					this.outputSD(cbusMsg.nodeNumber, 0, 1, 5);
					this.outputSD(cbusMsg.nodeNumber, 1, 2, 5);
					this.outputSD(cbusMsg.nodeNumber, 255, 3, 5);
				}
				break;
            case '87': 
                winston.debug({message: 'Mock CBUS Network: received RDGN'});
                // Format: [<MjPri><MinPri=3><CANID>]<87><NN hi><NN lo><ServiceIndex><DiagnosticCode>
				if (cbusMsg.ServiceIndex == 0) {
					this.outputDGN(cbusMsg.nodeNumber, 0, 1, 65535);
					this.outputDGN(cbusMsg.nodeNumber, 1, 255, 0);
					this.outputDGN(cbusMsg.nodeNumber, 255, 0, 1);
				}
				break;
            case '90':
                // Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
                winston.debug({message: 'Mock CBUS Network: received ACON'});
                break;
            case '91':
                // Format: [<MjPri><MinPri=3><CANID>]<91><NN hi><NN lo><EN hi><EN lo>
                winston.debug({message: 'Mock CBUS Network: received ACOF'});
                break;
            case '95':
                // Format: [<MjPri><MinPri=3><CANID>]<95><NN hi><NN lo><EN hi><EN lo>
                winston.debug({message: 'Mock CBUS Network: received EVULN'});
                break;
            case '96':
                // Format: [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
                winston.debug({message: 'Mock CBUS Network: received NVSET'});
                break;
            case '9C':
                // Format: [<MjPri><MinPri=3><CANID>]<9C><NN hi><NN lo><EN#><EV#>
                winston.debug({message: 'Mock CBUS Network: received REVAL'});
                break;
            case 'D2':
                // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo>
                winston.debug({message: 'Mock CBUS Network: received EVLRN'});
                break;
            default:
                winston.debug({message: 'Mock CBUS Network: ********************** received unknown opcode ' + cbusMsg.opCode});
                break;
        }
    }


    broadcast(msgData) {
        this.clients.forEach(function (client) {
			winston.debug({message: 'Mock CBUS Network: Output ' + cbusLib.decode(msgData).text});
            client.write(msgData);
            winston.debug({message: 'Mock CBUS Network: Transmit >>>> Port: ' + client.remotePort + ' Data: ' + msgData});
        });
    }


	getSendArray() {
		return this.sendArray;
	}

	
	clearSendArray() {
		this.sendArray = [];
	}


	stopServer() {
		this.server.close();
		this.socket.end();
		winston.debug({message: 'Mock CBUS Network: Server closed'});
	}


	getModule(nodeNumber) {
		for (var i = 0; i < this.modules.length; i++) {
			if (this.modules[i].getNodeNumber() == nodeNumber) return this.modules[i];
		}
	}

	enterSetup(nodeNumber) {
		var module = this.getModule(nodeNumber);
		winston.debug({message: 'Mock CBUS Network: node ' + nodeNumber + ' request start setup'});
		module.startSetupMode();
		this.outputRQNN(nodeNumber);
	}

	exitSetup(nodeNumber) {
		var module = this.getModule(nodeNumber);
		winston.debug({message: 'Mock CBUS Network: node ' + nodeNumber + ' request exit setup'});
		module.endSetupMode();
	}


	// 00 ACK
	outputACK() {
		var msgData = cbusLib.encodeACK();
        this.broadcast(msgData)
	}


	// 21 KLOC
	outputKLOC(session) {
		// Format: [<MjPri><MinPri=2><CANID>]<21><Session>
		var msgData = ':S' + 'B780' + 'N' + '21' + decToHex(session, 2) + ';';
        this.broadcast(msgData)
	}


	// 23 DKEEP
	outputDKEEP(session) {
		var msgData = cbusLib.encodeDKEEP(session);
        this.broadcast(msgData)
	}


	// 47 DSPD
	outputDSPD(session, speed, direction) {
		var msgData = cbusLib.encodeDSPD(session, speed, direction);
        this.broadcast(msgData)
	}


	// 50
	outputRQNN(nodeNumber) {
		//Format: [<MjPri><MinPri=3><CANID>]<50><NN hi><NN lo>
		var msgData = cbusLib.encodeRQNN(nodeNumber);
        this.broadcast(msgData)
	}
	

	// 52
	outputNNACK(nodeNumber) {
		//Format: [<MjPri><MinPri=3><CANID>]<50><NN hi><NN lo>
		var msgData = cbusLib.encodeNNACK(nodeNumber);
        this.broadcast(msgData)
	}
	

	// 57
	outputNERD(nodeNumber) {
		//Format: [<MjPri><MinPri=3><CANID>]<57>NN hi><NN lo>
		var msgData = cbusLib.encodeNERD(nodeNumber);
        this.broadcast(msgData)
	}
	

	// 60
	outputDFUN(session, fn1, fn2) {
		// Format: [<MjPri><MinPri=2><CANID>]<60><Session><Fn1><Fn2>
		var msgData = ':S' + 'B780' + 'N' + '60' + decToHex(session, 2) + decToHex(fn1, 2) + decToHex(fn2, 2) + ';';
        this.broadcast(msgData)
	}


	// 63
	outputERR(data1, data2, errorNumber) {
		// Format: [<MjPri><MinPri=2><CANID>]<63><Dat 1><Dat 2><Dat 3>
		var msgData = cbusLib.encodeERR(data1, data2, errorNumber);
        this.broadcast(msgData)
	}


	// 6F
	outputCMDERR(nodeNumber, errorNumber) {
		// Format: [<MjPri><MinPri=3><CANID>]<6F><NN hi><NN lo><Error number>
		var msgData = cbusLib.encodeCMDERR(nodeNumber, errorNumber);
        this.broadcast(msgData)
	}


	// 71
	outputNVRD(nodeNumber, nodeVariableIndex) {
		var msgData = cbusLib.encodeNVRD(nodeNumber, nodeVariableIndex);
        this.broadcast(msgData)
	}


	// 74
	outputNUMEV(nodeNumber, eventCount) {
		// Format: [<MjPri><MinPri=3><CANID>]<74><NN hi><NN lo><No.of events>
		var msgData = cbusLib.encodeNUMEV(nodeNumber, eventCount);
        this.broadcast(msgData)
	}

	// 8C
	outputSD(nodeNumber, ServiceIndex, ServiceType, ServiceVersion) {
		// SD Format: [<MjPri><MinPri=3><CANID>]<8C><NN hi><NN lo><ServiceIndex><ServiceType><ServiceVersion>
		var msgData = cbusLib.encodeSD(nodeNumber, ServiceIndex, ServiceType, ServiceVersion);
        this.broadcast(msgData)
	}

	// 90
	outputACON(nodeNumber, eventNumber) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeACON(nodeNumber, eventNumber);
        this.broadcast(msgData)
	}


	// 91
	outputACOF(nodeNumber, eventNumber) {
		// Format: [<MjPri><MinPri=3><CANID>]<91><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeACOF(nodeNumber, eventNumber);
        this.broadcast(msgData)
	}


	// 97
	outputNVANS(nodeNumber, nodeVariableIndex, nodeVariableValue) {
		// Format: [<MjPri><MinPri=3><CANID>]<91><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeNVANS(nodeNumber, nodeVariableIndex, nodeVariableValue);
        this.broadcast(msgData)
	}


	// 98
	outputASON(nodeNumber, deviceNumber) {
		// Format: [<MjPri><MinPri=3><CANID>]<98><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeASON(nodeNumber, deviceNumber);
        this.broadcast(msgData)
	}


	// 99
	outputASOF(nodeNumber, deviceNumber) {
		// Format: [<MjPri><MinPri=3><CANID>]<99><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeASOF(nodeNumber, deviceNumber);
        this.broadcast(msgData)
	}


	// 9B
	outputPARAN(nodeNumber, parameterIndex, parameterValue) {
		// Format: [<MjPri><MinPri=3><CANID>]<9B><NN hi><NN lo><Para#><Para val>
		var msgData = cbusLib.encodePARAN(nodeNumber, parameterIndex, parameterValue);
        this.broadcast(msgData)
	}

	
	// B0
	outputACON1(nodeNumber, eventNumber, data1) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeACON1(nodeNumber, eventNumber, data1);
        this.broadcast(msgData)
	}


	// B1
	outputACOF1(nodeNumber, eventNumber, data1) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeACOF1(nodeNumber, eventNumber, data1);
        this.broadcast(msgData)
	}


	// B5
	outputNEVAL(nodeNumber, eventIndex, eventVariableIndex, eventVariableValue) {
		var msgData = cbusLib.encodeNEVAL(nodeNumber, eventIndex, eventVariableIndex, eventVariableValue);
        this.broadcast(msgData)
	}

	
	// B6
	outputPNN(nodeNumber, manufacturerId, moduleId, flags) {
		var msgData = cbusLib.encodePNN(nodeNumber, manufacturerId, moduleId, flags);
        this.broadcast(msgData)
	}


	// B8
	outputASON1(nodeNumber, deviceNumber, data1) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeASON1(nodeNumber, deviceNumber, data1);
        this.broadcast(msgData)
	}


	// B9
	outputASOF1(nodeNumber, deviceNumber, data1) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeASOF1(nodeNumber, deviceNumber, data1);
        this.broadcast(msgData)
	}


	// C7
	outputDGN(nodeNumber, ServiceIndex, DiagnosticCode, DiagnosticValue) {
		/* // DGN Format: [<MjPri><MinPri=3><CANID>]<C7><NN hi><NN lo><ServiceIndex><DiagnosticCode><DiagnosticValue> */
		var msgData = cbusLib.encodeDGN(nodeNumber, ServiceIndex, DiagnosticCode, DiagnosticValue);
        this.broadcast(msgData)
	}

	// D0
	outputACON2(nodeNumber, eventNumber, data1, data2) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeACON2(nodeNumber, eventNumber, data1, data2);
        this.broadcast(msgData)
	}


	// D1
	outputACOF2(nodeNumber, eventNumber, data1, data2) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeACOF2(nodeNumber, eventNumber, data1, data2);
        this.broadcast(msgData)
	}


	// D8
	outputASON2(nodeNumber, deviceNumber, data1, data2) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeASON2(nodeNumber, deviceNumber, data1, data2);
        this.broadcast(msgData)
	}


	// D9
	outputASOF2(nodeNumber, deviceNumber, data1, data2) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeASOF2(nodeNumber, deviceNumber, data1, data2);
        this.broadcast(msgData)
	}


	// E1
	outputPLOC(session, address, speed, direction, Fn1, Fn2, Fn3) {
		var msgData = cbusLib.encodePLOC(session, address, speed, direction, Fn1, Fn2, Fn3);
        this.broadcast(msgData)
	}

	//E2
	//[<MjPri><MinPri=3><CANID>]<E2><char1><char2><char3><char4><char5><char6><char7>
	outputNAME(name) {
		var msgData = cbusLib.encodeNAME(name);
		this.broadcast(msgData);
	}

	// EF
	outputPARAMS(nodeNumber) {
        if (this.getModule(nodeNumber) != undefined) {
            var msgData = cbusLib.encodePARAMS(
                this.getModule(nodeNumber).getParameter(1), 
                this.getModule(nodeNumber).getParameter(2), 
                this.getModule(nodeNumber).getParameter(3), 
                this.getModule(nodeNumber).getParameter(4), 
                this.getModule(nodeNumber).getParameter(5), 
                this.getModule(nodeNumber).getParameter(6), 
                this.getModule(nodeNumber).getParameter(7), 
                )
            this.broadcast(msgData)
        }
	}
	

	// F0
	outputACON3(nodeNumber, eventNumber, data1, data2, data3) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeACON3(nodeNumber, eventNumber, data1, data2, data3);
        this.broadcast(msgData)
	}


	// F1
	outputACOF3(nodeNumber, eventNumber, data1, data2, data3) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeACOF3(nodeNumber, eventNumber, data1, data2, data3);
        this.broadcast(msgData)
	}


	//F2
	outputENRSP(nodeNumber, eventName, eventIndex) {
		// ENRSP Format: [<MjPri><MinPri=3><CANID>]<F2><NN hi><NN lo><EN3><EN2><EN1><EN0><EN#>
        var msgData = cbusLib.encodeENRSP(nodeNumber, eventName, eventIndex)
        this.broadcast(msgData)
	}


	// F8
	outputASON3(nodeNumber, deviceNumber, data1, data2, data3) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeASON3(nodeNumber, deviceNumber, data1, data2, data3);
        this.broadcast(msgData)
	}


	// F9
	outputASOF3(nodeNumber, deviceNumber, data1, data2, data3) {
		// Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
		var msgData = cbusLib.encodeASOF3(nodeNumber, deviceNumber, data1, data2, data3);
        this.broadcast(msgData)
	}


	// FC
	outputUNSUPOPCODE(nodeId) {
		// Ficticious opcode - 'FC' currently unused
		// Format: [<MjPri><MinPri=3><CANID>]<FC><NN hi><NN lo>
		var msgData = ':S' + 'B780' + 'N' + 'FC' + decToHex(nodeId, 4) + ';';
        this.broadcast(msgData)
	}
}

class CbusModule {
	constructor(nodeNumber) {
     	this.events = []
		this.nodeNumber = nodeNumber;
		this.setupMode = false;
		this.parameters = 	[ 	8,		// number of available parameters
								165,    // param 1 manufacturer Id
								117,		// param 2 Minor code version
								0,		// param 3 module Id
								0,		// param 4 number of supported events
								0,		// param 5 number of event variables
								0,		// param 6 number of supported node variables
								2,		// param 7 major version
								13,		// param 8 node flags
								1,		// param 9 cpu type (1 = P18F2480)
								1,		// param 10 interface type (1 = CAN)
								// NODE flags
								// 	Bit 0	: Consumer
								//	Bit 1	: Producer
								//	Bit 2	: FLiM Mode
								//	Bit 3	: The module supports bootloading		
							]
        this.parameters[19] = 1;        // param 19 cpu manufacturer (1 = ATMEL)                           
	}

	getStoredEvents() { return this.events}
	getStoredEventsCount() { return this.events.length}
	
	getParameter(i) {return this.parameters[i]}
	
	//setup mode
	inSetupMode(){
		return this.setupMode;
//		winston.info({message: 'Mock_cbus Network: Node ' + this.nodeNumber + ' setup mode is ' + this.setupMode});
	}
	startSetupMode(){ 
		this.setupMode=true;
//		winston.info({message: 'Mock_cbus Network: Node ' + this.nodeNumber + ' started setup mode'});
	}
	endSetupMode(){ 
		this.setupMode=false;
//		winston.info({message: 'Mock_cbus Network: Node ' + this.nodeNumber + ' ended setup mode'});
	}


		// Node Number
		getNodeNumber(){return this.nodeNumber}
		getNodeNumberHex(){return decToHex(this.nodeNumber, 4)}
		setNodeNumber(newNodeNumber) { 
			// can only accept new node number if in setup mode
			if (this.inSetupMode()){
				this.nodeNumber = newNodeNumber;
				this.endSetupMode();
				winston.info({message: 'CBUS Network Sim: Module has new node number ' + newNodeNumber});
			}
		}
			
	
	getModuleId() {return this.parameters[3]}
	getModuleIdHex() {return decToHex(this.parameters[3], 2)}
	setModuleId(Id) {this.parameters[3] = Id}

	getManufacturerId() {return this.parameters[1]}
	getManufacturerIdHex() {return decToHex(this.parameters[1], 2)}
	setManufacturerId(Id) {this.parameters[1] = Id}

	getFlags() {return this.parameters[8]}
	getFlagsHex() {return decToHex(this.parameters[8], 2)}
	setNodeFlags(flags) {this.parameters[8] = flags}

	getCpuType() {return this.parameters[9]}
	getCpuTypeHex() {return decToHex(this.parameters[9], 2)}
	setCputType(value) {this.parameters[9] = value}
}

class CANACC8 extends CbusModule{
	constructor(nodeId) {
		super(nodeId);
		this.setModuleId(3);
		this.setManufacturerId(165);
		this.setNodeFlags(7);
        this.setCputType(1);
        
   		this.events.push({'eventName': 0x012D0103, "variables":[ 0, 0, 0, 0 ]})
		this.events.push({'eventName': 0x012D0104, "variables":[ 0, 0, 0, 0 ]})
	}
}

class CANSERVO8C extends CbusModule{
	constructor(nodeId) {
		super(nodeId);
		this.setModuleId(19);
		this.setManufacturerId(165);
		this.setNodeFlags(7);
        this.setCputType(1);
        
   		this.events.push({'eventName': 0x012D0103, "variables":[ 0, 0, 0, 0 ]})
		this.events.push({'eventName': 0x012D0104, "variables":[ 0, 0, 0, 0 ]})
	}
}

class CANMIO extends CbusModule{
	constructor(nodeId) {
		super(nodeId);
		this.setModuleId(32);
		this.setManufacturerId(165);
		this.setNodeFlags(7);
        this.setCputType(13);
        
   		this.events.push({'eventName': 0x012D0103, "variables":[ 0, 0, 0, 0 ]})
		this.events.push({'eventName': 0x012D0104, "variables":[ 0, 0, 0, 0 ]})
	}
}

class CANCAB extends CbusModule{
	constructor(nodeId) {
		super(nodeId);
		this.setModuleId(9);
		this.setManufacturerId(165);
		this.setNodeFlags(7);
        
   		this.events.push({'eventName': 0x012D0103, "variables":[ 0, 0, 0, 0 ]})
		this.events.push({'eventName': 0x012D0104, "variables":[ 0, 0, 0, 0 ]})
	}
}

class CANPAN extends CbusModule{
	constructor(nodeId) {
		super(nodeId);
		this.setModuleId(29);
		this.setManufacturerId(165);
		this.setNodeFlags(7);
        
   		this.events.push({'eventName': 0x012D0103, "variables":[ 0, 0, 0, 0 ]})
		this.events.push({'eventName': 0x012D0104, "variables":[ 0, 0, 0, 0 ]})
	}
}

class CANCMD extends CbusModule{
	constructor(nodeId) {
		super(nodeId);
		this.setModuleId(10);
		this.setManufacturerId(165);
		this.setNodeFlags(7);
        
   		this.events.push({'eventName': 0x012D0103, "variables":[ 0, 0, 0, 0 ]})
		this.events.push({'eventName': 0x012D0104, "variables":[ 0, 0, 0, 0 ]})
	}
}

class CANACE8C extends CbusModule{
	constructor(nodeId) {
		super(nodeId);
		this.setModuleId(5);
		this.setManufacturerId(165);
		this.setNodeFlags(7);
        this.setCputType(1);
        
   		this.events.push({'eventName': 0x012D0103, "variables":[ 0, 0, 0, 0 ]})
		this.events.push({'eventName': 0x012D0104, "variables":[ 0, 0, 0, 0 ]})
	}
}

class CANMIO_OUT extends CbusModule{
	constructor(nodeId) {
		super(nodeId);
		this.parameters[3] = 52;
		this.setManufacturerId(165);
		this.setNodeFlags(7);
        this.setCputType(13);
        
   		this.events.push({'eventName': 0x012D0103, "variables":[ 0, 0, 0, 0 ]})
		this.events.push({'eventName': 0x012D0104, "variables":[ 0, 0, 0, 0 ]})
	}
}



module.exports = {
    mock_CbusNetwork: mock_CbusNetwork
}




