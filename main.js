var winston = require('./config/winston.js');
const Tests = require('./cbus_tests.js')

const NET_ADDRESS = "127.0.0.1"
const NET_PORT = 5550;

winston.info({message: ' MERGLCB Conformance Test '});

let tests = new Tests.cbus_tests(NET_ADDRESS, NET_PORT);

tests.runTests();






