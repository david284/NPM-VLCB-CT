'use strict';

module.exports = {
	"0":{
		"name":"Reserved"
	},
	"1":{
		"name":"Minimum Node Service",
		"version":{ 
			"0": {
				"diagnostics":{
					"1":{"name":"STATUS"},
					"2":{"name":"UPTIME upper word"},
					"3":{"name":"UPTIME lower word"},
					"4":{"name":"Memory Fault Indicator"},
					"5":{"name":"Node ID change count"},
					"6":{"name":"Software Error Status"}
				}
			},
			"1": {
				"diagnostics":{
					"1":{"name":"STATUS"},
					"2":{"name":"UPTIME upper word"},
					"3":{"name":"UPTIME lower word"},
					"4":{"name":"Memory Fault Indicator"},
					"5":{"name":"Node ID change count"},
					"6":{"name":"Software Error Status"}
				}
			}
		}
	},
	"2":{
		"name":"Node Variable Service",
		"version":{ 
			"0": {
				"diagnostics":{
					"1":{"name":"Access Count"},
					"2":{"name":"Failure Count"}
				}
			},
			"1": {
				"diagnostics":{
					"1":{"name":"Access Count"},
					"2":{"name":"Failure Count"}
				}
			}
		}
	},
	"3":{
		"name":"CAN Service",
		"version":{ 
			"0": {
				"diagnostics":{
					"1":{"name":"Receive error count"},
					"2":{"name":"Transmit error count"},
					"3":{"name":"Error bits"},
					"4":{"name":"Transmit buffers in use"},
					"5":{"name":"Transmit buffer overrun count"},
					"6":{"name":"Transmitted message count"},
					"7":{"name":"Received buffers in use"},
					"8":{"name":"Receive buffer overrun count"},
					"9":{"name":"Received message count"},
					"10":{"name":"Received CAN error frame count"},
					"11":{"name":"Transmitted CAN error frame count"},
					"12":{"name":"Lost CAN arbitration count"},
					"13":{"name":"CANID enumeration count"},
					"14":{"name":"CANID conflict count"},
					"15":{"name":"CANID change count"},
					"16":{"name":"CANID enumeration failure count"}
				}
			},
			"1": {
				"diagnostics":{
					"1":{"name":"Receive error count"},
					"2":{"name":"Transmit error count"},
					"3":{"name":"Error bits"},
					"4":{"name":"Transmit buffers in use"},
					"5":{"name":"Transmit buffer overrun count"},
					"6":{"name":"Transmitted message count"},
					"7":{"name":"Received buffers in use"},
					"8":{"name":"Receive buffer overrun count"},
					"9":{"name":"Received message count"},
					"10":{"name":"Received CAN error frame count"},
					"11":{"name":"Transmitted CAN error frame count"},
					"12":{"name":"Lost CAN arbitration count"},
					"13":{"name":"CANID enumeration count"},
					"14":{"name":"CANID conflict count"},
					"15":{"name":"CANID change count"},
					"16":{"name":"CANID enumeration failure count"},
				}
			},
			"2": {
				"diagnostics":{
					"1":{"name":"Receive error count"},
					"2":{"name":"Transmit error count"},
					"3":{"name":"Error bits"},
					"4":{"name":"Transmit buffers in use"},
					"5":{"name":"Transmit buffer overrun count"},
					"6":{"name":"Transmitted message count"},
					"7":{"name":"Received buffers in use"},
					"8":{"name":"Receive buffer overrun count"},
					"9":{"name":"Received message count"},
					"10":{"name":"Received CAN error frame count"},
					"11":{"name":"Transmitted CAN error frame count"},
					"12":{"name":"Lost CAN arbitration count"},
					"13":{"name":"CANID enumeration count"},
					"14":{"name":"CANID conflict count"},
					"15":{"name":"CANID change count"},
					"16":{"name":"CANID enumeration failure count"},
					"17":{"name":"Transmit buffer usage high watermark"},
					"18":{"name":"Receive buffer usage high watermark"}
				}
			}
		}
	},
	"4":{
		"name":"Teaching Service",
		"version":{ 
			"0": {
				"diagnostics":{
					"1":{"name":"Events taught count"},
				}
			},
			"1": {
				"diagnostics":{
					"1":{"name":"Events taught count"},
				}
			}
		}
	},
	"5":{
		"name":"Producer Service",
		"version":{ 
			"0": {
				"diagnostics":{
					"1":{"name":"Events produced count"},
				}
			},
			"1": {
				"diagnostics":{
					"1":{"name":"Events produced count"},
				}
			}
		}
	},
	"6":{
		"name":"Consumer Service",
		"version":{ 
			"0": {
				"diagnostics":{
					"1":{"name":"Events consumed count"},
				}
			},
			"1": {
				"diagnostics":{
					"1":{"name":"Events consumed count"},
				}
			}
		}
	},
	"7":{
		"name":"New Event Teaching Service"
	},
	"8":{
    "name":"Consume Own Events Service",
		"version":{ 
			"0": {
				"diagnostics":{
					"1":{"name":"Own events consumed count"},
				}
			}
		}
  },
	"9":{
		"name":"Event Acknowledge Service"
	},
	"10":{
		"name":"Boot Service"
	},
	"11":{
		"name":"Boot2 Service"
	},
	"12":{
		"name":"Fast Clock Service"
	},
	"13":{
		"name":"DCC Cab Service"
	},
	"14":{
		"name":"DCC Command Service"
	},
	"15":{
		"name":"CAN Bridge Service"
	},
	"16":{
		"name":"SLiM Service"
	},
	"17":{
		"name":"Long Message Service"
	}
};
