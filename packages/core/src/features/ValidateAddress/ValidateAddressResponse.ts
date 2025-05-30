/**
 * Possible validation outcomes.
 */
export type ValidationStatus = 'valid' | 'corrected' | 'unverifiable';

export interface Address {
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * Structured result of address validation.
 */
export interface ValidateAddressResponse {
  input: string;
  correctedInput?: string;
  formattedAddress?: string;
  address: Address;
  status: ValidationStatus;
  geocoder?: string;
  errors?: string[];
}
