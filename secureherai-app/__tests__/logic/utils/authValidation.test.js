/**
 * Authentication Validation Logic Tests
 * 
 * These tests focus on pure business logic validation functions
 * without any UI dependencies or React Native components
 */

// Email validation function
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // Trim whitespace for validation
  const trimmedEmail = email.trim();
  if (!trimmedEmail) return false;
  
  // RFC 5322 compliant email regex that allows + signs and multiple dots (but not consecutive)
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Additional checks for consecutive dots and other edge cases
  if (trimmedEmail.includes('..')) return false;
  if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) return false;
  if (trimmedEmail.includes('@.') || trimmedEmail.includes('.@')) return false;
  
  return emailRegex.test(trimmedEmail);
}

// Password validation function
const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return errors;
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
};

// Phone number validation function
const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all spaces and special characters except +
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Bangladesh phone number patterns
  const patterns = [
    /^\+8801[3-9]\d{8}$/,  // +8801XXXXXXXXX (11 digits after +88)
    /^01[3-9]\d{8}$/,      // 01XXXXXXXXX (11 digits total)
    /^8801[3-9]\d{8}$/     // 8801XXXXXXXXX (13 digits total)
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
};

// Login form validation
const validateLoginForm = (formData) => {
  const errors = {};
  
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!formData.password || !formData.password.trim()) {
    errors.password = 'Password is required';
  }
  
  return errors;
};

// Registration form validation
const validateRegistrationForm = (formData) => {
  const errors = {};
  
  // Name validation
  if (!formData.fullName || !formData.fullName.trim()) {
    errors.fullName = 'Full name is required';
  } else if (formData.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  
  // Email validation
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  // Password validation
  const passwordErrors = validatePassword(formData.password);
  if (passwordErrors.length > 0) {
    errors.password = passwordErrors[0]; // Show first error
  }
  
  // Confirm password validation
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  // Phone validation
  if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!validatePhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = 'Invalid phone number format. Use Bangladesh format (e.g., +8801XXXXXXXXX)';
  }
  
  // Date of birth validation
  if (!formData.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  } else {
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (isNaN(birthDate.getTime())) {
      errors.dateOfBirth = 'Invalid date format';
    } else if (age < 13) {
      errors.dateOfBirth = 'Must be at least 13 years old';
    } else if (age > 120) {
      errors.dateOfBirth = 'Invalid birth date';
    }
  }
  
  // Role validation
  if (!formData.role) {
    errors.role = 'Role selection is required';
  } else if (!['USER', 'RESPONDER'].includes(formData.role)) {
    errors.role = 'Invalid role selected';
  }
  
  return errors;
};

// OTP validation
const validateOTP = (otp, length = 6) => {
  if (!otp || typeof otp !== 'string') return false;
  
  const cleanOtp = otp.replace(/\s/g, '');
  return cleanOtp.length === length && /^\d+$/.test(cleanOtp);
};

// Reset password validation
const validateResetPassword = (formData) => {
  const errors = {};
  
  if (!formData.token || !formData.token.trim()) {
    errors.token = 'Reset token is required';
  }
  
  const passwordErrors = validatePassword(formData.newPassword);
  if (passwordErrors.length > 0) {
    errors.newPassword = passwordErrors[0];
  }
  
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password';
  } else if (formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return errors;
};

