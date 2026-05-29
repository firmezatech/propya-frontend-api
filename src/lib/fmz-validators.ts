const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidFmzEmail = (email: string): boolean => EMAIL_PATTERN.test(email.trim());
