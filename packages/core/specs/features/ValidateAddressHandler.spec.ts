import {
  ValidateAddressHandler,
  ValidateAddressRequest,
  ValidationStatus,
  ILogger,
  IAddressVerifier,
  AddressVerificationResult,
  IAddressCorrector,
  Correction
} from '../../src';

describe('ValidateAddressHandler', () => {
  const mockVerifier: jest.Mocked<IAddressVerifier> = {
    verify: jest.fn(),
  };
  const mockCorrector: jest.Mocked<IAddressCorrector> = {
    suggestCorrection: jest.fn(),
    explainCorrections: jest.fn(),
  };
  const mockLogger: jest.Mocked<ILogger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  let handler: ValidateAddressHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new ValidateAddressHandler(mockCorrector, [mockVerifier], mockLogger);
  });

  it('resolves to unverifiable if input is not provided', async () => {
    const resp = await handler.handle(new ValidateAddressRequest(''));
    expect(resp.status).toBe<ValidationStatus>('unverifiable');
    expect(resp.errors).toEqual(['No address provided']);
    expect(mockVerifier.verify).not.toHaveBeenCalled();
    expect(mockCorrector.suggestCorrection).not.toHaveBeenCalled();
    expect(mockCorrector.explainCorrections).not.toHaveBeenCalled();
  });

  it('calls verify with the original input when suggestCorrection throws', async () => {
    const input = '123 Main St';
    mockCorrector.suggestCorrection.mockRejectedValue(new Error('AI service down'));

    const fakeAddress = {
      street: 'Main St',
      number: '123',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
    };

    mockVerifier.verify.mockResolvedValue({
      isValid: true,
      address: fakeAddress,
    } as AddressVerificationResult);


    mockCorrector.explainCorrections.mockResolvedValue([] as Correction[]);

    const resp = await handler.handle(new ValidateAddressRequest(input));

    expect(mockCorrector.suggestCorrection).toHaveBeenCalledWith(input);
    expect(mockVerifier.verify).toHaveBeenCalledWith(input);
    expect(resp.status).toBe<ValidationStatus>('valid');
    expect(resp.address).toMatchObject(fakeAddress);
  });

  it('calls verify with the corrected input when suggestCorrection returns a suggestion', async () => {
    const input = '456 Elm St';
    const suggestion = '456 Elm Street, Metropolis, NY 10001';

    mockCorrector.suggestCorrection.mockResolvedValue(suggestion);

    const fakeAddress = {
      street: 'Elm Street',
      number: '456',
      city: 'Metropolis',
      state: 'NY',
      zip: '10001',
    };

    mockVerifier.verify.mockResolvedValue({
      isValid: true,
      address: fakeAddress,
    } as AddressVerificationResult);

    mockCorrector.explainCorrections.mockResolvedValue([] as Correction[]);

    const resp = await handler.handle(new ValidateAddressRequest(input));

    expect(mockCorrector.suggestCorrection).toHaveBeenCalledWith(input);
    expect(mockVerifier.verify).toHaveBeenCalledWith(suggestion);
    expect(resp.status).toBe<ValidationStatus>('valid');
    expect(resp.address).toMatchObject(fakeAddress);
  });

  it('calls explainCorrections with original input and corrected suggestion', async () => {
    const input = '101 Pine Rd';
    const suggestion = '101 Pine Road, Gotham, NJ 07001';

    mockCorrector.suggestCorrection.mockResolvedValue(suggestion);

    const fakeAddress = {
      street: 'Pine Road',
      number: '101',
      city: 'Gotham',
      state: 'NJ',
      zip: '07001',
    };
    mockVerifier.verify.mockResolvedValue({
      isValid: true,
      address: fakeAddress,
    } as AddressVerificationResult);

    mockCorrector.explainCorrections.mockResolvedValue([] as Correction[]);

    await handler.handle(new ValidateAddressRequest(input));

    expect(mockCorrector.explainCorrections)
      .toHaveBeenCalledWith(input, suggestion);
  });

  it('resolves to "corrected" when explainCorrections returns non-empty list', async () => {
    const input = '202 Birch Ln';
    const suggestion = '202 Birch Lane, Star City, CA 90001';

    mockCorrector.suggestCorrection.mockResolvedValue(suggestion);

    const fakeAddress = {
      street: 'Birch Lane',
      number: '202',
      city: 'Star City',
      state: 'CA',
      zip: '90001',
    };
    mockVerifier.verify.mockResolvedValue({
      isValid: true,
      address: fakeAddress,
    } as AddressVerificationResult);

    const corrections: Correction[] = [
      {field: 'street', from: 'Birch Ln', to: 'Birch Lane'}
    ];
    mockCorrector.explainCorrections.mockResolvedValue(corrections);

    const resp = await handler.handle(new ValidateAddressRequest(input));

    expect(resp.status).toBe<ValidationStatus>('corrected');
    expect(resp.address).toMatchObject(fakeAddress);
  });

  async function assertVerifierExpectations(secondMockVerifier: jest.Mocked<IAddressVerifier>, fakeAddress: {
    street: string;
    number: string;
    city: string;
    state: string;
    zip: string
  }, input: string) {
    secondMockVerifier.verify.mockResolvedValue({
      isValid: true,
      address: fakeAddress,
    } as AddressVerificationResult);

    mockCorrector.suggestCorrection.mockResolvedValue(input);
    mockCorrector.explainCorrections.mockResolvedValue([] as Correction[]);

    const resp = await handler.handle(new ValidateAddressRequest(input));

    expect(mockVerifier.verify).toHaveBeenCalledWith(input);
    expect(secondMockVerifier.verify).toHaveBeenCalledWith(input);
    expect(resp.status).toBe<ValidationStatus>('valid');
    expect(resp.address).toMatchObject(fakeAddress);
  }

  it('calls the second verifier if the first one rejects', async () => {
    const input = '123 Main St';
    const secondMockVerifier: jest.Mocked<IAddressVerifier> = {
      verify: jest.fn(),
    };

    handler = new ValidateAddressHandler(
      mockCorrector,
      [mockVerifier, secondMockVerifier],
      mockLogger
    );


    mockVerifier.verify.mockRejectedValue(new Error('Verification service down'));


    const fakeAddress = {
      street: 'Main St',
      number: '123',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
    };

    await assertVerifierExpectations(secondMockVerifier, fakeAddress, input);
  });

  it('calls the second verifier if the first one returns unverifiable or invalid', async () => {
    const input = '999 Invalid St';
    const secondMockVerifier: jest.Mocked<IAddressVerifier> = {
      verify: jest.fn(),
    };

    handler = new ValidateAddressHandler(
      mockCorrector,
      [mockVerifier, secondMockVerifier],
      mockLogger
    );

    mockVerifier.verify.mockResolvedValue({
      isValid: false,
      errors: ['Address not found'],
    } as AddressVerificationResult);

    const fakeAddress = {
      street: 'Valid Street',
      number: '999',
      city: 'Validtown',
      state: 'VS',
      zip: '12345',
    };

    await assertVerifierExpectations(secondMockVerifier, fakeAddress, input);
  });
});
