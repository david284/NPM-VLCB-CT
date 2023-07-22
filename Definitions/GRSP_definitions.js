'use strict';

const GRSP = {
	OK: 0,
	CommandNotSupported: 1,
	NotInLearnMode: 2,
	NotInSetupMode: 3,
	TooManyEvents: 4,
	NoEvent: 5,
	InvalidEventVariableIndex: 6,
	InvalidEvent: 7,
	InvalidParameterIndex: 9,
	InvalidNodeVariableIndex: 10,
	InvalidEventVariableValue: 11,
	InvalidNodeVariableValue: 12,

	INV_CMD: 100,
	Invalid_Command: 101,
	Invalid_parameter: 102,
	invalid_state: 103,
	Invalid_Command: 104,
	No_EV: 105,

	InvalidService: 252,
	InvalidDiagnosticCode: 253,
	UnknownNVM: 254
}

module.exports = GRSP;