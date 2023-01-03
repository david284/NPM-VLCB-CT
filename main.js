var winston = require('./config/winston.js');
const Tests = require('./cbus_tests.js')
const IP_Network = require('./ip_network.js')
const MNS_tests = require('./MinimumNodeServiceTests.js');

const NET_ADDRESS = "127.0.0.1"
const NET_PORT = 5550;

winston.info({message: ' MERGLCB Conformance Test '});

let  Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);

//let tests = new Tests.cbus_tests(NET_ADDRESS, NET_PORT);
//tests.runTests();

let MNS = new MNS_tests.MinimumNodeServiceTests(Network);

MNS.runTests();

//
// all tests done, now close the network connection
//
//Network.closeConnection()







