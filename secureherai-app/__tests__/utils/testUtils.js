/**
 * Test utilities for unit tests
 */

// Sample utility functions for testing
const sumNumbers = (a, b) => a + b;

const isEven = (num) => num % 2 === 0;

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const formatPhoneNumber = (phone) => {
  if (!phone || phone.length !== 10) return phone;
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
};

module.exports = {
  sumNumbers,
  isEven,
  capitalize,
  formatPhoneNumber
};
