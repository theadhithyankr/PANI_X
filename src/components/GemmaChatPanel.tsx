import { useMemo, useRef, useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { getGemmaCompletion } from '../services/huggingface';

interface GemmaChatPanelProps {
  role: 'candidate' | 'employer';
  userName?: string;
  contextSummary?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_PROMPTS: Record<'candidate' | 'employer', string[]> = {
  candidate: [
    'How can I improve my resume for frontend roles?',
    'Give me 5 interview questions for React developers',
    'Help me write a short follow-up message after applying',
  ],
  employer: [
    'How can I improve this job description for better applicants?',
    'What should I ask in a first-round frontend interview?',
    'Give me a quick shortlist checklist for candidates',
  ],
};

const INTRO_BY_ROLE: Record<'candidate' | 'employer', string> = {
  candidate: 'I can help with profile improvements, interview prep, applications, and career strategy.',
  employer: 'I can help with job postings, candidate evaluation, hiring process, and interview strategy.',
};

const MODE_PROMPTS = {
  mentor: 'Respond as a mentor: strategic, structured, and growth-oriented.',
  buddy: 'Respond as a friendly buddy: supportive, encouraging, and simple.',
  coach: 'Respond as a performance coach: actionable, direct, and outcome-focused.',
  analyst: 'Respond as an analyst: data-driven, precise, and evidence-focused.',
} as const;

type ChatMode = keyof typeof MODE_PROMPTS;
const MODES: ChatMode[] = ['mentor', 'buddy', 'coach', 'analyst'];

export default function GemmaChatPanel({ role, userName, contextSummary }: GemmaChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi ${userName?.split(' ')[0] || 'there'}! I am PANI AI. ${INTRO_BY_ROLE[role]}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ChatMode>('mentor');
  const endRef = useRef<HTMLDivElement>(null);

  const prompts = useMemo(() => STARTER_PROMPTS[role], [role]);

  const buildPrompt = (history: ChatMessage[]) => {
    const persona = role === 'candidate'
      ? 'You are PANI AI for job seekers. Be concise, practical, and supportive. Keep responses to 3-6 short sentences unless user asks for detail.'
      : 'You are PANI AI for employers and recruiters. Be concise, practical, and business-focused. Keep responses to 3-6 short sentences unless user asks for detail.';

    const modeInstructions = MODE_PROMPTS[selectedMode];

    const convo = history
      .slice(-10)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    return `${persona}
  This assistant is exclusive to the PANI platform.
  Only if the user explicitly asks who developed you, answer: "PANI AI was developed by ADHITHYAN K R using training from multiple datasets and sources."
  Never mention base model names, providers, or infrastructure. Present yourself only as PANI AI.
${modeInstructions}
Use all available user account data context below when it is relevant.
Return plain text only.

Available User Data:
${contextSummary || 'No additional account context provided.'}

Conversation:
${convo}

Assistant:`;
  };

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const prompt = buildPrompt(nextMessages);
      const reply = await getGemmaCompletion(prompt, { task: 'chat' });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.trim() }]);
    } catch (error) {
      console.error('Gemma chat failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'PANI AI is currently unavailable. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  };

  return (
    <Card className="bg-card border-border/60 min-h-[72vh] flex flex-col">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          PANI AI Chat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/50 flex flex-wrap gap-2">
          {MODES.map((mode) => {
            const active = selectedMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={`${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-3 py-2 bg-muted text-muted-foreground text-sm inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-border/40 pt-3">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-border/60 flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask PANI AI anything..."
            className="min-h-[44px] max-h-36 resize-y"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="h-11 px-3 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
