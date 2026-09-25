import { AiError, type ProviderResult } from '../types'
import { MAX_OUTPUT_TOKENS } from '../defaults'
import {
  mergeConsecutive,
  normalizeUsage,
  providerHttpError,
  toNetworkError,
  type ProviderArgs,
} from './shared'

// ============================================================
// Shared core for every provider that speaks OpenAI's Chat
// Completions wire format: OpenAI itself and OpenRouter (which proxies
// hundreds of models behind the same request/response shape). The only
// per-provider differences are the base URL, the label used in error
// messages, and a couple of optional headers — everything else (auth
// header, body shape, usage normalization, empty-response guard) is
// identical, so it lives here once.
// ============================================================

interface OpenAiCompatibleResponse {
  choices?: { message?: { content?: string } }[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface OpenAiCompatibleOptions {
  /** Full Chat Completions URL, e.g. https://api.openai.com/v1/chat/completions */
  url: string
  /** Human-readable provider name for error messages ("OpenAI", "OpenRouter"). */
  providerLabel: string
  /** Extra request headers (OpenRouter uses HTTP-Referer / X-Title). */
  extraHeaders?: Record<string, string>
}

/**
 * Call an OpenAI-compatible Chat Completions endpoint with the caller's
 * own key. Returns the raw assistant text + token usage (handoff parsing
 * happens in `generateReply`). Throws a typed `AiError` on network,
 * timeout, auth, rate-limit, or empty-response failures.
 */
export async function generateOpenAiCompatible(
  args: ProviderArgs,
  opts: OpenAiCompatibleOptions,
): Promise<ProviderResult> {
  const { apiKey, model, systemPrompt, messages, timeoutMs } = args
  const { url, providerLabel, extraHeaders } = opts

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...mergeConsecutive(messages),
        ],
        max_completion_tokens: MAX_OUTPUT_TOKENS,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    throw toNetworkError(err)
  }

  if (!res.ok) {
    throw await providerHttpError(providerLabel, res)
  }

  const data = (await res
    .json()
    .catch(() => null)) as OpenAiCompatibleResponse | null
  const text = data?.choices?.[0]?.message?.content
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new AiError(`${providerLabel} returned an empty response.`, {
      code: 'empty_response',
    })
  }
  const usage = normalizeUsage({
    prompt: data?.usage?.prompt_tokens,
    completion: data?.usage?.completion_tokens,
    total: data?.usage?.total_tokens,
  })
  return { text, usage }
}
