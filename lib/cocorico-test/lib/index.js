module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRandomUser = getRandomUser;
var firstnames = ['Jacob', 'Emily', 'Michael', 'Madison', 'Joshua', 'Hannah', 'Matthew', 'Emma', 'Andrew', 'Ashley', 'Christopher', 'Abigail', 'Joseph', 'Alexis', 'Daniel', 'Olivia', 'Nicholas', 'Samantha', 'Ethan', 'Sarah', 'William', 'Elizabeth', 'Anthony', 'Alyssa', 'Ryan', 'Grace', 'David', 'Isabella', 'Tyler', 'Lauren', 'John', 'Jessica', 'Alexander', 'Taylor', 'James', 'Brianna', 'Brandon', 'Kayla', 'Zachary', 'Anna', 'Jonathan', 'Victoria', 'Dylan', 'Sophia', 'Christian', 'Natalie', 'Samuel', 'Sydney', 'Justin', 'Chloe', 'Benjamin', 'Megan', 'Nathan', 'Jasmine', 'Austin', 'Rachel', 'Noah', 'Hailey', 'Logan', 'Morgan', 'Jose', 'Destiny', 'Kevin', 'Julia', 'Robert', 'Jennifer', 'Gabriel', 'Kaitlyn', 'Thomas', 'Katherine', 'Caleb', 'Haley', 'Jordan', 'Alexandra', 'Hunter', 'Nicole', 'Cameron', 'Mia', 'Elijah', 'Savannah', 'Jason', 'Maria', 'Kyle', 'Ava', 'Jack', 'Mackenzie', 'Connor', 'Allison', 'Aaron', 'Amanda', 'Isaiah', 'Stephanie', 'Luke', 'Brooke', 'Evan', 'Makayla', 'Angel', 'Jenna', 'Isaac', 'Faith'];

var id = 0;

function getRandomUser() {
  return {
    sub: id++,
    firstName: firstnames[Math.floor(Math.random() * firstnames.length)],
    lastName: firstnames[Math.floor(Math.random() * firstnames.length)],
    birthdate: Math.floor(Math.random() * 27) + '/' + Math.ceil(Math.random() * 12) + '/' + (1940 + Math.floor(Math.random() * 75))
  };
}

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getRandomUser = __webpack_require__(0);

Object.keys(_getRandomUser).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _getRandomUser[key];
    }
  });
});

/***/ }
/******/ ]);