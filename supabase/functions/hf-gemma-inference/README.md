# hf-gemma-inference

Supabase Edge Function that proxies requests to Hugging Face hosted Gemma models.

## Required Supabase secrets

Set these before deploying:

- `HF_API_KEY` - Hugging Face access token
- `HF_GEMMA_MODEL_ID` - Optional default model id (example: `google/gemma-3-27b-it`)

## Deploy

```bash
supabase functions deploy hf-gemma-inference
```

## Invoke from app

The frontend calls this function through `supabase.functions.invoke('hf-gemma-inference')`.

Expected request body shape:

```json
{
  "prompt": "...",
  "jsonMode": true,
  "task": "job_description"
}
```

Supported `task` values:

- `job_description`
- `resume_parse`
