const utils = require('./testUtils');

describe('Utility Functions', () => {
  describe('sumNumbers', () => {
    test('adds two positive numbers correctly', () => {
      expect(utils.sumNumbers(2, 3)).toBe(5);
    });

    test('handles negative numbers', () => {
      expect(utils.sumNumbers(-1, 1)).toBe(0);
      expect(utils.sumNumbers(-5, -3)).toBe(-8);
    });
  });

  describe('isEven', () => {
    test('returns true for even numbers', () => {
      expect(utils.isEven(2)).toBe(true);
      expect(utils.isEven(0)).toBe(true);
      expect(utils.isEven(-4)).toBe(true);
    });

    test('returns false for odd numbers', () => {
      expect(utils.isEven(1)).toBe(false);
      expect(utils.isEven(-3)).toBe(false);
    });
  });

  describe('capitalize', () => {
    test('capitalizes the first letter and lowercases the rest', () => {
      expect(utils.capitalize('hello')).toBe('Hello');
      expect(utils.capitalize('WORLD')).toBe('World');
      expect(utils.capitalize('sEcUrEhEr')).toBe('Secureher');
    });

    test('handles empty strings', () => {
      expect(utils.capitalize('')).toBe('');
      expect(utils.capitalize(null)).toBe('');
      expect(utils.capitalize(undefined)).toBe('');
    });
  });

  describe('formatPhoneNumber', () => {
    test('formats a 10-digit phone number correctly', () => {
      expect(utils.formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    test('returns the original input if not 10 digits', () => {
      expect(utils.formatPhoneNumber('123456789')).toBe('123456789');
      expect(utils.formatPhoneNumber('12345678901')).toBe('12345678901');
      expect(utils.formatPhoneNumber('')).toBe('');
    });
  });
});
