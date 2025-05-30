import {AddressVerificationResult} from "../../types";
import {IAddressVerifier} from "../IAddressVerifier";

/**
 * Concrete verifier using the U.S. Census “one-line address” geocoder.
 */
export class CensusGeocodingAddressVerifier implements IAddressVerifier {
  public readonly geocoderName = 'us-census';
  private readonly baseUrl =
    'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

  /**
   * @param freeText e.g. "456 Broadway Apt 5B, New York"
   */
  async verify(freeText: string): Promise<AddressVerificationResult> {
    const url = `${this.baseUrl}?address=${encodeURIComponent(
      freeText
    )}&benchmark=Public_AR_Current&format=json`;

    let resp;
    try {
      resp = await fetch(url);
    } catch (err) {
      const { message } = err as Error;
      return {
        isValid: false,
        source: this.geocoderName,
        errors: [message || 'Network error'] };
    }

    if (!resp.ok) {
      return {
        isValid: false,
        source: this.geocoderName,
        errors: [`HTTP ${resp.status}: ${resp.statusText}`]
      };
    }

    const payload = (await resp.json()) as {
      result?: {
        addressMatches?: Array<{
          matchedAddress: string;
          addressComponents: {
            fromAddress: string;
            streetName: string;
            city: string;
            state: string;
            zip: string;
          };
        }>;
      };
    };

    const matches = payload.result?.addressMatches;
    if (!matches || matches.length === 0) {
      return {
        isValid: false,
        source: this.geocoderName,
        errors: ['No address matches found'],
      };
    }

    const match = matches[0];
    const comp = match.addressComponents;

    return {
      isValid: true,
      source: this.geocoderName,
      formattedAddress: match.matchedAddress,
      address: {
        number: comp.fromAddress,
        street: comp.streetName,
        city: comp.city,
        state: comp.state,
        zip: comp.zip,
      },
    };
  }
}
