import {Correction} from "../types";

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
