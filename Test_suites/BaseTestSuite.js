'use strict';
const winston = require('winston');		// use config from root instance

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared



module.exports = class BaseTestSuite {

    constructor() {}
		

}

