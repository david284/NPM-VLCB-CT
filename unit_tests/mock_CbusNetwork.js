'use strict';
var winston = require('winston');   // use config from root instance
const net = require('net');

const cbusLib = require('cbusLibrary')
const GRSP = require('./../Definitions/GRSP_definitions.js');

//
//  *************** mock cbus network ********************
//  Only supports the functionality necessary to enable testing
//  It is not intended to fully simulate the actions of real modules
//
//    Grid connect CAN over serial message syntax
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
        
    this.modules =  [
            new CANTEST (0),
            new CANTEST (1),
            new CANTEST (65535)
            ]
            
/*            
    // values to output from DGN opcode - ServiceIndex, DiagnosticCode, DiagnosticValue
    this.DGN_Outputs = {
        "1": { "ServiceIndex": 1, "DiagnosticCode": 1, "DiagnosticValue": 1 }, 
        "2": { "ServiceIndex": 1, "DiagnosticCode": 2, "DiagnosticValue": 2 },  
        "3": { "ServiceIndex": 2, "DiagnosticCode": 1, "DiagnosticValue": 3 },  
        "4": { "ServiceIndex": 3, "DiagnosticCode": 1, "DiagnosticValue": 4 }, 
        "4": { "ServiceIndex": 4, "DiagnosticCode": 1, "DiagnosticValue": 5 }
        };
*/
    // values to output from DGN opcode - ServiceIndex, DiagnosticCode, DiagnosticValue
    // bare minimum to do something - we expect the test will update this array using set_DGN_Outputs()
    this.DGN_Outputs = {
        "1": { "ServiceIndex": 1, "DiagnosticCode": 1, "DiagnosticValue": 1 },
        "2": { "ServiceIndex": 1, "DiagnosticCode": 2, "DiagnosticValue": 0 },  
        "3": { "ServiceIndex": 2, "DiagnosticCode": 3, "DiagnosticValue": 0 },  
        "4": { "ServiceIndex": 3, "DiagnosticCode": 4, "DiagnosticValue": 0 }
        };

    this.Services = {
      "1": {
        "ServiceIndex": 1, "ServiceType": 1, "ServiceVersion": 0,
        "diagnostics": { 
          "1": {"DiagnosticCode": 1, "DiagnosticValue": 1}, 
          "2": {"DiagnosticCode": 1, "DiagnosticValue": 0},
          "3": {"DiagnosticCode": 1, "DiagnosticValue": 0}, 
          "4": {"DiagnosticCode": 1, "DiagnosticValue": 0} 
        }
      }
    }

    this.server = net.createServer(function (socket) {
      this.socket=socket;
      socket.setKeepAlive(true,60000);
            this.clients.push(socket);
            
      socket.on('data', function (data) {
        winston.debug({message: 'Mock CBUS Network: Receive <<<< Port: ' + socket.remotePort});
        const msgArray = data.toString().split(";");
        for (var i = 0; i < msgArray.length - 1; i++) {
          msgArray[i] = msgArray[i].concat(";");        // add back the ';' terminator that was lost in the split
          this.sendArray.push(msgArray[i]);         // store the incoming messages so the test can inspect them
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
            break;
        }
      }
      if (cbusMsg.type == 'DATA') {
        for (var i = 0; i < 8; i++) {this.firmware.push(cbusMsg.data[i])}
//        winston.debug({message: 'Mock CBUS Network: <<< Received DATA - new length ' + this.firmware.length});
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
        case '22': // QLOC
          break;
        case '42': //SNN
          // Format: [<MjPri><MinPri=3><CANID>]<42><NNHigh><NNLow>
          var nodeNumber = cbusMsg.nodeNumber
          winston.debug({message: 'Mock CBUS Network: received SNN : new Node Number ' + nodeNumber});
          this.outputNNACK(nodeNumber);
          break;
        case '4F': //NNRSM
          // Format: [<MjPri><MinPri=3><CANID>]<5E><NN hi><NN lo>
          winston.debug({message: 'Mock CBUS Network: received NNRSM'});
          this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, 0);
          break;
        case '53': //NNLRN
          // Format: [<MjPri><MinPri=3><CANID>]<53><NN hi><NN lo>
          winston.debug({message: 'Mock CBUS Network: received NNLRN'});
          break;
        case '54': //NNULN
          // Format: [<MjPri><MinPri=3><CANID>]<54><NN hi><NN lo>>
          winston.debug({message: 'Mock CBUS Network: received NNULN'});
          break;
        case '56': //NNEVN
          // Format: [<MjPri><MinPri=3><CANID>]<56><NN hi><NN lo>
          winston.debug({message: 'Mock CBUS Network: received NNEVN'});
          this.outputEVNLF(cbusMsg.nodeNumber, 20);
          break;
        case '57': //NERD
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
        case '58': //RQEVN
          // Format: [<MjPri><MinPri=3><CANID>]<58><NN hi><NN lo>
          winston.debug({message: 'Mock CBUS Network: received RQEVN'});
          var storedEventsCount = this.getModule(cbusMsg.nodeNumber).getStoredEventsCount();
          this.outputNUMEV(cbusMsg.nodeNumber, storedEventsCount);
          break;
        case '5C': //BOOTM
          // Format: [<MjPri><MinPri=3><CANID>]<5C><NN hi><NN lo>>
          winston.debug({message: 'Mock CBUS Network: received BOOTM: node ' + cbusMsg.nodeNumber });
          break;
        case '5D': //ENUM
          // Format: [<MjPri><MinPri=3><CANID>]<5D><NN hi><NN lo>>
          winston.debug({message: 'Mock CBUS Network: received ENUM: node ' + cbusMsg.nodeNumber });
          this.outputNNACK(cbusMsg.nodeNumber);
          break;
        case '5E': //NNRST
          // Format: [<MjPri><MinPri=3><CANID>]<5E><NN hi><NN lo>
          winston.debug({message: 'Mock CBUS Network: received NNRST'});
          this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, 0);
          break;
        case '71': //NVRD
          // Format: [<MjPri><MinPri=3><CANID>]<71><NN hi><NN lo><NV#>
          winston.debug({message: 'Mock CBUS Network: received NVRD'});
          if (cbusMsg.encoded.length < 16) {
            this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.Invalid_Command);
          } else {
            var nodeVariables = this.modules[0].nodeVariables;
            for (var i=0; i< nodeVariables.length; i++){
              if ((cbusMsg.nodeVariableIndex == 0) || (cbusMsg.nodeVariableIndex == i)) {
                this.outputNVANS(cbusMsg.nodeNumber, i, nodeVariables[i]);
              }
            }
            if (cbusMsg.nodeVariableIndex + 1 > nodeVariables.length) {
              this.outputCMDERR(cbusMsg.nodeNumber, GRSP.InvalidNodeVariableIndex);
              this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.InvalidNodeVariableIndex);
            }
          }
          break;
        case '73': //RQNPN
          // Format: [<MjPri><MinPri=3><CANID>]<73><NN hi><NN lo><Para#>
          winston.debug({message: 'Mock CBUS Network: received RQNPN'});
          if (cbusMsg.encoded.length < 16) {
            this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.Invalid_Command);
          } else if (cbusMsg.parameterIndex > this.getModule(cbusMsg.nodeNumber).parameters.length) {
              this.outputCMDERR(cbusMsg.nodeNumber, GRSP.InvalidParameterIndex);
              this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.InvalidParameterIndex);                  
          } else {
            var paramValue = this.getModule(cbusMsg.nodeNumber).getParameter(cbusMsg.parameterIndex);
            this.outputPARAN(cbusMsg.nodeNumber, cbusMsg.parameterIndex, paramValue);
          }
          break;
        case '75': //CANID
          // Format: [<MjPri><MinPri=3><CANID>]<75><NN hi><NN lo><CANID>
          winston.debug({message: 'Mock CBUS Network: received CANID'});
          if (cbusMsg.encoded.length < 16) {
            this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.Invalid_Command);
          } else if ((cbusMsg.CAN_ID < 1) || (cbusMsg.CAN_ID > 99)){
            this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.Invalid_parameter);  
            this.outputCMDERR(cbusMsg.nodeNumber, GRSP.InvalidEvent);
          } else {
            this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.OK);  
            this.outputWRACK(cbusMsg.nodeNumber);                
          }
          break;
        case '76': //MODE
          // Format: [<MjPri><MinPri=3><CANID>]<76><NN hi><NN lo><MODE>
          winston.debug({message: 'Mock CBUS Network: received MODE'});
          this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, 0);
          break;
        case '78': //RQSD
          winston.debug({message: 'Mock CBUS Network: received RQSD'});
          // Format: [<MjPri><MinPri=3><CANID>]<78><NN hi><NN lo><ServiceIndex>
          // get count of service entries first
          var count = 0;
          for (var index in this.Services) { count++; }
          if (cbusMsg.encoded.length < 16) {
            this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.Invalid_Command);
          } else if (cbusMsg.ServiceIndex == 0) {
            this.outputSD(cbusMsg.nodeNumber, 0, 0, count);
            // now send a message for each actual service entry
            for (var index in this.Services) {
              this.outputSD(cbusMsg.nodeNumber, 
                this.Services[index].ServiceIndex,
                this.Services[index].ServiceType,
                this.Services[index].ServiceVersion);
            }
          } else
          {
            if(cbusMsg.ServiceIndex > count) {
              this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, cbusMsg.ServiceIndex, GRSP.InvalidService);
            } else {
              this.outputESD(cbusMsg.nodeNumber, cbusMsg.ServiceIndex);
            }
          }
          break;
        case '87': //RDGN
          winston.debug({message: 'Mock CBUS Network: received RDGN'});
          // Format: [<MjPri><MinPri=3><CANID>]<87><NN hi><NN lo><ServiceIndex><DiagnosticCode>
          if (cbusMsg.encoded.length != 18) {
            this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.Invalid_Command);
          } else {
            this.outputDGN(cbusMsg.nodeNumber, cbusMsg.ServiceIndex, cbusMsg.DiagnosticCode) 
          }
          break;
        case '8E': //NVSETRD
          // Format: [<MjPri><MinPri=3><CANID>]<8E><NN hi><NN lo><NV# ><NV val>
          winston.debug({message: 'Mock CBUS Network: received NVSETRD'});
          if (cbusMsg.encoded.length != 18) {
            this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.Invalid_Command);
          } else {
            var nodeVariables = this.modules[0].nodeVariables;
            for (var i=0; i< nodeVariables.length; i++){
              if (cbusMsg.nodeVariableIndex == i) {
                nodeVariables[i] = cbusMsg.nodeVariableValue
                this.outputNVANS(cbusMsg.nodeNumber, i, nodeVariables[i]);
              }
            }
            if (cbusMsg.nodeVariableIndex + 1 > nodeVariables.length) {
              this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.InvalidNodeVariableIndex);
            }
          }
          break;
        case '90': //ACON
          // Format: [<MjPri><MinPri=3><CANID>]<90><NN hi><NN lo><EN hi><EN lo>
          winston.debug({message: 'Mock CBUS Network: received ACON'});
          break;
        case '91': //ACOF
          // Format: [<MjPri><MinPri=3><CANID>]<91><NN hi><NN lo><EN hi><EN lo>
          winston.debug({message: 'Mock CBUS Network: received ACOF'});
          break;
        case '95': //EVULN
          // Format: [<MjPri><MinPri=3><CANID>]<95><NN hi><NN lo><EN hi><EN lo>
          winston.debug({message: 'Mock CBUS Network: received EVULN'});
          break;
        case '96': //NVSET
          // Format: [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
          winston.debug({message: 'Mock CBUS Network: received NVSET'});
          if (cbusMsg.encoded.length != 18) {
            this.outputGRSP(cbusMsg.nodeNumber, cbusMsg.opCode, 1, GRSP.Invalid_Command);
          } else {
            if (cbusMsg.nodeVariableIndex < 255) {
              this.outputWRACK(cbusMsg.nodeNumber);
            } else {
              this.outputCMDERR(cbusMsg.nodeNumber, GRSP.InvalidNodeVariableIndex)
            }
          }
          break;
        case '9C': //REVAL
          // Format: [<MjPri><MinPri=3><CANID>]<9C><NN hi><NN lo><EN#><EV#>
          winston.debug({message: 'Mock CBUS Network: received REVAL'});
          break;
        case 'D2': //EVLRN
          // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo>
          winston.debug({message: 'Mock CBUS Network: received EVLRN'});
          break;
        default:
          winston.debug({message: 'Mock CBUS Network: ********************** received unknown opcode ' + cbusMsg.opCode});
          break;
      }
    }


    broadcast(msgData) {
    if (msgData != null){
      this.clients.forEach(function (client) {
        winston.debug({message: 'Mock CBUS Network: Output ' + cbusLib.decode(msgData).text});
        client.write(msgData);
        winston.debug({message: 'Mock CBUS Network: Transmit >>>> Port: ' + client.remotePort + ' Data: ' + msgData});
      });
    } else {
        winston.debug({message: 'Mock CBUS Network: null data sent to Broadcast() '});      
    }
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
  

  // 59
  outputWRACK(nodeNumber) {
    //Format: [<MjPri><MinPri=3><CANID>]<59>NN hi><NN lo>
    var msgData = cbusLib.encodeWRACK(nodeNumber);
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


  // 70
  outputEVNLF(nodeNumber, value) {
    var msgData = cbusLib.encodeEVNLF(nodeNumber, value);
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

  
  // AB - HEARTB
  outputHEARTB(nodeNumber) {
    // Format: [<MjPri><MinPri=3><CANID>]<AB><NN hi><NN lo><Sequence><StatusByte1><StatusByte2>
    var msgData = cbusLib.encodeHEARTB(nodeNumber, 1, 2, 3);
    this.broadcast(msgData)
  }

  
  // AC - SD
  outputSD(nodeNumber, ServiceIndex, ServiceType, ServiceVersion) {
    // SD Format: [<MjPri><MinPri=3><CANID>]<AC><NN hi><NN lo><ServiceIndex><ServiceType><ServiceVersion>
    var msgData = cbusLib.encodeSD(nodeNumber, ServiceIndex, ServiceType, ServiceVersion);
    this.broadcast(msgData)
  }

  // AF - GRSP
  outputGRSP(nodeNumber, OpCode, ServiceType, Result) {
    // Format: [<MjPri><MinPri=3><CANID>]<AF><NN hi><NN lo><OpCode><ServiceType><Result>
    var msgData = cbusLib.encodeGRSP(nodeNumber, OpCode, ServiceType,Result);
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
  outputDGN(nodeNumber, ServiceIndex, DiagnosticCode) {
    if (ServiceIndex == 0){
      for (var key in this.DGN_Outputs) {
        winston.debug({message: 'Mock CBUS Network: DGN_Output ' + JSON.stringify(key)});   
        var msgData = cbusLib.encodeDGN(nodeNumber, 
          this.DGN_Outputs[key].ServiceIndex,
          this.DGN_Outputs[key].DiagnosticCode, 
          this.DGN_Outputs[key].DiagnosticValue);
          this.broadcast(msgData);
      }
    } else {
      // requesting individual service, so get count of service entries
      var count = 0;
      for (var index in this.Services) { count++; }
      if(ServiceIndex > count) {
        this.outputGRSP(nodeNumber, '5E', ServiceIndex, GRSP.InvalidService);
      } else {
        if (DiagnosticCode == 0) {
          for (var key in this.DGN_Outputs) {
            var msgData = cbusLib.encodeDGN(nodeNumber, 
              this.DGN_Outputs[key].ServiceIndex,
              this.DGN_Outputs[key].DiagnosticCode, 
              this.DGN_Outputs[key].DiagnosticValue);
              this.broadcast(msgData);
          }
        } else {
          // requesting individual service, so get count of service entries
          var diagCount = 0;
          for (var index in this.Services[ServiceIndex].diagnostics) { diagCount++; }
          if (DiagnosticCode > diagCount) {
            this.outputGRSP(nodeNumber, '5E', ServiceIndex, GRSP.InvalidDiagnosticCode);
          } else {
            var msgData = cbusLib.encodeDGN(nodeNumber, 
              ServiceIndex,
              DiagnosticCode, 
              this.Services[ServiceIndex].diagnostics[DiagnosticCode].DiagnosticValue);
              this.broadcast(msgData);
          }
        }
      }
    }
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


  // E7 - ESD
  // ESD Format: [<MjPri><MinPri=3><CANID>]<E7><NN hi><NN lo><ServiceIndex><Data1><Data2><Data3><Data4>
  //
   outputESD(nodeNumber, ServiceIndex) {
      if (this.getModule(nodeNumber) != undefined) {
      var msgData = cbusLib.encodeESD(nodeNumber, ServiceIndex, 1, 2, 3, 4);
      this.broadcast(msgData);
      winston.info({message: 'CBUS Network Sim:  OUT>>  ' + msgData + " " + cbusLib.decode(msgData).text});
    }
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
    this.parameters =   [   
      8,      // number of available parameters
      165,    // param 1 manufacturer Id
      117,    // param 2 Minor code version
      0,      // param 3 module Id
      0,      // param 4 number of supported events
      0,      // param 5 number of event variables
      0,      // param 6 number of supported node variables
      2,      // param 7 major version
      13,     // param 8 node flags
      1,      // param 9 cpu type (1 = P18F2480)
      1,      // param 10 interface type (1 = CAN)
      // NODE flags
      //  Bit 0 : Consumer
      //  Bit 1 : Producer
      //  Bit 2 : FLiM Mode
      //  Bit 3 : The module supports bootloading   
    ]
    this.parameters[19] = 1;        // param 19 cpu manufacturer (1 = ATMEL)                           
    this.nodeVariables = [ 8, 1, 2, 3, 4, 5, 6, 7, 8 ];
    this.parameters[6] = this.nodeVariables.length - 1
  }

  getStoredEvents() { return this.events}
  getStoredEventsCount() { return this.events.length}
  
  getParameter(i) {return this.parameters[i]}
  
  //setup mode
  inSetupMode(){
    return this.setupMode;
//    winston.info({message: 'Mock_cbus Network: Node ' + this.nodeNumber + ' setup mode is ' + this.setupMode});
  }
  startSetupMode(){ 
    this.setupMode=true;
//    winston.info({message: 'Mock_cbus Network: Node ' + this.nodeNumber + ' started setup mode'});
  }
  endSetupMode(){ 
    this.setupMode=false;
//    winston.info({message: 'Mock_cbus Network: Node ' + this.nodeNumber + ' ended setup mode'});
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


class CANTEST extends CbusModule{
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