describe('Authentication Validation Logic', () => {
  describe('validateEmail', () => {
    test('accepts valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'name+tag@company.org',
        'user123@test-domain.com',
        'a@b.co'
      ];
      
      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });
    
    test('rejects invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        null,
        undefined,
        123
      ];
      
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
    
    test('handles email with extra whitespace', () => {
      expect(validateEmail('  user@example.com  ')).toBe(true);
      expect(validateEmail('\n\ttest@domain.org\n')).toBe(true);
    });
  });
  
  describe('validatePassword', () => {
    test('accepts strong passwords', () => {
      const strongPasswords = [
        'MyPassword123',
        'SecurePass1',
        'Complex123',
        'StrongPwd9'
      ];
      
      strongPasswords.forEach(password => {
        const errors = validatePassword(password);
        expect(errors).toHaveLength(0);
      });
    });
    
    test('rejects weak passwords', () => {
      const testCases = [
        { password: '', expectedErrors: ['Password is required'] },
        { password: 'short1A', expectedErrors: ['Password must be at least 8 characters long'] },
        { password: 'nouppercase123', expectedErrors: ['Password must contain at least one uppercase letter'] },
        { password: 'NOLOWERCASE123', expectedErrors: ['Password must contain at least one lowercase letter'] },
        { password: 'NoNumbers', expectedErrors: ['Password must contain at least one number'] },
        { password: 'weak', expectedErrors: ['Password must be at least 8 characters long', 'Password must contain at least one uppercase letter', 'Password must contain at least one number'] }
      ];
      
      testCases.forEach(({ password, expectedErrors }) => {
        const errors = validatePassword(password);
        expectedErrors.forEach(expectedError => {
          expect(errors).toContain(expectedError);
        });
      });
    });
  });
  
  describe('validatePhoneNumber', () => {
    test('accepts valid Bangladesh phone numbers', () => {
      const validNumbers = [
        '+8801712345678',
        '+8801812345678',
        '+8801912345678',
        '01712345678',
        '01812345678',
        '01912345678',
        '8801712345678',
        '+880 171 234 5678',
        '01712-345-678',
        '(01712) 345678'
      ];
      
      validNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(true);
      });
    });
    
    test('rejects invalid phone numbers', () => {
      const invalidNumbers = [
        '',
        '123456789',
        '+8801012345678', // Invalid operator code
        '01012345678',    // Invalid operator code
        '+88017123456789', // Too many digits
        '+88017123456',   // Too few digits
        'not-a-number',
        null,
        undefined
      ];
      
      invalidNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(false);
      });
    });
  });
  
  describe('validateLoginForm', () => {
    test('validates successful login form', () => {
      const validForm = {
        email: 'user@example.com',
        password: 'MyPassword123'
      };
      
      const errors = validateLoginForm(validForm);
      expect(Object.keys(errors)).toHaveLength(0);
    });
    
    test('catches missing required fields', () => {
      const invalidForm = {
        email: '',
        password: ''
      };
      
      const errors = validateLoginForm(invalidForm);
      expect(errors.email).toBe('Email is required');
      expect(errors.password).toBe('Password is required');
    });
    
    test('validates email format in login form', () => {
      const invalidForm = {
        email: 'invalid-email',
        password: 'ValidPassword123'
      };
      
      const errors = validateLoginForm(invalidForm);
      expect(errors.email).toBe('Invalid email format');
      expect(errors.password).toBeUndefined();
    });
  });
  
  describe('validateRegistrationForm', () => {
    const validRegistrationData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'MyPassword123',
      confirmPassword: 'MyPassword123',
      phoneNumber: '+8801712345678',
      dateOfBirth: '1990-01-01',
      role: 'USER'
    };
    
    test('validates successful registration form', () => {
      const errors = validateRegistrationForm(validRegistrationData);
      expect(Object.keys(errors)).toHaveLength(0);
    });
    
    test('validates full name requirements', () => {
      const testCases = [
        { fullName: '', expected: 'Full name is required' },
        { fullName: 'A', expected: 'Full name must be at least 2 characters' },
        { fullName: '  ', expected: 'Full name is required' }
      ];
      
      testCases.forEach(({ fullName, expected }) => {
        const formData = { ...validRegistrationData, fullName };
        const errors = validateRegistrationForm(formData);
        expect(errors.fullName).toBe(expected);
      });
    });
    
    test('validates password confirmation', () => {
      const formData = {
        ...validRegistrationData,
        confirmPassword: 'DifferentPassword123'
      };
      
      const errors = validateRegistrationForm(formData);
      expect(errors.confirmPassword).toBe('Passwords do not match');
    });
    
    test('validates age requirements', () => {
      const testCases = [
        { dateOfBirth: '2020-01-01', expected: 'Must be at least 13 years old' },
        { dateOfBirth: '1900-01-01', expected: 'Invalid birth date' },
        { dateOfBirth: 'invalid-date', expected: 'Invalid date format' }
      ];
      
      testCases.forEach(({ dateOfBirth, expected }) => {
        const formData = { ...validRegistrationData, dateOfBirth };
        const errors = validateRegistrationForm(formData);
        expect(errors.dateOfBirth).toBe(expected);
      });
    });
    
    test('validates role selection', () => {
      const testCases = [
        { role: '', expected: 'Role selection is required' },
        { role: 'INVALID_ROLE', expected: 'Invalid role selected' }
      ];
      
      testCases.forEach(({ role, expected }) => {
        const formData = { ...validRegistrationData, role };
        const errors = validateRegistrationForm(formData);
        expect(errors.role).toBe(expected);
      });
    });
  });
  
  describe('validateOTP', () => {
    test('accepts valid OTP codes', () => {
      const validOTPs = ['123456', '000000', '999999', '123 456'];
      
      validOTPs.forEach(otp => {
        expect(validateOTP(otp)).toBe(true);
      });
    });
    
    test('rejects invalid OTP codes', () => {
      const invalidOTPs = ['12345', '1234567', 'abc123', '', '12a456', null, undefined];
      
      invalidOTPs.forEach(otp => {
        expect(validateOTP(otp)).toBe(false);
      });
    });
    
    test('supports custom OTP length', () => {
      expect(validateOTP('1234', 4)).toBe(true);
      expect(validateOTP('12345678', 8)).toBe(true);
      expect(validateOTP('123456', 4)).toBe(false);
    });
  });
  
  describe('validateResetPassword', () => {
    const validResetData = {
      token: 'valid-reset-token-123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123'
    };
    
    test('validates successful password reset', () => {
      const errors = validateResetPassword(validResetData);
      expect(Object.keys(errors)).toHaveLength(0);
    });
    
    test('requires reset token', () => {
      const formData = { ...validResetData, token: '' };
      const errors = validateResetPassword(formData);
      expect(errors.token).toBe('Reset token is required');
    });
    
    test('validates new password strength', () => {
      const formData = { ...validResetData, newPassword: 'weak' };
      const errors = validateResetPassword(formData);
      expect(errors.newPassword).toContain('Password must be at least 8 characters long');
    });
    
    test('requires password confirmation match', () => {
      const formData = { 
        ...validResetData, 
        confirmPassword: 'DifferentPassword123' 
      };
      const errors = validateResetPassword(formData);
      expect(errors.confirmPassword).toBe('Passwords do not match');
    });
  });
});
