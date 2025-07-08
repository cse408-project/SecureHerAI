/**
 * Contact Form Validation Logic Tests
 * 
 * These tests focus on pure business logic for contact form validation
 * without any UI dependencies or React Native components
 */

// Contact validation function
const validateContact = (contact) => {
  const errors = {};
  
  // Name validation
  if (!contact.name || !contact.name.trim()) {
    errors.name = 'Name is required';
  } else if (contact.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (contact.name.trim().length > 50) {
    errors.name = 'Name must not exceed 50 characters';
  }
  
  // Phone validation
  if (!contact.phone || !contact.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!isValidPhoneNumber(contact.phone)) {
    errors.phone = 'Invalid phone number format';
  }
  
  // Email validation (optional)
  if (contact.email && contact.email.trim()) {
    if (!isValidEmail(contact.email)) {
      errors.email = 'Invalid email format';
    }
  }
  
  // Relationship validation
  if (!contact.relationship || !contact.relationship.trim()) {
    errors.relationship = 'Relationship is required';
  } else if (!isValidRelationship(contact.relationship)) {
    errors.relationship = 'Invalid relationship type';
  }
  
  return errors;
};

// Helper functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const isValidPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all spaces and special characters except +
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Bangladesh phone number patterns
  const patterns = [
    /^\+8801[3-9]\d{8}$/,  // +8801XXXXXXXXX
    /^01[3-9]\d{8}$/,      // 01XXXXXXXXX
    /^8801[3-9]\d{8}$/     // 8801XXXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
};

const isValidRelationship = (relationship) => {
  const validRelationships = [
    'Family', 'Friend', 'Colleague', 'Neighbor', 
    'Doctor', 'Lawyer', 'Teacher', 'Other'
  ];
  return validRelationships.includes(relationship);
};

// Contact list management functions
const addContactToList = (contacts, newContact) => {
  // First validate the contact
  const validationErrors = validateContact(newContact);
  if (Object.keys(validationErrors).length > 0) {
    return { success: false, errors: validationErrors };
  }
  
  const errors = {};
  
  // Check for duplicate email (only if email is provided)
  if (newContact.email && newContact.email.trim() && 
      contacts.some(contact => contact.email === newContact.email.trim())) {
    errors.email = 'Email already exists';
  }
  
  // Check for duplicate phone (normalize phone numbers for comparison)
  const normalizePhone = (phone) => {
    // Remove all formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // Normalize different formats to the same standard
    if (cleaned.startsWith('+8801')) {
      return cleaned; // +8801XXXXXXXXX
    } else if (cleaned.startsWith('8801')) {
      return '+' + cleaned; // 8801XXXXXXXXX -> +8801XXXXXXXXX
    } else if (cleaned.startsWith('01')) {
      return '+880' + cleaned; // 01XXXXXXXXX -> +8801XXXXXXXXX
    }
    
    return cleaned;
  };
  
  const normalizedNewPhone = normalizePhone(newContact.phone);
  
  if (contacts.some(contact => normalizePhone(contact.phone) === normalizedNewPhone)) {
    errors.phone = 'Phone number already exists';
  }
  
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  // Generate unique ID
  const newId = Math.max(0, ...contacts.map(c => parseInt(c.contactId) || 0)) + 1;
  const contactWithId = {
    ...newContact,
    contactId: newId.toString(),
    name: newContact.name.trim(),
    phone: newContact.phone.trim(),
    email: newContact.email ? newContact.email.trim() : '',
    relationship: newContact.relationship.trim(),
    shareLocation: !!newContact.shareLocation
  };
  
  return { 
    success: true, 
    contacts: [...contacts, contactWithId],
    newContact: contactWithId
  };
};

const updateContactInList = (contacts, contactId, updatedContact) => {
  // Validate the updated contact
  const errors = validateContact(updatedContact);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  // Check if contact exists
  const contactIndex = contacts.findIndex(c => c.contactId === contactId);
  if (contactIndex === -1) {
    return { success: false, errors: { general: 'Contact not found' } };
  }
  
  // Check for duplicate phone numbers (excluding current contact)
  const phoneExists = contacts.some((contact, index) => 
    index !== contactIndex &&
    contact.phone.replace(/[\s\-\(\)]/g, '') === 
    updatedContact.phone.replace(/[\s\-\(\)]/g, '')
  );
  
  if (phoneExists) {
    return { success: false, errors: { phone: 'Phone number already exists' } };
  }
  
  // Update the contact
  const updatedContacts = [...contacts];
  updatedContacts[contactIndex] = {
    ...updatedContacts[contactIndex],
    ...updatedContact,
    name: updatedContact.name.trim(),
    phone: updatedContact.phone.trim(),
    email: updatedContact.email ? updatedContact.email.trim() : '',
    relationship: updatedContact.relationship.trim(),
    shareLocation: !!updatedContact.shareLocation
  };
  
  return { 
    success: true, 
    contacts: updatedContacts,
    updatedContact: updatedContacts[contactIndex]
  };
};

const removeContactsFromList = (contacts, contactIds) => {
  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    return { success: false, errors: { general: 'No contacts selected for removal' } };
  }
  
  const filteredContacts = contacts.filter(contact => 
    !contactIds.includes(contact.contactId)
  );
  
  const removedCount = contacts.length - filteredContacts.length;
  
  return { 
    success: true, 
    contacts: filteredContacts,
    removedCount
  };
};

