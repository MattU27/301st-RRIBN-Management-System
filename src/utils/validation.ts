/**
 * Email validation utilities
 */

/**
 * List of allowed email domains for alternative email recovery
 */
export const ALLOWED_ALTERNATIVE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com'];

/**
 * List of allowed email domains for service ID-associated emails
 * This includes mil.ph which is only for official AFP emails
 */
export const ALLOWED_SERVICE_ID_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'mil.ph'];

/**
 * Validates if an email is properly formatted
 * @param email Email address to validate
 * @returns boolean indicating if the email is valid
 */
export const isValidEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if an email belongs to an allowed domain for alternative email recovery
 * @param email Email address to validate
 * @returns boolean indicating if the email domain is allowed
 */
export const isAllowedAlternativeEmailDomain = (email: string): boolean => {
  if (!isValidEmailFormat(email)) return false;
  
  const emailDomain = email.split('@')[1].toLowerCase();
  return ALLOWED_ALTERNATIVE_EMAIL_DOMAINS.includes(emailDomain);
};

/**
 * Validates if an email belongs to an allowed domain for service ID-associated emails
 * @param email Email address to validate
 * @returns boolean indicating if the email domain is allowed
 */
export const isAllowedServiceIdEmailDomain = (email: string): boolean => {
  if (!isValidEmailFormat(email)) return false;
  
  const emailDomain = email.split('@')[1].toLowerCase();
  return ALLOWED_SERVICE_ID_EMAIL_DOMAINS.includes(emailDomain);
};

/**
 * Extracts the domain part from an email address
 * @param email Email address
 * @returns The domain part of the email, or null if invalid
 */
export const getEmailDomain = (email: string): string | null => {
  if (!isValidEmailFormat(email)) return null;
  return email.split('@')[1].toLowerCase();
};

/**
 * Generates a helpful error message for invalid alternative email domains
 * @returns Formatted error message listing allowed domains
 */
export const getAlternativeEmailDomainsErrorMessage = (): string => {
  return `Only ${ALLOWED_ALTERNATIVE_EMAIL_DOMAINS.join(', ')} email addresses are accepted`;
};

/**
 * Generates a helpful error message for invalid service ID email domains
 * @returns Formatted error message listing allowed domains
 */
export const getServiceIdEmailDomainsErrorMessage = (): string => {
  return `Only ${ALLOWED_SERVICE_ID_EMAIL_DOMAINS.slice(0, -1).join(', ')} and ${ALLOWED_SERVICE_ID_EMAIL_DOMAINS.slice(-1)} email addresses are accepted`;
}; 