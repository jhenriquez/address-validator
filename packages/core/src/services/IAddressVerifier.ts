/**
 * Result of attempting to parse & validate a free-form address.
 */
export interface AddressVerificationResult {
  /** true if the service found a valid, structured address */
  isValid: boolean;
  /** when isValid, the normalized components */
  address?: {
    street: string;
    number: string;
    city: string;
    state: string;
    zip: string;
  };
  /** when !isValid, human-readable error messages or failures */
  errors?: string[];
}

/**
 * Abstraction over any external address-validation service.
 */
export interface IAddressVerifier {
  /**
   * Parses and validates a free-form address.
   * @param freeText user-supplied address string
   * @returns a result indicating success, parsed parts, or errors
   */
  verify(freeText: string): Promise<AddressVerificationResult>;
}
