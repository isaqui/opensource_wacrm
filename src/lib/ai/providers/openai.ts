import type { ProviderResult } from '../types'
import { generateOpenAiCompatible } from './openai-compatible'
import type { ProviderArgs } from './shared'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * Call OpenAI's Chat Completions endpoint with the caller's own key.
 * Thin wrapper over the shared OpenAI-compatible core.
 */
export async function generateOpenAi(args: ProviderArgs): Promise<ProviderResult> {
  return generateOpenAiCompatible(args, {
    url: OPENAI_URL,
    providerLabel: 'OpenAI',
  })
}
