import axios, { AxiosError, AxiosResponse } from 'axios';
import { IAddressVerifier } from '../IAddressVerifier';
import { AddressVerificationResult } from '../../types';

/**
 * Types for the Google Geocoding API JSON response
 */
interface GoogleGeocodingResponse {
  results: GoogleGeocodingResult[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | string;
  error_message?: string;
}

interface GoogleGeocodingResult {
  address_components: AddressComponent[];
  formatted_address: string;
  // we can add more fields here if needed (geometry, place_id, etc)
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

/**
 * Adapter for Google Geocoding API
 */
export class GoogleGeocodingAddressVerifier implements IAddressVerifier {
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  private readonly apiKey: string;
  public readonly geocoderName = 'google';

  constructor(apiKey: string = process.env.GOOGLE_GEOCODING_API_KEY!) {
    this.apiKey = apiKey;
  }

  public async verify(freeText: string): Promise<AddressVerificationResult> {
    if (!this.apiKey) {
      throw new Error('Missing required env var: GOOGLE_GEOCODING_API_KEY');
    }

    const params = {
      address: freeText,
      key: this.apiKey,
    };

    let resp: AxiosResponse<GoogleGeocodingResponse>;
    try {
      resp = await axios.get<GoogleGeocodingResponse>(this.baseUrl, { params });
    } catch (err) {
      const ae = err as AxiosError;
      if (ae.response) {
        return {
          isValid: false,
          source: this.geocoderName,
          errors: [`HTTP ${ae.response.status}: ${ae.response.statusText}`],
        };
      }
      return {
        isValid: false,
        source: this.geocoderName,
        errors: [ae.message],
      };
    }

    const { data } = resp;

    if (data.status !== 'OK' || data.results.length === 0) {
      const msg =
        data.status === 'ZERO_RESULTS'
          ? 'No address matches found'
          : data.error_message || data.status;
      return {
        isValid: false,
        source: this.geocoderName,
        errors: [msg],
      };
    }

    const match = data.results[0];
    const components = match.address_components;

    const getComp = (type: string): string =>
      components.find((c) => c.types.includes(type))?.long_name || '';

    return {
      isValid: true,
      source: this.geocoderName,
      formattedAddress: match.formatted_address,
      address: {
        number: getComp('street_number'),
        street: getComp('route'),
        city:
          getComp('locality') ||
          getComp('sublocality') ||
          getComp('administrative_area_level_2'),
        state: getComp('administrative_area_level_1'),
        zip: getComp('postal_code'),
      },
    };
  }
}
