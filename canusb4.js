'use strict';
const winston = require('winston');		// use config from root instance
const {SerialPort} = require("serialport");
const { ReadlineParser } = require('@serialport/parser-readline')
const { MockBinding } = require('@serialport/binding-mock')

const cbusLib = require('cbuslibrary');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class CANUSB4 {

  constructor(USB_PORT){
    this.messagesIn = [];
    this.testStarted = false;  
    this.callback = this.dummyFunction;

  
    if(USB_PORT == "MOCK_PORT"){
      MockBinding.createPort('MOCK_PORT', { echo: false, record: true })
      this.serialPort = new SerialPort({binding: MockBinding, path:'MOCK_PORT', baudRate: 115200});
    } else {
      
      this.serialPort = new SerialPort({
        path: USB_PORT,
        baudRate: 115200,
        dataBits: 8,
        parity: 'none',
        stopBits: 1
      })
    }

    winston.debug({message: 'CANUSB4: Connecting to ' + USB_PORT + '\n'});

    this.parser = this.serialPort.pipe(new ReadlineParser({ delimiter: ';' }))

    this.serialPort.on("open", function () {
      winston.info({message: `CANUSB4: Serial Port : ${USB_PORT} Open`})
    }.bind(this));
    
    this.parser.on('data', function (data) {
      data += ';'
      var decodedMsg = cbusLib.decode(data)
      this.messagesIn.push(data)
      winston.debug({message: 'CANUSB4: <<< receive ' + data + " " + decodedMsg.text});
      if (this.testStarted) {
        winston.info({message: `VLCB     >>> Receive : ${decodedMsg.text}`})
      }
    }.bind(this));

    this.serialPort.on("error", function (err) {
      winston.error({message: `CANUSB4: Serial port ERROR:  : ${err.message}`})
    }.bind(this));


  } // end constructor


  write(msgData) {
    var decodedMsg = cbusLib.decode(msgData);
    this.serialPort.write(msgData)
    winston.debug({message: 'CANUSB4: Transmit >>> ' + decodedMsg.encoded + ' ' + decodedMsg.text});		
    winston.info({message: 'VLCB:      >>> transmitted: ' + decodedMsg.text}); 
  }

	dummyFunction(msg) {
    // do nothing - this function will be replaced at runtime
  }

} // end class

module.exports = {
  CANUSB4: CANUSB4
}