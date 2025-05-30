import {AddressVerificationResult} from "../types";

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

  geocoderName: string;
}
