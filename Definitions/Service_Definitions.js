'use strict';

module.exports = {
	"0":{
		"name":"Reserved"
	},
	"1":{
		"name":"Minimum Node Service",
		"version":{ 
			"1": {
				"diagnostics":{
					"1":{"name":"STATUS"},
					"2":{"name":"UPTIME upper word"},
					"3":{"name":"UPTIME lower word"},
					"4":{"name":"Memory Fault Indicator"},
					"5":{"name":"Node ID change count"},
					"6":{"name":"Software Error Status"},
					"7":{"name":"Message Processed Count"}
				}
			}
		}
	},
	"2":{
		"name":"Node Variable Service"
	},
	"3":{
		"name":"CAN Service"
	},
	"4":{
		"name":"Teaching Service"
	},
	"5":{
		"name":"Producer Service"
	},
	"6":{
		"name":"Consumer Service"
	},
	// 7 - unassigned
	// 8 - unassigned
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
