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
	// MNS specific codes
	InvalidService: 252,
	InvalidDiagnosticCode: 253,
	UnknownNVM: 254
}

module.exports = GRSP;