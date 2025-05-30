/**
 * Represents a handler interface for processing a request and producing a response.
 *
 * @template TRequest The type of the request object.
 * @template TResponse The type of the response object.
 */
export interface IHandler<TRequest, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}

/**
 * Describes a single field-level correction.
 */
export interface Correction {
  /** which field was changed (street, city, zip, etc.) */
  field: keyof CorrectionTargets;
  /** original value (possibly empty) */
  from: string;
  /** new/corrected value */
  to: string;
}

/**
 * Map of all response fields—used by Correction.field
 */
export interface CorrectionTargets {
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * Result of attempting to parse & validate a free-form address.
 */
export interface AddressVerificationResult {
  isValid: boolean;
  source: string;
  formattedAddress?: string;
  address?: {
    street: string;
    number: string;
    city: string;
    state: string;
    zip: string;
  };
  errors?: string[];
}
