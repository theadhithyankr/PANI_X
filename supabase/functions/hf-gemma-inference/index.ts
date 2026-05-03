const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

type GemmaTask = 'job_description' | 'resume_parse' | 'chat';

interface InferenceRequest {
  prompt?: string;
  jsonMode?: boolean;
  model?: string;
  task?: GemmaTask;
  temperature?: number;
  maxTokens?: number;
}

const taskSystemPrompt = (task?: GemmaTask) => {
  if (task === 'job_description') {
    return 'You are an expert HR assistant. Always return valid raw JSON only. Do not include markdown, code fences, or extra commentary.';
  }

  if (task === 'resume_parse') {
    return 'You are an expert resume parser. Always return valid raw JSON only. Do not include markdown, code fences, or extra commentary.';
  }

  if (task === 'chat') {
    return 'You are PANI AI, exclusive to the PANI platform. Only if the user explicitly asks who developed you, answer: "PANI AI was developed by ADHITHYAN K R using training from multiple datasets and sources." Never mention model names, providers, or infrastructure. Provide concise, practical answers in plain text. Avoid markdown unless the user asks for it.';
  }

  return 'You are a concise and accurate AI assistant.';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = Deno.env.get('HF_API_KEY');
    const defaultModel = Deno.env.get('HF_GEMMA_MODEL_ID') || 'google/gemma-3-27b-it';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing HF_API_KEY secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as InferenceRequest;
    const prompt = (body.prompt || '').trim();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const model = (body.model || defaultModel).trim();
    const jsonMode = Boolean(body.jsonMode);
    const temperature = typeof body.temperature === 'number' ? body.temperature : 0.2;
    const maxTokens = typeof body.maxTokens === 'number' ? body.maxTokens : 900;

    const systemPrompt = taskSystemPrompt(body.task);

    const requestPayload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    };

    const candidateEndpoints = [
      'https://router.huggingface.co/v1/chat/completions',
      `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}/v1/chat/completions`,
    ];

    let payload: any = null;
    let lastFailure: { status?: number; details: string; endpoint: string } | null = null;

    for (const endpoint of candidateEndpoints) {
      const hfResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (hfResponse.ok) {
        payload = await hfResponse.json();
        lastFailure = null;
        break;
      }

      const errorText = await hfResponse.text();
      lastFailure = {
        status: hfResponse.status,
        details: errorText.slice(0, 1000),
        endpoint,
      };
    }

    if (!payload) {
      return new Response(
        JSON.stringify({
          error: 'Hugging Face request failed',
          status: lastFailure?.status || 502,
          details: lastFailure?.details || 'Unknown upstream error',
          endpoint: lastFailure?.endpoint,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const text = payload?.choices?.[0]?.message?.content;

    if (typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Empty model response', raw: payload }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        provider: 'huggingface',
        model,
        text,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Unhandled edge function error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
