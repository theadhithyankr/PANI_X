import { supabase } from '../utils/supabase/client';

type GemmaTask = 'job_description' | 'resume_parse' | 'chat';

interface GemmaCompletionOptions {
  jsonMode?: boolean;
  model?: string;
  task?: GemmaTask;
}

const getConfiguredGemmaModel = () => {
  const env = (import.meta as any).env;
  return env?.VITE_GEMMA_MODEL_ID as string | undefined;
};

export const getGemmaCompletion = async (
  prompt: string,
  options: GemmaCompletionOptions = {}
) => {
  const { jsonMode = false, model, task } = options;

  const { data, error } = await supabase.functions.invoke('hf-gemma-inference', {
    body: {
      prompt,
      jsonMode,
      model: model || getConfiguredGemmaModel(),
      task,
    },
  });

  if (error) {
    throw new Error(error.message || 'Gemma function invocation failed');
  }

  const text = typeof data?.text === 'string' ? data.text : '';
  if (!text.trim()) {
    throw new Error('Gemma returned an empty response');
  }

  return text;
};
