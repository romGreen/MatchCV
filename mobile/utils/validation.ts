import { VALIDATION_RULES } from '../constants';

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required';
  }
  
  if (!VALIDATION_RULES.email.pattern.test(email)) {
    return VALIDATION_RULES.email.message;
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < VALIDATION_RULES.password.minLength) {
    return VALIDATION_RULES.password.message;
  }
  
  return null;
};

export const validateDisplayName = (displayName: string): string | null => {
  if (!displayName) {
    return 'Display name is required';
  }
  
  if (displayName.length < VALIDATION_RULES.displayName.minLength) {
    return 'Display name must be at least 2 characters long';
  }
  
  if (displayName.length > VALIDATION_RULES.displayName.maxLength) {
    return 'Display name must be less than 50 characters';
  }
  
  return null;
};

export const validateBio = (bio: string): string | null => {
  if (!bio) {
    return 'Bio is required';
  }
  
  if (bio.length < VALIDATION_RULES.bio.minLength) {
    return 'Bio must be at least 10 characters long';
  }
  
  if (bio.length > VALIDATION_RULES.bio.maxLength) {
    return 'Bio must be less than 200 characters';
  }
  
  return null;
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value && value.length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`;
  }
  return null;
};

export const validateArrayMinLength = (array: any[], minLength: number, fieldName: string): string | null => {
  if (!array || array.length < minLength) {
    return `Please select at least ${minLength} ${fieldName}`;
  }
  return null;
};

export const validateNumberRange = (value: number, min: number, max: number, fieldName: string): string | null => {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};
