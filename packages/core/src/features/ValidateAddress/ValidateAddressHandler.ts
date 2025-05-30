import { IHandler, AddressVerificationResult, Correction } from "../../types";
import { ValidateAddressResponse, ValidationStatus, ValidateAddressRequest } from "./";
import {
  ILogger,
  IAddressVerifier,
  IAddressCorrector, LoggerFactory,
} from "../../services";
import {HFAddressCorrector} from "../../services/adapters/HFAddressCorrector";
import {GoogleGeocodingAddressVerifier} from "../../services/adapters/GoogleGeocodingAddressVerifier";

export class ValidateAddressHandler
  implements IHandler<ValidateAddressRequest, ValidateAddressResponse> {
  constructor(
    private readonly corrector: IAddressCorrector = new HFAddressCorrector(),
    private readonly verifier: IAddressVerifier = new GoogleGeocodingAddressVerifier(),
    private readonly logger: ILogger = LoggerFactory.create(),
  ) {}

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

    let verificationResult: AddressVerificationResult;
    try {
      verificationResult = await this.verifier.verify(toVerify);
    } catch (err) {
      this.logger.error("ValidateAddressHandler: verification failed", {
        stage: "verification",
        error: err,
      });
      return this.buildUnverifiableResponse(
        input,
        ["Verification service error"],
        toVerify,
      );
    }

    if (!verificationResult.isValid || !verificationResult.address) {
      this.logger.warn("ValidateAddressHandler: address unverifiable", {
        stage: "verification",
        errors: verificationResult.errors,
      });
      return this.buildUnverifiableResponse(
        input,
        verificationResult.errors ?? [],
        toVerify,
      );
    }

    const { address, formattedAddress } = verificationResult;

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
        correctedInput: toVerify,
        address,
        status: 'valid',
      };
    }

    const status: ValidationStatus =
      corrections?.length > 0 ? "corrected" : "valid";

    return {
      input,
      formattedAddress,
      correctedInput: toVerify,
      address,
      status,
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
}
