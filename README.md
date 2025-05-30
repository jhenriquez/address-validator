# Address Parser

An API to validate and standardize free-form US property addresses.  
Built as a TypeScript pnpm monorepo with an Express HTTP service and pluggable AI- and API-driven adapters.

---

## Repository

```bash
git clone https://github.com/jhenriquez/address-parser.git
```

## Overview

#### 1. Single Responsibility

- Split core logic (packages/core) from the HTTP layer (apps/api).

- Define IAddressCorrector and IAddressVerifier interfaces so you can swap AI or third-party services without touching business logic.

#### 2. AI-First Correction + API Verification

- First, call an AI corrector (e.g. HuggingFace/OpenAI) to suggest a cleaned address.

- Then call Google Geocoding to parse and verify—falling back gracefully on errors or empty results.

#### 3. Error-Resilient & Observable

- Structured JSON logging via a minimal ILogger abstraction.

- Input validation with Zod and centralized error handling middleware.

- Statuses: valid, corrected, unverifiable drive clear API responses.

#### 4. Trade-Offs

- Pros: Modular adapters, clear separation of concerns, rapid AI-powered corrections.

- Cons: External API latency (AI + Google calls in series), cost of AI tokens and Google requests, US-only scope.

## Tools & Libraries

- **Language & Runtime:** TypeScript, Node.js

- **Package Manager:** pnpm workspaces

- **Server:** Express.js

- **Validation:** Zod

- **AI Adapter:** HFAddressCorrector (uses HuggingFace/Novita/Deepseek)

- **Geo Adapter:** Defaults to GoogleGeocodingAddressVerifier (requires GOOGLE_GEOCODING_API_KEY), US Census implementation also available.

- **Logging:** Custom ILogger (JSON logs) - Winston is the default implementation

- **Testing:** jest and supertest

## AI Usage

This project uses AI language models to improve address processing through two key functions:

### 1. Address Correction

The implementation uses a large language model (LLM) through the Hugging Face API to normalize and standardize free-form addresses. The `HFAddressCorrector` class implements the `IAddressCorrector` interface and makes API calls to models like Deepseek to suggest corrections.

### 2. Correction Explanation

After addresses are corrected, the system uses a second AI prompt to explain exactly what changed between the original and corrected versions, providing field-level explanations of corrections.


### AI Prompts

The system uses two carefully engineered prompts:

#### Address Suggestion Prompt

```text
You are an address parser and standardization engine. Your job is to receive a raw, free-form address and return a single-line, standardized and well-formed version of that address. Ensure correct punctuation, spacing, and casing. If any information is missing, do not hallucinate—just omit it. Return only the corrected address string with no extra text.
```

#### Correction Explanation Prompt

```text
You are an address correction explainer. You receive two inputs:

1. A raw, unstructured or partially incorrect address (rawInput)
2. A cleaned, corrected, or verified version (verifiedInput)

Your task is to return a JSON array of field-level corrections needed to go from the rawInput to the verifiedInput. Use the following format:

interface CorrectionTargets {
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
}

interface Correction {
  field: keyof CorrectionTargets;
  from: string;
  to: string;
}

Only return fields where a meaningful correction was made. Ignore casing changes. Don't include unchanged fields. If a field was added or inferred (like a ZIP code), leave `from` as an empty string.

Your response must be valid JSON and contain no explanation or extra text—just the array. Do not wrap the output in code blocks or markdown. Return plain JSON only.
```

The AI model and API configuration is controlled through environment variables, making it easy to switch between different providers or models as needed. By default, the implementation uses the Deepseek model via Hugging Face's API infrastructure.

## Getting Started

### Clone & Install

```bash
git clone https://github.com/jhenriquez/address-parser.git
```

```bash
cd address-parser
```

```bash
pnpm install
```

### Environment
Create a .env at the repo root with:

```text
CORRECTION_API_URL=https://router.huggingface.co/novita/v3/openai/chat/completions
CORRECTION_API_TOKEN=<huggingface-token>
CORRECTION_API_MODEL=deepseek/deepseek-v3-0324
CORRECTION_SUGGEST_PROMPT="You are an address parser and standardization engine. Your job is to receive a raw, free-form address and return a single-line, standardized and well-formed version of that address. Ensure correct punctuation, spacing, and casing. If any information is missing, do not hallucinate—just omit it. Return only the corrected address string with no extra text."
CORRECTION_EXPLAIN_PROMPT="You are an address correction explainer. You receive two inputs:\n\n1. A raw, unstructured or partially incorrect address (rawInput)\n2. A cleaned, corrected, or verified version (verifiedInput)\n\nYour task is to return a JSON array of field-level corrections needed to go from the rawInput to the verifiedInput. Use the following format:\n\ninterface CorrectionTargets {\n  street: string;\n  number: string;\n  city: string;\n  state: string;\n  zip: string;\n}\n\ninterface Correction {\n  field: keyof CorrectionTargets;\n  from: string;\n  to: string;\n}\n\nOnly return fields where a meaningful correction was made. Ignore casing changes. Don't include unchanged fields. If a field was added or inferred (like a ZIP code), leave `from` as an empty string.\n\nYour response must be valid JSON and contain no explanation or extra text—just the array. Do not wrap the output in code blocks or markdown. Return plain JSON only."
GOOGLE_GEOCODING_API_KEY=<google-api-key>
```

#### huggingface

Follow these [instructions](https://huggingface.co/docs/huggingface_hub/en/quick-start#authentication) to setup hugginface authentication. Make sure the token has the "Make calls to inference providers" permission.

#### Google Cloud Services

Requires a valid Google Cloud token with permissions for the Google Geocoding API.

### Run in Development

```bash
pnpm api:dev
```

The API will be available at http://localhost:3000/api/v1/address/validate.

###  Build & Test

Both the `build` and `test` scripts can be run from the root folder.

```
pnpm build
pnpm test
```

## Example Request & Response
### Request

```text
POST /api/v1/address/validate
Content-Type: application/json

{ "address": "1600 Amphitheatre Pkwy, Mountain View, CA" }
```

### Response

```json
{
    "input": "1600 Amphitheatre Pkwy, Mountain View, CA",
    "correctedInput": "1600 Amphitheatre Parkway, Mountain View, CA 94043",
    "formattedAddress": "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
    "address": {
        "street": "Amphitheatre Parkway",
        "number": "1600",
        "city": "Mountain View",
        "state": "CA",
        "zip": "94043"
    },
    "status": "corrected",
    "errors": []
}
```

## Further Improvements
Batch Processing: Accept multiple addresses in one request.

Caching: Memoize Google API results to reduce cost and latency.

Rate-Limiting & Retry Logic: Harden against third-party throttling.

International Support: Swap adapters for non-US geocoding services.

----- 
Thank you for reviewing! Feel free to raise issues or PRs in the repository.
