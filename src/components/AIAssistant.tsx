import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageContext } from '../contexts/PageContext';
import { getGemmaCompletion } from '../services/huggingface';
import { useProfile, useJobs, useApplications, useDashboardStats, useCandidates } from '../hooks/useSupabase';
import { calculateJobMatch } from '../utils/ai';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

async function fetchResumeText(url: string): Promise<string> {
    try {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return text.trim().substring(0, 3000);
    } catch {
        return '';
    }
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const SUGGESTED_CANDIDATE = [
    'How can I improve my profile?',
    'How do I prepare for interviews?',
    'What skills are in demand right now?',
];

const SUGGESTED_EMPLOYER = [
    'How do I write a better job posting?',
    'Tips for evaluating candidates quickly',
    'What should I look for in a resume?',
];

export default function AIAssistant() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const { jobs } = useJobs();
    const { applications } = useApplications();
    const { stats } = useDashboardStats();
    const { candidates } = useCandidates();
    const { pageContext } = usePageContext();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [greeted, setGreeted] = useState(false);
    const [resumeText, setResumeText] = useState<string>('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile?.resume_url && profile.role === 'candidate' && !resumeText) {
            fetchResumeText(profile.resume_url).then(text => setResumeText(text));
        }
    }, [profile?.resume_url]);

    useEffect(() => {
        if (open && !greeted && profile) {
            const isEmployer = profile?.role === 'employer';
            const firstName = profile?.full_name?.split(' ')[0] || 'there';
            const greeting = isEmployer
                ? `Hi ${firstName}! I'm Pani AI. I can help with reviewing candidates, writing job descriptions, recruitment strategies, and more. What do you need?`
                : `Hi ${firstName}! I'm Pani AI. I can help with job applications, improving your profile, interview prep, and career advice. What's on your mind?`;
            setMessages([{ role: 'assistant', content: greeting }]);
            setGreeted(true);
        }
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, profile]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const buildSystemPrompt = () => {
        const isEmployer = profile?.role === 'employer';
        const base = `You are Pani AI, a concise and helpful recruitment assistant inside the Pani AI Recruitment platform. Keep responses brief (2-4 sentences max unless the user explicitly asks for detail). Be friendly and specific. IMPORTANT: Only state facts that are present in the data provided below. Never invent or estimate numbers, job counts, or statistics. If you don't have the data to answer, say so honestly. Today: ${new Date().toLocaleDateString()}.`;
        const pageSection = pageContext
            ? `\n\nCURRENT PAGE CONTEXT — The user is on the "${pageContext.page}" page. Use this data to answer questions about what they're looking at:\n${pageContext.summary}`
            : '';

        if (isEmployer) {
            const jobList = jobs.filter(j => j.employer_id === profile?.id).map(j => `- "${j.role}" | ${j.location} | ${j.type} | ${j.status} | ${j.applicants_count} applicants | Skills required: ${(j.skills || []).join(', ') || 'not specified'} | Experience: ${j.experience_level || 'not specified'}`).join('\n') || 'No jobs posted yet.';
            const topCandidates = candidates.slice(0, 10).map(c => `- ${c.full_name} | ${c.role} | ${c.experience} yrs | Skills: ${(c.skills || []).slice(0, 5).join(', ')} | Match: ${c.match_score}%`).join('\n') || 'No candidates found.';
            return `${base}
You are helping employer: ${profile?.full_name || 'User'} from ${profile?.company_name || 'their company'}.

REAL DATA from their account:
Active jobs: ${stats.activeJobs ?? 0}
Total applicants: ${stats.totalApplicants ?? 0}
Interviews scheduled: ${stats.interviewsToday ?? 0}
Pipeline — Applied: ${stats.pipeline?.applied ?? 0}, Screening: ${stats.pipeline?.screening ?? 0}, Interview: ${stats.pipeline?.interview ?? 0}, Offer: ${stats.pipeline?.offer ?? 0}

Their job listings:
${jobList}

Top matched candidates (ranked by match score to their jobs):
${topCandidates}

Only answer using this data. Help with: candidate evaluation, job postings, recruitment best practices, interview techniques.${pageSection}`;
        } else {
            const appList = applications.map(a => `- "${a.role}" at ${a.company} (status: ${a.status})`).join('\n') || 'No applications yet.';
            const scoredJobs = jobs.map(j => {
                const { score, details } = calculateJobMatch(j, profile);
                const matched = details.filter((d: any) => d.type === 'success').map((d: any) => d.label).join(', ');
                const missing = details.filter((d: any) => d.type === 'warning').map((d: any) => d.label).join(', ');
                return { role: j.role, company: j.company_name, location: j.location, score, matched, missing };
            }).sort((a, b) => b.score - a.score);
            const jobMatchList = scoredJobs.slice(0, 10).map(j =>
                `- "${j.role}" at ${j.company} (${j.location}) — Match: ${j.score}%${j.matched ? ` | Strengths: ${j.matched}` : ''}${j.missing ? ` | Missing: ${j.missing}` : ''}`
            ).join('\n') || 'No jobs available.';
            return `${base}
You are helping job seeker: ${profile?.full_name || 'User'}.
Their headline: ${profile?.headline || 'not set'}.
Their skills: ${(profile?.skills || []).join(', ') || 'not listed'}.
Their experience: ${profile?.experience_years || 0} years.
Their location: ${profile?.location || 'not set'}.

REAL DATA from their account:
Total applications submitted: ${applications.length}
Their applications:
${appList}

Job match scores (calculated from their actual profile vs job requirements):
${jobMatchList}
${resumeText ? 'Resume content (use this to give specific feedback when asked about their resume):\n' + resumeText : 'No resume uploaded yet.'}

Use these exact match percentages when asked about job matching. When asked about their resume, analyze the resume content above directly. Help with: job search, profile improvement, cover letters, interview prep.${pageSection}`;
        }
    };

    const send = async (text?: string) => {
        const content = (text || input).trim();
        if (!content || loading) return;

        const newMessages: ChatMessage[] = [...messages, { role: 'user', content }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const history = newMessages.slice(-8);
            const conversationText = history
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');
            const fullPrompt = `${buildSystemPrompt()}\n\nConversation:\n${conversationText}\n\nAssistant:`;

            const reply = await getGemmaCompletion(fullPrompt, { task: 'chat' });
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const suggestions = pageContext?.suggestions
        ?? (profile?.role === 'employer' ? SUGGESTED_EMPLOYER : SUGGESTED_CANDIDATE);
    const showSuggestions = messages.length <= 1;

    return (
        <>
            {/* Floating Button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    title="Ask Pani AI"
                    className="fixed bottom-[88px] right-4 md:bottom-6 md:right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-primary/40 hover:scale-105 transition-all flex items-center justify-center"
                >
                    <Sparkles className="h-6 w-6" />
                </button>
            )}

            {/* Chat Panel */}
            {open && (
                <div className="fixed inset-x-0 bottom-16 md:bottom-0 md:inset-x-auto md:bottom-6 md:right-6 z-50 w-full md:w-[360px] flex flex-col rounded-t-2xl md:rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
                    style={{ maxHeight: 'min(520px, calc(100vh - 56px))' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground leading-none">Pani AI</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Recruitment assistant</p>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} title="Close" className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.role === 'assistant' && (
                                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mb-0.5">
                                        <Bot className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                )}
                                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                    m.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                        : 'bg-muted text-foreground rounded-bl-sm'
                                }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-end gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <Bot className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1.5 items-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Suggested prompts */}
                    {showSuggestions && !loading && (
                        <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => send(s)}
                                    className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="flex gap-2 p-3 border-t border-border/60 shrink-0">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()}
                            placeholder="Ask anything..."
                            aria-label="Message Pani AI"
                            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                        />
                        <button
                            onClick={() => send()}
                            disabled={loading || !input.trim()}
                            title="Send message"
                            className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                        >
                            <Send className="h-4 w-4 text-primary-foreground" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
