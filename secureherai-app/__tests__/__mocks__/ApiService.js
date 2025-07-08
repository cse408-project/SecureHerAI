// Mock implementation of the API service
const ApiService = {
  getTrustedContacts: jest.fn(),
  addTrustedContact: jest.fn(),
  updateTrustedContact: jest.fn(),
  deleteTrustedContact: jest.fn(),
};

module.exports = {
  default: ApiService,
};
