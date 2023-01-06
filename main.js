'use strict';
const winston = require('./config/winston.js');
const IP_Network = require('./ip_network.js')
const MNS_tests = require('./MinimumNodeServiceTests.js');
const example_tests = require('./exampletests.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), but can't be changed through reassigment or redeclared

const NET_ADDRESS = "127.0.0.1"
const NET_PORT = 5550;

winston.info({message: ' MERGLCB Conformance Test '});

// create network conenction for tests to use
const  Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);


// create instance of MNS tests
const MNS = new MNS_tests.MinimumNodeServiceTests(Network);
const examples = new example_tests.ExampleTests(Network);

// Block to call tests to ensure they run in sequence
// this relies on the underlying functions being themselves async functions, which can be called with an 'await' method
// Only code within this code block will be executed in sequence
async function runtests() {
	// JSON array of module values to use within the tests - needs to be empty array so it's passed by reference
	var module_descriptor = {a: 1};

	module_descriptor = await (MNS.runTests(module_descriptor));
	await (examples.runTests());

	// tests done, close connection
	Network.closeConnection()
	winston.info({message: 'MERGLCB: End of test sequence'});
	winston.info({message: 'MERGLCB: Module Descriptor ' + JSON.stringify(module_descriptor)});
}

// actually invoke block of tests
// (can't use async on top level code)
runtests();







