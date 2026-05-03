import { useState, useEffect } from 'react';
import GlobeAnimation from '../components/GlobeAnimation';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import {
    BrainCircuit, EyeOff, MessageSquareHeart, Wand2, ArrowRight,
    Sparkles, Shield, Zap, CheckCircle2, Users, Briefcase,
    ChevronDown, BarChart3, FileSearch, CalendarCheck, MessageCircle,
    Star, Building2, GraduationCap,
} from 'lucide-react';

/* ── Data ─────────────────────────────────────────────────────────────── */

const STATS = [
    { value: '98%', label: 'Match Accuracy', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { value: '3×', label: 'Faster Hiring', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { value: '100%', label: 'Bias-Free Process', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { value: '500+', label: 'Companies Onboarded', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
];

const HOW_EMPLOYER = [
    { step: '01', title: 'Post a Job in 60s', body: 'Describe the role in plain English or fill out the form. Our AI can auto-generate complete job descriptions from your brief.' },
    { step: '02', title: 'AI Ranks Candidates', body: 'Pani scores every applicant by skill fit, experience, and role-match — not just keywords. The best rise to the top, instantly.' },
    { step: '03', title: 'Review & Hire', body: 'See detailed match breakdowns, chat with PANI AI for hiring insights, and manage everything in one dashboard.' },
];

const HOW_CANDIDATE = [
    { step: '01', title: 'Build Your Profile', body: 'Create your profile with your skills, experience, and career goals. Keep it updated to get better matches.' },
    { step: '02', title: 'Get Matched Instantly', body: 'Our AI surfaces jobs that actually fit your background and shows you your match score before you even apply.' },
    { step: '03', title: 'Apply Smarter', body: 'AI writes a tailored cover letter for each role. Chat with PANI AI for interview prep and career advice.' },
];

const FEATURES = [
    {
        icon: BrainCircuit, title: 'AI-Powered Matching',
        body: 'Skills-based matching that goes beyond keyword search — finding candidates who can actually do the job.',
        color: 'text-violet-400', bg: 'bg-violet-400/10',
    },
    {
        icon: EyeOff, title: 'Blind Hiring Mode',
        body: 'Anonymize names, photos, and demographics during initial screening to eliminate unconscious bias.',
        color: 'text-blue-400', bg: 'bg-blue-400/10',
    },
    {
        icon: Wand2, title: 'AI Job Description Generator',
        body: 'Describe your role in plain English and our AI drafts a complete job posting with all the details.',
        color: 'text-amber-400', bg: 'bg-amber-400/10',
    },
    {
        icon: FileSearch, title: 'Cover Letter AI',
        body: 'Generate a unique, job-specific cover letter in one click — personalized to each role\'s requirements.',
        color: 'text-orange-400', bg: 'bg-orange-400/10',
    },
    {
        icon: MessageSquareHeart, title: 'AI Career Assistant',
        body: 'Chat with PANI AI for job search guidance, interview prep, hiring strategy, and recruitment support.',
        color: 'text-pink-400', bg: 'bg-pink-400/10',
    },
    {
        icon: BarChart3, title: 'Match Score Breakdown',
        body: 'See detailed compatibility scores for every candidate-job pairing with transparent AI reasoning.',
        color: 'text-emerald-400', bg: 'bg-emerald-400/10',
    },
    {
        icon: MessageCircle, title: 'In-App Messaging',
        body: 'Keep all candidate communications in one place — no more scattered emails or lost follow-ups.',
        color: 'text-rose-400', bg: 'bg-rose-400/10',
    },
    {
        icon: Sparkles, title: 'Smart Application Review',
        body: 'AI-ranked candidate shortlists help employers focus on the best matches first, saving hours of screening.',
        color: 'text-cyan-400', bg: 'bg-cyan-400/10',
    },
];

const TESTIMONIALS = [
    {
        name: 'Sarah Chen', role: 'Head of Talent, NovaTech', avatar: 'SC',
        body: 'We cut our time-to-hire from 6 weeks to 11 days. The AI match scores are eerily accurate.',
        stars: 5, color: 'from-violet-500 to-blue-500',
    },
    {
        name: 'Marcus Reid', role: 'Software Engineer', avatar: 'MR',
        body: 'Got 4 interviews in my first week. The AI cover letter was better than anything I\'d written myself.',
        stars: 5, color: 'from-amber-500 to-orange-500',
    },
    {
        name: 'Priya Nair', role: 'HR Director, FinAxis', avatar: 'PN',
        body: 'The blind hiring mode gave us the most diverse shortlist we\'ve ever had. Truly game-changing.',
        stars: 5, color: 'from-emerald-500 to-cyan-500',
    },
];

const FAQS = [
    { q: 'How does AI matching work?', a: 'Our model analyzes candidate profiles against job requirements across 50+ parameters — skills, experience depth, seniority level, and role-specific signals — and produces a match score. No keyword matching, pure semantic understanding.' },
    { q: 'Is my data safe?', a: 'All data is encrypted at rest and in transit. We comply with GDPR and are SOC 2 Type II certified. Resumes and personal data are never used to train our models.' },
    { q: 'Can candidates use Pani for free?', a: 'Yes — candidates always use Pani for free. Employers are charged per seat on job postings beyond the free tier.' },
    { q: 'How is blind hiring enforced?', a: 'When enabled, all candidate-identifying information (name, photo, age, pronouns) is removed from the employer view until they explicitly unlock it after making a quality decision.' },
];

/* ── LiveTicker ─────────────────────────────────────────────────────────── */

const TICKS = [
    'Someone in Tokyo was just matched with a role in Singapore',
    'A developer in Berlin got an offer within 48h',
    '12 new jobs posted in Bangalore in the last hour',
    'AI generated 43 cover letters in the last minute',
    'A candidate in New York accepted an offer today',
    '350+ employers reviewed candidates this morning',
    'A designer in London matched a remote role in Toronto',
];

function LiveTicker() {
    const [idx, setIdx] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => { setIdx(i => (i + 1) % TICKS.length); setFade(true); }, 400);
        }, 3200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-8 flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <p className="text-sm text-muted-foreground transition-opacity duration-300" style={{ opacity: fade ? 1 : 0 }}>
                {TICKS[idx]}
            </p>
        </div>
    );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function Landing() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activeAudience, setActiveAudience] = useState<'employer' | 'candidate'>('employer');
    const { theme } = useTheme();

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Ambient background */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[140px]" />
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-emerald-600/6 blur-[120px]" />
            </div>

            {/* ── Navbar ─────────────────────────────────────────────── */}
            <header className="border-b border-border/40 backdrop-blur-xl bg-background/75 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <img
                        src={theme === 'dark' ? '/pani-logo-dark.png' : '/pani-logo-light.png'}
                        alt="Pani"
                        className="h-7 w-auto object-contain"
                    />
                    <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
                        <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
                        <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/signin">Sign in</Link>
                        </Button>
                        <Button size="sm" className="font-semibold" asChild>
                            <Link to="/signup">Get started free</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* ── Hero ───────────────────────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-8 sm:pb-12">
                <div className="grid lg:grid-cols-2 items-center gap-12">
                    {/* Left: text */}
                    <div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08]">
                            The smarter way<br />
                            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                to hire &amp; get hired.
                            </span>
                        </h1>
                        <p className="mt-7 text-lg text-muted-foreground leading-relaxed max-w-lg">
                            Pani connects exceptional candidates with top companies — using AI to remove bias, cut time-to-hire, and make every match count.
                        </p>
                        <div className="flex flex-row items-start gap-4 mt-10">
                            <Button size="lg" className="px-8 font-bold text-base gap-2" asChild>
                                <Link to="/signup">
                                    Get started <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="px-8 font-bold text-base" asChild>
                                <Link to="/signup?role=candidate">
                                    <GraduationCap className="h-4 w-4 mr-2" /> Find jobs
                                </Link>
                            </Button>
                        </div>
                        {/* Live ticker */}
                        <LiveTicker />
                    </div>

                    {/* Right: Globe */}
                    <div className="flex items-center justify-center">
                        <GlobeAnimation />
                    </div>
                </div>
            </section>

            {/* ── Stats ──────────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STATS.map(({ value, label, icon: Icon, color, bg }) => (
                        <div key={label} className="text-center p-4 sm:p-6 rounded-2xl bg-card border border-border/60 hover:border-border transition-colors">
                            <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`}>
                                <Icon className={`h-5 w-5 ${color}`} />
                            </div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{value}</div>
                            <div className="text-xs text-muted-foreground mt-1">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── How it works ───────────────────────────────────────── */}
            <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-extrabold">How it works</h2>
                    <p className="text-muted-foreground mt-3 text-lg">Simple for both sides of the table.</p>
                    {/* Audience toggle */}
                    <div className="inline-flex mt-6 rounded-xl bg-card border border-border/60 p-1">
                        <button
                            onClick={() => setActiveAudience('employer')}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeAudience === 'employer' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Briefcase className="h-4 w-4" /> For Employers
                        </button>
                        <button
                            onClick={() => setActiveAudience('candidate')}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeAudience === 'candidate' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Users className="h-4 w-4" /> For Candidates
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mt-4">
                    {(activeAudience === 'employer' ? HOW_EMPLOYER : HOW_CANDIDATE).map(({ step, title, body }) => (
                        <div key={step} className="relative p-5 sm:p-7 rounded-2xl bg-card border border-border/60 group hover:border-primary/30 transition-all">
                            <span className="text-6xl font-black text-muted/20 absolute top-5 right-6 select-none">{step}</span>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                                <span className="text-primary font-bold text-sm">{step}</span>
                            </div>
                            <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features Grid ──────────────────────────────────────── */}
            <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold">Everything you need,<br />nothing you don't.</h2>
                    <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
                        A complete recruitment OS built on AI — from first application to signed offer.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {FEATURES.map(({ icon: Icon, title, body, color, bg }) => (
                        <div key={title} className="p-5 sm:p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 group">
                            <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center mb-5`}>
                                <Icon className={`h-6 w-6 ${color}`} />
                            </div>
                            <h3 className="font-semibold text-foreground text-base mb-2">{title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Dual value prop banner ─────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Employer */}
                    <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-violet-600/20 to-blue-600/10 border border-violet-500/20">
                        <Briefcase className="h-8 w-8 text-violet-400 mb-5" />
                        <h3 className="text-2xl font-bold text-foreground mb-3">Built for employers</h3>
                        <ul className="space-y-2.5 mb-8">
                            {['Post jobs in under 60 seconds', 'AI-generated job descriptions', 'AI-ranked candidate shortlists', 'Blind hiring to remove bias', 'Match score breakdowns', 'AI hiring assistant'].map(item => (
                                <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                        <Button asChild className="bg-violet-600 hover:bg-violet-700 font-semibold">
                            <Link to="/signup?role=employer">Get started <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
                        </Button>
                    </div>

                    {/* Candidate */}
                    <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-600/20 to-cyan-600/10 border border-emerald-500/20">
                        <GraduationCap className="h-8 w-8 text-emerald-400 mb-5" />
                        <h3 className="text-2xl font-bold text-foreground mb-3">Built for candidates</h3>
                        <ul className="space-y-2.5 mb-8">
                            {['Jobs matched to your actual skills', 'Match score before you apply', 'AI-generated cover letters', 'AI career assistant & interview prep', 'In-app messaging', 'Always 100% free'].map(item => (
                                <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 font-semibold">
                            <Link to="/signup?role=candidate">Find jobs <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ───────────────────────────────────────── */}
            <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
                <div className="text-center mb-14">
                    <h2 className="text-3xl md:text-5xl font-extrabold">Trusted by builders &amp; dreamers</h2>
                    <p className="text-muted-foreground mt-3 text-lg">Real people, real results.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {TESTIMONIALS.map(({ name, role, avatar, body, stars, color }) => (
                        <div key={name} className="p-6 rounded-2xl bg-card border border-border/60 flex flex-col gap-4">
                            <div className="flex">
                                {Array.from({ length: stars }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{body}"</p>
                            <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                                <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                                    {avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{name}</p>
                                    <p className="text-xs text-muted-foreground">{role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQ ────────────────────────────────────────────────── */}
            <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold">Frequently asked</h2>
                </div>
                <div className="flex flex-col gap-3">
                    {FAQS.map(({ q, a }, idx) => (
                        <div key={idx} className="rounded-2xl bg-card border border-border/60 overflow-hidden">
                            <button
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className="w-full flex items-center justify-between px-6 py-5 text-left text-sm font-semibold text-foreground hover:bg-muted/20 transition-colors"
                            >
                                {q}
                                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
                            </button>
                            {openFaq === idx && (
                                <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                                    {a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Final CTA ──────────────────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
                <div className="rounded-3xl bg-gradient-to-br from-violet-600/25 via-blue-600/15 to-cyan-600/10 border border-violet-500/25 p-6 sm:p-14 text-center relative overflow-hidden">
                    {/* Glow */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    </div>

                    <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
                        Ready to transform<br />your hiring?
                    </h2>
                    <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
                        Join hundreds of companies and thousands of candidates already on Pani — building better careers, faster.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="px-10 font-bold text-base gap-2" asChild>
                            <Link to="/signup">
                                Get started for free <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="px-10 font-bold text-base" asChild>
                            <Link to="/signin">Sign in</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <footer className="border-t border-border/40 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <img
                        src={theme === 'dark' ? '/pani-logo-dark.png' : '/pani-logo-light.png'}
                        alt="Pani"
                        className="h-6 w-auto object-contain"
                    />
                    <div className="flex gap-6">
                        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
                        <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
                        <Link to="/signin" className="hover:text-foreground transition-colors">Sign in</Link>
                    </div>
                    <span>© 2025 Pani Business. All rights reserved.</span>
                </div>
            </footer>
        </div>
    );
}
