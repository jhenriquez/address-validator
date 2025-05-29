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
 * Abstraction over any AI provider for address normalization & diffing.
 */
export interface IAddressCorrector {
  /**
   * Given free-form input, returns a single normalized address string
   * (or null if no suggestion is made).
   */
  suggestCorrection(freeText: string): Promise<string | null>;

  /**
   * Given the original and corrected strings, returns a list of concrete
   * { field, from, to } corrections.
   */
  explainCorrections(
    original: string,
    corrected: string
  ): Promise<Correction[]>;
}
