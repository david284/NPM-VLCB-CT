var winston = require('./config/winston.js');
const IP_Network = require('./ip_network.js')
const MNS_tests = require('./MinimumNodeServiceTests.js');

const NET_ADDRESS = "127.0.0.1"
const NET_PORT = 5550;

winston.info({message: ' MERGLCB Conformance Test '});

let  Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);

let MNS = new MNS_tests.MinimumNodeServiceTests(Network);

MNS.runTests();







