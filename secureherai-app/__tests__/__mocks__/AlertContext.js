// Mock implementation of the AlertContext
const React = require('react');

const AlertContext = React.createContext({
  showAlert: () => {},
  showConfirmAlert: () => {},
});

function useAlert() {
  return {
    showAlert: jest.fn(),
    showConfirmAlert: jest.fn((title, message, onConfirm) => onConfirm()),
  };
}

module.exports = {
  AlertContext,
  useAlert,
};
