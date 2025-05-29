/**
 * Possible validation outcomes.
 */
export type ValidationStatus = 'valid' | 'corrected' | 'unverifiable';

/**
 * Structured result of address validation.
 */
export interface ValidateAddressResponse {
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
  status: ValidationStatus;
  /** present when unverifiable or partially validated */
  errors?: string[];
}
