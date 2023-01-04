'use strict';
const winston = require('./config/winston.js');
const IP_Network = require('./ip_network.js')
const MNS_tests = require('./MinimumNodeServiceTests.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


const NET_ADDRESS = "127.0.0.1"
const NET_PORT = 5550;

winston.info({message: ' MERGLCB Conformance Test '});

let  Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);

let MNS = new MNS_tests.MinimumNodeServiceTests(Network);

MNS.runTests();







