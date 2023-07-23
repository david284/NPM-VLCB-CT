# NPM-VLCB-CT

This is an application to test conformance with the VLCB specification   
More information about VLCB can be found here -> https://github.com/Versatile-LCB/VLCB-documents.git   

The application is written in javascript, and uses the Node.js cross-platform runtime environment to run the javascript on the computer being used   
As it's a remote unit being tested, typical 'off-the-shelf' unit test frameworks are not suitable for this (but see unit-tests section)


# Requirements
1. Node.js - see Node.js section
2. a connection to the device to be tested  - see Connection section
3. this application - see installation section

# Node.js
This application requires Node.js (& npm) to run   
Get Node.js from -> https://nodejs.org/en/download/package-manager/

# Installation:
Once Node.js is installed, clone the application, or take the zip file, & extract to your location of choice   
Use the green 'code' button near the top of this page   
(cloning is recommended, as it's easier to update)

After the repo is cloned locally, at the root of the repo, run 'npm install' to load all dependancies - this may take a little while

On windows, once installed, if you then get npm failing to run (I get mixed '\' and '/' trying to load files),  you may need to "Set the npm run shell" by running the following
	npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"   
Original source -> https://digipie.github.io/digidocs/nodejs/set-npm-run-shell/

To prove the installation has worked, run the stand alone unit-tests using 'npm tests' - see unit-tests section for more details

# Connection
The application is expecting to communicate with the module to be tested, typically residing on a CANBUS network   
To access the CANBUS network, the application is expecting to use a network connection to something that provides a CANBUS connection   
Typically, this would be a combination of a CANUBS4 device and the cbusserver application   
The cbusServer service here -> See https://www.merg.org.uk/merg_wiki/doku.php?id=cbus_server:cbus_server&s[]=cbusserver   
See details on cbusServer on setting up the serial port   

The default IP settings should work 'out the box'   
But the ip & port settings are in the server.js file, and can easily changed for a remote IP connection or a different port if required   

Alternatively, there is a software simulation of a CBUS network available, which avoids the need for anything else   
This application provides a simulation of multiple modules on a VLCB network, and has been used to test operation of this conformance test   
https://github.com/david284/CbusNetworkSimulator.git

# Execution:
To run the app, use 'npm start'   
The program will prompt to put the module under test into setup mode (press it's button),   
and will proceed with testing once it receives the intial contact with the module   
As well as the screen display of the results, there are files saved in the folder 'Test_Results'   

# Test-Results folder
'TestReport.txt' is basically a copy of the screen output   
'debuglog.txt' is a low level record of the execution (pretty big)   
'Retrieved Values.txt' is a copy of the JSON used internally by the application to hold information retrieved from the unit (quite readable)   
Historic copies of these files are also stored in a sub-folder for each specific module, by date&time, so previous runs can be accessed   

# Documentation
There is a documentation folder   
The code is arranged as test suites, typically a test suite for each service, which contain calls to multiple test cases for that specific service   
Each use case typically tests one specific behaviour of a single opcode, and will set a pass/fail condition on execution   
The documentation mirrors this, being composed of test suite documents & use case documents - see following sections on test suites & test cases   

# test suites
These determine the what test cases (opcodes) are used, the sequence they are called in and the parameters used for the specific service   
As the code is quite concise and readable, the documentation for these is quite similar to the code, and maybe unnecessary, but it's there for the moment

# Test cases
The test cases contain the actual logic for the test, with the intention of producing a simple pass/fail result   
With opcode that provide multiple results (ek - ok, invalid parameter etc..) then there will be a test case for each   
The documentation uses the given/when/then syntax to declare the intent of the test, without going into the 'how', to minimise as much as possible the burden of keeping it updated   
As the documentation for each test case is a few lines at most, they are grouped into documents for ranges of opcodes - e.g. '0x1X' for codes 0x10 to 0x1F   
The aim of the test case is to exercise all combinations of parameters for supported opcodes. Boundary values are used for efficient test cases (see Boundary Value Analysis below).

# Boundary Value Analysis
Boundary Value Analysis (or Boundary testing) is based on testing the boundary values of valid and invalid partitions (closely related to equivalence partitioning)   
The behavior at the boundary of each partion is more likely to be incorrect than the behavior within the partion, so boundaries are an area where testing is likely to yield defects   
For example, a byte variable with a valid range of 0 to 100 (and, by implication, an invalid range of 101 to 255), would have boundary test values of 0, 100, 101 and 255, where 0 and 100 would have a valid result, and 101 and 255 would have an invalid result (whatever that means in that context). An extra test case worth adding would be a single bit - see single bit test case below

# Single bit test case
Where the test value requires programatic ordering, e.g. where the value is a less than a whole byte, or occupies multiple bytes, then setting just one bit will validate the ordering & placement of the value. Adding a one bit test to every set of test cases ensures this is never neglected, even if it's strictly not required in some cases.

# Module Descriptor File
The test aims to verify some values using a module-descriptor file thats specific to the module & it's firmware version   
It's quite likely this module_descriptor file doesn't exist for the module being tested,   
but the application will create a basic file if one doesn't exist   
The file is in jSON format, so modifying the contents to suit is straighforward if required   

# unit-tests
In order to verify the operation of this conformance test application (i.e. 'test the tests'), there are stand alone unit-tests   
When run, these check the basic functions are working as expected in isolation, so doesn't need any connection to any actual device   
These are simply run by using 'npm test', and mostly test the correct handling of each opcode, including error responses   
As these tests are testing the application itself, then the Mocha javascript test framework is used, in combination with the Chia assertion library   
https://mochajs.org/   
https://www.chaijs.com/api/bdd/   