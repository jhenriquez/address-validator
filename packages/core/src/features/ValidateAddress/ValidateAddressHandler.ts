import { IHandler, AddressVerificationResult, Correction } from "../../types";
import { ValidateAddressResponse, ValidationStatus, ValidateAddressRequest } from "./";
import {
  ILogger,
  IAddressVerifier,
  IAddressCorrector, LoggerFactory,
} from "../../services";
import {HFAddressCorrector} from "../../services/adapters/HFAddressCorrector";
import {GoogleGeocodingAddressVerifier} from "../../services/adapters/GoogleGeocodingAddressVerifier";
import {CensusGeocodingAddressVerifier} from "../../services/adapters/CensusGeocodingAddressVerifier";

export class ValidateAddressHandler
  implements IHandler<ValidateAddressRequest, ValidateAddressResponse> {
  constructor(
    private readonly corrector: IAddressCorrector = new HFAddressCorrector(),
    private readonly verifiers: IAddressVerifier[] = [new CensusGeocodingAddressVerifier(), new GoogleGeocodingAddressVerifier()],
    private readonly logger: ILogger = LoggerFactory.create(),
  ) {
  }

  public async handle(
    request: ValidateAddressRequest
  ): Promise<ValidateAddressResponse> {
    const input = request.freeTextAddress?.trim();

    this.logger.info("ValidateAddressHandler: input-validation", {
      stage: "input-validation",
      input,
    });
    if (!input) {
      this.logger.warn("ValidateAddressHandler: no input provided", {
        stage: "input-validation",
      });
      return this.buildUnverifiableResponse(
        input,
        ['No address provided']
      );
    }

    this.logger.info("ValidateAddressHandler: ai-suggestion", {
      stage: "ai-suggestion",
    });

    let toVerify = input;

    try {
      const suggestion = await this.corrector.suggestCorrection(input);
      if (suggestion) {
        this.logger.info("ValidateAddressHandler: suggestion received", {
          stage: "ai-suggestion",
          suggestion,
        });
        toVerify = suggestion;
      } else {
        this.logger.info("ValidateAddressHandler: no suggestion returned", {
          stage: "ai-suggestion",
        });
      }
    } catch (err) {
      this.logger.error("ValidateAddressHandler: ai-suggestion failed", {
        stage: "ai-suggestion",
        error: err,
      });
    }

    this.logger.info("ValidateAddressHandler: verification", {
      stage: "verification",
      addressToVerify: toVerify,
    });

    let verificationResult: AddressVerificationResult | null = null;
    let verificationErrors: string[] = [];

    for (const verifier of this.verifiers) {
      try {
        const result = await verifier.verify(toVerify);

        if (result.isValid && result.address) {
          verificationResult = result;
          break;
        } else {
          if (result.errors?.length) {
            verificationErrors = [...verificationErrors, ...result.errors.map((err) => this.tagErrorWithSource(err, result.source))];
          }
        }
      } catch (err) {
        const { message } = err as Error;
        verificationErrors = [...verificationErrors, this.tagErrorWithSource(message, verifier.geocoderName)];
        this.logger.error("ValidateAddressHandler: verification attempt failed", {
          stage: "verification",
          error: err,
        });
      }
    }

    if (!verificationResult || !verificationResult.isValid || !verificationResult.address) {
      this.logger.warn("ValidateAddressHandler: address unverifiable by any verifier", {
        stage: "verification",
        errors: verificationErrors,
      });
      return this.buildUnverifiableResponse(
        input,
        [
          ...(verificationErrors.length ? verificationErrors : []),
          "Address could not be verified by any service",
        ],
        toVerify,
      );
    }

    const {address, formattedAddress, source} = verificationResult;

    this.logger.info("ValidateAddressHandler: explain-corrections", {
      stage: "explain-corrections",
    });

    let corrections: Correction[] = [];

    try {
      corrections = await this.corrector.explainCorrections(input, toVerify);
      this.logger.info("ValidateAddressHandler: corrections determined", {
        stage: "explain-corrections",
        corrections,
      });
    } catch (err) {
      this.logger.error("ValidateAddressHandler: explain-corrections failed", {
        stage: "explain-corrections",
        error: err,
      });

      return {
        input,
        formattedAddress,
        geocoder: source,
        correctedInput: toVerify,
        address,
        status: 'valid',
        errors: [
          ...(verificationErrors.length ? verificationErrors : []),
          "Failed trying to explain corrections"
        ]
      };
    }

    const status: ValidationStatus =
      corrections?.length > 0 ? "corrected" : "valid";

    return {
      input,
      formattedAddress,
      geocoder: source,
      correctedInput: toVerify,
      address,
      status,
      errors: [
        ...(verificationErrors.length ? verificationErrors : []),
      ]
    };
  }

  private buildUnverifiableResponse(
    input: string,
    errors: string[] = [],
    correctedInput: string = '',
  ): ValidateAddressResponse {
    return {
      input,
      correctedInput,
      errors,
      status: "unverifiable" as ValidationStatus,
      address: {
        street: "",
        number: "",
        city: "",
        state: "",
        zip: "",
      },
    };
  }

  private tagErrorWithSource(error: string, source: string): string {
    return `${source}: ${error}`;
  }
}