// Contact search and filtering functions
const searchContacts = (contacts, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) {
    return contacts;
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  return contacts.filter(contact => 
    contact.name.toLowerCase().includes(term) ||
    contact.phone.includes(term) ||
    contact.relationship.toLowerCase().includes(term) ||
    (contact.email && contact.email.toLowerCase().includes(term))
  );
};

const filterContactsByRelationship = (contacts, relationship) => {
  if (!relationship || relationship === 'All') {
    return contacts;
  }
  
  return contacts.filter(contact => 
    contact.relationship === relationship
  );
};

const sortContacts = (contacts, sortBy = 'name', order = 'asc') => {
  const sortedContacts = [...contacts];
  
  sortedContacts.sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'relationship':
        valueA = a.relationship.toLowerCase();
        valueB = b.relationship.toLowerCase();
        break;
      case 'phone':
        valueA = a.phone;
        valueB = b.phone;
        break;
      default:
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
    }
    
    if (valueA < valueB) return order === 'asc' ? -1 : 1;
    if (valueA > valueB) return order === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sortedContacts;
};

// Contact data transformation functions
const formatContactForDisplay = (contact) => {
  return {
    ...contact,
    displayName: contact.name.trim(),
    displayPhone: formatPhoneForDisplay(contact.phone),
    displayEmail: contact.email || 'Not provided',
    displayRelationship: contact.relationship,
    locationSharingText: contact.shareLocation ? 'Enabled' : 'Disabled'
  };
};

const formatPhoneForDisplay = (phone) => {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Format Bangladesh numbers for display
  if (cleanPhone.startsWith('+8801')) {
    const number = cleanPhone.slice(4); // Remove +880
    return `+880 ${number.slice(0, 1)} ${number.slice(1, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;
  } else if (cleanPhone.startsWith('01')) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 8)} ${cleanPhone.slice(8)}`;
  }
  
  return phone;
};

