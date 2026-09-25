import type { ProviderResult } from '../types'
import { generateOpenAiCompatible } from './openai-compatible'
import type { ProviderArgs } from './shared'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * Call OpenRouter's Chat Completions endpoint with the caller's own key.
 * OpenRouter is OpenAI-compatible and fans one key out to models from
 * many vendors (`openai/*`, `anthropic/*`, `google/*`, `meta-llama/*`,
 * ...), so it reuses the shared adapter — only the base URL and the
 * optional ranking headers differ.
 *
 * `HTTP-Referer` / `X-Title` are optional attribution headers OpenRouter
 * uses for its public app-ranking pages. We send `X-Title` always and
 * `HTTP-Referer` when the deployment's canonical URL is known; neither
 * affects auth or model access.
 */
export async function generateOpenRouter(
  args: ProviderArgs,
): Promise<ProviderResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const extraHeaders: Record<string, string> = { 'X-Title': 'wacrm' }
  if (siteUrl) extraHeaders['HTTP-Referer'] = siteUrl

  return generateOpenAiCompatible(args, {
    url: OPENROUTER_URL,
    providerLabel: 'OpenRouter',
    extraHeaders,
  })
}
