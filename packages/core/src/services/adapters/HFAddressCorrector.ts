import axios from 'axios';
import { Correction } from '../../types';
import { IAddressCorrector } from '../';

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
  system_fingerprint: string;
}

interface Choice {
  index: number;
  message: Message;
  finish_reason: string;
  content_filter_results: ContentFilterResults;
}

interface Message {
  role: string;
  content: string;
}

interface ContentFilterResults {
  hate: FilterResult;
  self_harm: FilterResult;
  sexual: FilterResult;
  violence: FilterResult;
  jailbreak: FilterResult;
  profanity: FilterResult;
}

interface FilterResult {
  filtered: boolean;
  detected?: boolean;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details: PromptTokensDetails;
  completion_tokens_details: CompletionTokensDetails;
}

interface PromptTokensDetails {
  audio_tokens: number;
  cached_tokens: number;
}

interface CompletionTokensDetails {
  audio_tokens: number;
  reasoning_tokens: number;
}

export class HFAddressCorrector implements IAddressCorrector {
  private readonly apiUrl: string;
  private readonly apiToken: string;
  private readonly model: string;
  private readonly suggestPrompt: string;
  private readonly explainPrompt: string;

  constructor() {
    this.apiUrl = process.env.CORRECTION_API_URL!;
    this.apiToken = process.env.CORRECTION_API_TOKEN!;
    this.model = process.env.HF_CORRECTION_API_MODEL!;
    this.suggestPrompt = process.env.CORRECTION_SUGGEST_PROMPT!;
    this.explainPrompt = process.env.CORRECTION_EXPLAIN_PROMPT!;

    if (
      !this.apiUrl ||
      !this.apiToken ||
      !this.model ||
      !this.suggestPrompt ||
      !this.explainPrompt
    ) {
      throw new Error(
        'Missing one of the required CORRECTION_API_* environment variables'
      );
    }
  }

  public async suggestCorrection(
    freeText: string
  ): Promise<string | null> {
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: this.suggestPrompt },
        { role: 'user', content: `Raw input: ${freeText}` },
      ],
      stream: false,
    };

    const res = await axios.post<ChatCompletionResponse>(
      this.apiUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
      }
    );

    if (res.status < 200 || res.status >= 300) {
      throw new Error(
        `suggestCorrection error: ${res.status} ${res.statusText}`
      );
    }

    const responseBody = res.data as ChatCompletionResponse;
    const content: string =
      responseBody.choices?.[0]?.message?.content ?? '';
    const trimmed = content.trim();
    return trimmed === '' ? null : trimmed;
  }

  public async explainCorrections(
    original: string,
    corrected: string
  ): Promise<Correction[]> {
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: this.explainPrompt },
        {
          role: 'user',
          content: `rawInput: ${original}\nverifiedInput: ${corrected}`,
        },
      ],
      stream: false,
    };

    const res = await axios.post<ChatCompletionResponse>(
      this.apiUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
      }
    );

    if (res.status < 200 || res.status >= 300) {
      throw new Error(
        `explainCorrections error: ${res.status} ${res.statusText}`
      );
    }

    const responseBody = res.data as ChatCompletionResponse;
    let content: string =
      responseBody.choices?.[0]?.message?.content ?? '';

    content = content
      .replace(/```json\s*/i, '')
      .replace(/```/g, '')
      .trim();

    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error(`Invalid JSON array response: ${content}`);
    }
    const jsonArray = content.slice(firstBracket, lastBracket + 1);

    try {
      return JSON.parse(jsonArray) as Correction[];
    } catch (err) {
      throw new Error(
        `Failed to parse corrections JSON: ${(err as Error).message}\nRaw: ${jsonArray}`
      );
    }
  }
}