const exportContactsToCSV = (contacts) => {
  if (!contacts || contacts.length === 0) {
    return '';
  }
  
  const headers = ['Name', 'Phone', 'Email', 'Relationship', 'Location Sharing'];
  const csvRows = [headers.join(',')];
  
  contacts.forEach(contact => {
    const row = [
      `"${contact.name}"`,
      `"${contact.phone}"`,
      `"${contact.email || ''}"`,
      `"${contact.relationship}"`,
      `"${contact.shareLocation ? 'Yes' : 'No'}"`
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

describe('Contact Form Validation Logic', () => {
  describe('validateContact', () => {
    const validContact = {
      name: 'John Doe',
      phone: '+8801712345678',
      email: 'john@example.com',
      relationship: 'Friend',
      shareLocation: true
    };
    
    test('validates a complete valid contact', () => {
      const errors = validateContact(validContact);
      expect(Object.keys(errors)).toHaveLength(0);
    });
    
    test('validates required name field', () => {
      const testCases = [
        { name: '', expected: 'Name is required' },
        { name: '  ', expected: 'Name is required' },
        { name: 'A', expected: 'Name must be at least 2 characters' },
        { name: 'A'.repeat(51), expected: 'Name must not exceed 50 characters' }
      ];
      
      testCases.forEach(({ name, expected }) => {
        const contact = { ...validContact, name };
        const errors = validateContact(contact);
        expect(errors.name).toBe(expected);
      });
    });
    
    test('validates required phone field', () => {
      const testCases = [
        { phone: '', expected: 'Phone number is required' },
        { phone: '  ', expected: 'Phone number is required' },
        { phone: 'invalid-phone', expected: 'Invalid phone number format' },
        { phone: '123456789', expected: 'Invalid phone number format' }
      ];
      
      testCases.forEach(({ phone, expected }) => {
        const contact = { ...validContact, phone };
        const errors = validateContact(contact);
        expect(errors.phone).toBe(expected);
      });
    });
    
    test('validates optional email field', () => {
      // Empty email should be fine
      const contactNoEmail = { ...validContact, email: '' };
      let errors = validateContact(contactNoEmail);
      expect(errors.email).toBeUndefined();
      
      // Invalid email should show error
      const contactInvalidEmail = { ...validContact, email: 'invalid-email' };
      errors = validateContact(contactInvalidEmail);
      expect(errors.email).toBe('Invalid email format');
      
      // Valid email should be fine
      const contactValidEmail = { ...validContact, email: 'test@example.com' };
      errors = validateContact(contactValidEmail);
      expect(errors.email).toBeUndefined();
    });
    
    test('validates required relationship field', () => {
      const testCases = [
        { relationship: '', expected: 'Relationship is required' },
        { relationship: '  ', expected: 'Relationship is required' },
        { relationship: 'InvalidRelationship', expected: 'Invalid relationship type' }
      ];
      
      testCases.forEach(({ relationship, expected }) => {
        const contact = { ...validContact, relationship };
        const errors = validateContact(contact);
        expect(errors.relationship).toBe(expected);
      });
    });
  });
  
  describe('addContactToList', () => {
    const existingContacts = [
      { contactId: '1', name: 'Alice Smith', phone: '+8801712345678', relationship: 'Friend', email: '', shareLocation: false }
    ];
    
    test('successfully adds valid contact', () => {
      const newContact = {
        name: 'Bob Johnson',
        phone: '+8801812345678',
        email: 'bob@example.com',
        relationship: 'Colleague',
        shareLocation: true
      };
      
      const result = addContactToList(existingContacts, newContact);
      
      expect(result.success).toBe(true);
      expect(result.contacts).toHaveLength(2);
      expect(result.newContact.contactId).toBe('2');
      expect(result.newContact.name).toBe('Bob Johnson');
    });
    
    test('rejects contact with validation errors', () => {
      const invalidContact = {
        name: '',
        phone: 'invalid-phone',
        email: 'invalid-email',
        relationship: '',
        shareLocation: false
      };
      
      const result = addContactToList(existingContacts, invalidContact);
      
      expect(result.success).toBe(false);
      expect(result.errors.name).toBe('Name is required');
      expect(result.errors.phone).toBe('Invalid phone number format');
      expect(result.errors.email).toBe('Invalid email format');
      expect(result.errors.relationship).toBe('Relationship is required');
    });
    
    test('rejects duplicate phone number', () => {
      const duplicateContact = {
        name: 'Duplicate Person',
        phone: '+8801712345678', // Same as Alice's phone
        email: 'duplicate@example.com',
        relationship: 'Family',
        shareLocation: false
      };
      
      const result = addContactToList(existingContacts, duplicateContact);
      
      expect(result.success).toBe(false);
      expect(result.errors.phone).toBe('Phone number already exists');
    });
    
  });
  
  describe('updateContactInList', () => {
    const contacts = [
      { contactId: '1', name: 'Alice Smith', phone: '+8801712345678', relationship: 'Friend', email: '', shareLocation: false },
      { contactId: '2', name: 'Bob Johnson', phone: '+8801812345678', relationship: 'Colleague', email: 'bob@example.com', shareLocation: true }
    ];
    
    test('successfully updates existing contact', () => {
      const updatedData = {
        name: 'Alice Brown',
        phone: '+8801912345678',
        email: 'alice.brown@example.com',
        relationship: 'Family',
        shareLocation: true
      };
      
      const result = updateContactInList(contacts, '1', updatedData);
      
      expect(result.success).toBe(true);
      expect(result.updatedContact.name).toBe('Alice Brown');
      expect(result.updatedContact.phone).toBe('+8801912345678');
      expect(result.updatedContact.relationship).toBe('Family');
    });
    
    test('rejects update for non-existent contact', () => {
      const updatedData = {
        name: 'Non Existent',
        phone: '+8801912345678',
        email: '',
        relationship: 'Friend',
        shareLocation: false
      };
      
      const result = updateContactInList(contacts, '999', updatedData);
      
      expect(result.success).toBe(false);
      expect(result.errors.general).toBe('Contact not found');
    });
    
    test('rejects update with duplicate phone number', () => {
      const updatedData = {
        name: 'Alice Smith',
        phone: '+8801812345678', // Bob's phone number
        email: '',
        relationship: 'Friend',
        shareLocation: false
      };
      
      const result = updateContactInList(contacts, '1', updatedData);
      
      expect(result.success).toBe(false);
      expect(result.errors.phone).toBe('Phone number already exists');
    });
  });
  
  describe('removeContactsFromList', () => {
    const contacts = [
      { contactId: '1', name: 'Alice', phone: '+8801712345678', relationship: 'Friend', email: '', shareLocation: false },
      { contactId: '2', name: 'Bob', phone: '+8801812345678', relationship: 'Colleague', email: '', shareLocation: false },
      { contactId: '3', name: 'Charlie', phone: '+8801912345678', relationship: 'Family', email: '', shareLocation: false }
    ];
    
    test('successfully removes single contact', () => {
      const result = removeContactsFromList(contacts, ['2']);
      
      expect(result.success).toBe(true);
      expect(result.contacts).toHaveLength(2);
      expect(result.removedCount).toBe(1);
      expect(result.contacts.find(c => c.contactId === '2')).toBeUndefined();
    });
    
    test('successfully removes multiple contacts', () => {
      const result = removeContactsFromList(contacts, ['1', '3']);
      
      expect(result.success).toBe(true);
      expect(result.contacts).toHaveLength(1);
      expect(result.removedCount).toBe(2);
      expect(result.contacts[0].contactId).toBe('2');
    });
    
    test('rejects empty contact ID list', () => {
      const result = removeContactsFromList(contacts, []);
      
      expect(result.success).toBe(false);
      expect(result.errors.general).toBe('No contacts selected for removal');
    });
  });
  
  describe('searchContacts', () => {
    const contacts = [
      { contactId: '1', name: 'Alice Smith', phone: '+8801712345678', relationship: 'Friend', email: 'alice@example.com', shareLocation: false },
      { contactId: '2', name: 'Bob Johnson', phone: '+8801812345678', relationship: 'Colleague', email: 'bob@work.com', shareLocation: false },
      { contactId: '3', name: 'Charlie Brown', phone: '+8801912345678', relationship: 'Family', email: 'charlie@family.org', shareLocation: false }
    ];
    
    test('searches by name', () => {
      const result = searchContacts(contacts, 'Alice');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Smith');
    });
    
    test('searches by phone number', () => {
      const result = searchContacts(contacts, '1812345678');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob Johnson');
    });
    
    test('searches by relationship', () => {
      const result = searchContacts(contacts, 'family');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charlie Brown');
    });
    
    test('searches by email', () => {
      const result = searchContacts(contacts, 'work.com');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob Johnson');
    });
    
    test('returns all contacts for empty search', () => {
      const result = searchContacts(contacts, '');
      expect(result).toHaveLength(3);
    });
    
    test('returns empty array for no matches', () => {
      const result = searchContacts(contacts, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });
  
  describe('sortContacts', () => {
    const contacts = [
      { contactId: '1', name: 'Charlie Brown', phone: '+8801912345678', relationship: 'Family', email: '', shareLocation: false },
      { contactId: '2', name: 'Alice Smith', phone: '+8801712345678', relationship: 'Friend', email: '', shareLocation: false },
      { contactId: '3', name: 'Bob Johnson', phone: '+8801812345678', relationship: 'Colleague', email: '', shareLocation: false }
    ];
    
    test('sorts by name ascending', () => {
      const result = sortContacts(contacts, 'name', 'asc');
      expect(result[0].name).toBe('Alice Smith');
      expect(result[1].name).toBe('Bob Johnson');
      expect(result[2].name).toBe('Charlie Brown');
    });
    
    test('sorts by name descending', () => {
      const result = sortContacts(contacts, 'name', 'desc');
      expect(result[0].name).toBe('Charlie Brown');
      expect(result[1].name).toBe('Bob Johnson');
      expect(result[2].name).toBe('Alice Smith');
    });
    
    test('sorts by relationship', () => {
      const result = sortContacts(contacts, 'relationship', 'asc');
      expect(result[0].relationship).toBe('Colleague');
      expect(result[1].relationship).toBe('Family');
      expect(result[2].relationship).toBe('Friend');
    });
  });
  
  describe('formatPhoneForDisplay', () => {
    test('formats Bangladesh phone numbers correctly', () => {
      const testCases = [
        { input: '+8801712345678', expected: '+880 1 712 345 678' },
        { input: '01812345678', expected: '018 123 45 678' },
        { input: '', expected: '' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(formatPhoneForDisplay(input)).toBe(expected);
      });
    });
  });
  
  describe('exportContactsToCSV', () => {
    const contacts = [
      { name: 'Alice Smith', phone: '+8801712345678', email: 'alice@example.com', relationship: 'Friend', shareLocation: true },
      { name: 'Bob Johnson', phone: '+8801812345678', email: '', relationship: 'Colleague', shareLocation: false }
    ];
    
    test('exports contacts to CSV format', () => {
      const csv = exportContactsToCSV(contacts);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('Name,Phone,Email,Relationship,Location Sharing');
      expect(lines[1]).toBe('"Alice Smith","+8801712345678","alice@example.com","Friend","Yes"');
      expect(lines[2]).toBe('"Bob Johnson","+8801812345678","","Colleague","No"');
    });
    
    test('returns empty string for empty contacts array', () => {
      expect(exportContactsToCSV([])).toBe('');
      expect(exportContactsToCSV(null)).toBe('');
    });
  });
});
