'use strict';

module.exports = [
	"0":{
		"name":"Reserved",
		"diagnostics":{}
	},
	"1":{
		"name":"Minimum Node Service",
		"diagnostics":{
			"1":{"name":"STATUS"},
			"2":{"name":"UPTIME upper word"},
			"3":{"name":"UPTIME lower word"},
			"4":{"name":"Memory Fault Indicator"},
			"5":{"name":"Node ID change count"},
			"6":{"name":"Software Error Status"},
			"7":{"name":"Message Processed Count"}
		}
	},
	"2":{
		"name":"Node Variable Service",
		"diagnostics":{}
	},
	"3":{
		"name":"CAN Service",
		"diagnostics":{}
	},
	"4":{
		"name":"Teaching Service",
		"diagnostics":{}
	},
	"5":{
		"name":"Producer Service",
		"diagnostics":{}
	},
	"6":{
		"name":"Consumer Service",
		"diagnostics":{}
	},
	// 7 - unassigned
	// 8 - unassigned
	"9":{
		"name":"Event Acknowledge Service",
		"diagnostics":{}
	},
	"10":{
		"name":"Boot Service",
		"diagnostics":{}
	},
	"11":{
		"name":"Boot2 Service",
		"diagnostics":{}
	},
	"12":{
		"name":"Fast Clock Service",
		"diagnostics":{}
	},
	"13":{
		"name":"DCC Cab Service",
		"diagnostics":{}
	},
	"14":{
		"name":"DCC Command Service",
		"diagnostics":{}
	},
	"15":{
		"name":"CAN Bridge Service",
		"diagnostics":{}
	},
	"16":{
		"name":"SLiM Service",
		"diagnostics":{}
	},
	"17":{
		"name":"Long Message Service",
		"diagnostics":{}
	}
];
