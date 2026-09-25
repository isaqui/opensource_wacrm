-- ============================================================
-- 043_ai_openrouter_provider
--
-- Adds OpenRouter (https://openrouter.ai) as a third AI provider
-- alongside OpenAI and Anthropic. OpenRouter exposes an
-- OpenAI-compatible Chat Completions endpoint, so it reuses the OpenAI
-- request/response adapter — the only schema change is widening the
-- `provider` CHECK constraint to accept the new value.
--
-- Migration 029 declared the constraint inline, so Postgres named it
-- `ai_configs_provider_check`. Drop-if-exists then re-add keeps this
-- idempotent and safe to re-run.
--
-- No data backfill: existing rows keep their 'openai' / 'anthropic'
-- values, which remain valid under the widened constraint.
-- ============================================================

ALTER TABLE ai_configs DROP CONSTRAINT IF EXISTS ai_configs_provider_check;

ALTER TABLE ai_configs
  ADD CONSTRAINT ai_configs_provider_check
  CHECK (provider IN ('openai', 'anthropic', 'openrouter'));
