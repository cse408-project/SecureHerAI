// utils.js - Simple utility functions to test
const utils = {
  // Sum two numbers
  sumNumbers: (a, b) => a + b,
  
  // Check if a number is even
  isEven: (num) => num % 2 === 0,
  
  // Capitalize a string
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  
  // Format a phone number (simple version)
  formatPhoneNumber: (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length !== 10) return phoneNumber;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
  }
};

module.exports = utils;
