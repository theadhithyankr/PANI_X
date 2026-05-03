import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
    ArrowLeft, MapPin, Mail, Briefcase, GraduationCap, Code2,
    MessageSquare, FileText, Target, BadgeCheck
} from 'lucide-react';
import MatchBreakdownModal from '../../components/common/MatchBreakdownModal';
import ResumeViewerModal from '../../components/common/ResumeViewerModal';
import ChatInterface from '../../components/ChatInterface';
import { usePageContext } from '../../contexts/PageContext';
import type { Candidate } from '../../hooks/useSupabase';

export default function EmployerCandidateProfile() {
    const navigate = useNavigate();
    const { state } = useLocation() as { state: Candidate | null };
    const candidate = state;
    const { setPageContext, clearPageContext } = usePageContext();

    const [showBreakdown, setShowBreakdown] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showResume, setShowResume] = useState(false);

    useEffect(() => {
        if (!candidate) return;
        const expList = candidate.work_experience?.length
            ? candidate.work_experience.map((e: any) => `${e.title} at ${e.company} (${e.start_date}–${e.end_date || 'Present'})`).join('; ')
            : 'None listed';
        const eduList = candidate.education_history?.length
            ? candidate.education_history.map((e: any) => `${e.degree || ''} at ${e.school || e.institution || ''}`).join('; ')
            : 'None listed';
        const firstName = candidate.full_name?.split(' ')[0] || 'this candidate';
        setPageContext({
            page: 'Candidate Profile',
            summary: `Viewing profile of candidate: ${candidate.full_name}
Role/Headline: ${candidate.role || 'Not set'}
Location: ${candidate.location || 'Not set'}
Experience: ${candidate.experience} years
Skills: ${(candidate.skills || []).join(', ') || 'None listed'}
Bio: ${candidate.bio || 'Not provided'}
Work Experience: ${expList}
Education: ${eduList}
Match Score: ${candidate.match_score}%
Best matched job: ${candidate.best_job_title || 'Not specified'}
Application Status: ${candidate.application_status || 'Not applied'}`,
            suggestions: [
                `How good is ${firstName} for this role?`,
                `What are ${firstName}'s key strengths?`,
                'Should I shortlist this candidate?',
                'What interview questions should I ask?',
            ],
        });
        return () => clearPageContext();
    }, [candidate?.id]);


    if (!candidate) {
        return (
            <EmployerLayout>
                <Button variant="ghost" className="gap-2 mb-6 -ml-2" onClick={() => navigate('/employer/candidates')}>
                    <ArrowLeft className="h-4 w-4" /> Back to Candidates
                </Button>
                <div className="rounded-2xl border border-rose-400/30 bg-rose-400/5 text-rose-400 px-5 py-4 text-sm">
                    Candidate not found. Please go back and try again.
                </div>
            </EmployerLayout>
        );
    }

    const scoreColor = candidate.match_score >= 70
        ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
        : candidate.match_score >= 40
        ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
        : 'text-rose-400 bg-rose-400/10 border-rose-400/30';

    return (
        <EmployerLayout>
            <div className="flex flex-col gap-4 sm:gap-6">
                {/* Back */}
                <Button variant="ghost" className="gap-2 w-fit -ml-2 text-sm" onClick={() => navigate('/employer/candidates')}>
                    <ArrowLeft className="h-4 w-4" /> Back to Candidates
                </Button>

                {/* Hero Card */}
                <Card className="bg-card border-border/60 overflow-hidden">
                    <div className="h-36 relative bg-gradient-to-br from-violet-700/60 to-blue-700/40 overflow-hidden">
                        {candidate.cover_url && (
                            <img src={candidate.cover_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                    </div>
                    <CardContent className="pt-0 pb-5 px-4 sm:px-6">
                        {/* Avatar — only this overlaps the cover */}
                        <div className="-mt-10 sm:-mt-12 mb-3">
                            <div className="relative w-fit">
                                {candidate.avatar_url ? (
                                    <img
                                        src={candidate.avatar_url}
                                        alt={candidate.full_name}
                                        className="h-24 w-24 rounded-full object-cover border-4 border-card"
                                    />
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white border-4 border-card">
                                        {candidate.full_name?.[0]}
                                    </div>
                                )}
                                <BadgeCheck className="absolute bottom-1 right-1 h-6 w-6 text-primary bg-card rounded-full" />
                            </div>
                        </div>

                        {/* Name + info + badges — all in normal flow below cover */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold text-foreground">{candidate.full_name}</h1>
                                <p className="text-muted-foreground text-sm mt-0.5">{candidate.role || 'Add a headline'}</p>
                                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{candidate.location || 'Remote'}</span>
                                    {candidate.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{candidate.email}</span>}
                                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{candidate.experience} yrs exp</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                                <div className="flex gap-2 items-center flex-wrap">
                                    {candidate.application_status && (
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border capitalize ${
                                            candidate.application_status === 'accepted' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' :
                                            candidate.application_status === 'offer' ? 'bg-blue-400/10 text-blue-400 border-blue-400/30' :
                                            'bg-muted/40 text-muted-foreground border-border'
                                        }`}>
                                            {candidate.application_status === 'accepted' ? 'Hired' : candidate.application_status}
                                        </span>
                                    )}
                                    <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${scoreColor}`}>
                                        {candidate.match_score}% Match
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 rounded-xl"
                                        onClick={() => setShowBreakdown(true)}
                                    >
                                        <Target className="h-3.5 w-3.5" /> Details
                                    </Button>
                                </div>
                                {candidate.best_job_title && (
                                    <p className="text-xs text-muted-foreground">Matched for: <span className="font-medium text-foreground">{candidate.best_job_title}</span></p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="flex flex-col gap-5">
                        <Card className="bg-card border-border/60">
                            <CardContent className="pt-5">
                                <h3 className="font-semibold text-foreground mb-2">About</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {candidate.bio || 'No bio provided.'}
                                </p>
                            </CardContent>
                        </Card>

                        {candidate.skills && candidate.skills.length > 0 && (
                            <Card className="bg-card border-border/60">
                                <CardContent className="pt-5">
                                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-1.5">
                                        <Code2 className="h-4 w-4 text-violet-400" /> Skills
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {candidate.skills.map((s: string) => (
                                            <span key={s} className="px-2.5 py-1 text-xs rounded-full border border-border text-muted-foreground">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        <Card className="bg-card border-border/60">
                            <CardContent className="pt-5 flex flex-col gap-3">
                                {candidate.resume_url ? (
                                    <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={() => setShowResume(true)}>
                                        <FileText className="h-4 w-4" /> View Resume
                                    </Button>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center">No resume uploaded</p>
                                )}
                                <Button className="w-full gap-2 rounded-xl" onClick={() => setShowChat(true)}>
                                    <MessageSquare className="h-4 w-4" /> Message Candidate
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="md:col-span-2 flex flex-col gap-5">
                        <Card className="bg-card border-border/60">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4 text-amber-400" /> Work Experience
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!(candidate.work_experience?.length) ? (
                                    <p className="text-sm text-muted-foreground">No experience listed.</p>
                                ) : (
                                    <div className="relative flex flex-col gap-0">
                                        {candidate.work_experience.map((exp: any, idx: number) => (
                                            <div key={idx} className="flex gap-4 pb-6 last:pb-0 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className={`h-3 w-3 rounded-full mt-1 shrink-0 ${idx === 0 ? 'bg-amber-400' : 'bg-muted-foreground/40'}`} />
                                                    {idx < candidate.work_experience!.length - 1 && <div className="w-0.5 bg-border flex-1 mt-1" />}
                                                </div>
                                                <div className="flex-1 pb-1">
                                                    <p className="font-semibold text-foreground text-sm">{exp.title}</p>
                                                    <p className="text-xs text-muted-foreground">{exp.company}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{exp.start_date} – {exp.end_date || 'Present'}</p>
                                                    {exp.description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border/60">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                                    <GraduationCap className="h-4 w-4 text-emerald-400" /> Education
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!(candidate.education_history?.length) ? (
                                    <p className="text-sm text-muted-foreground">No education listed.</p>
                                ) : (
                                    <div className="flex flex-col gap-0">
                                        {candidate.education_history.map((edu: any, idx: number) => (
                                            <div key={idx} className="flex gap-4 pb-6 last:pb-0">
                                                <div className="flex flex-col items-center">
                                                    <div className={`h-3 w-3 rounded-full mt-1 shrink-0 ${idx === 0 ? 'bg-emerald-400' : 'bg-muted-foreground/40'}`} />
                                                    {idx < candidate.education_history!.length - 1 && <div className="w-0.5 bg-border flex-1 mt-1" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-foreground text-sm">{edu.school || edu.institution}</p>
                                                    <p className="text-xs text-muted-foreground">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{edu.start_year} – {edu.end_year || 'Present'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Match Breakdown Modal */}
            <MatchBreakdownModal
                open={showBreakdown}
                onClose={() => setShowBreakdown(false)}
                score={candidate.match_score}
                candidateName={candidate.full_name}
                jobTitle={candidate.best_job_title}
                details={candidate.match_details || []}
            />

            {/* Resume Viewer Modal */}
            {candidate.resume_url && (
                <ResumeViewerModal
                    open={showResume}
                    onClose={() => setShowResume(false)}
                    resumeUrl={candidate.resume_url}
                    candidateName={candidate.full_name}
                    profile={candidate}
                    viewerRole="employer"
                />
            )}

            {/* Chat Modal */}
            {showChat && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-card border border-border/60 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden">
                        <ChatInterface otherUserId={candidate.id} otherUserName={candidate.full_name} />
                        <div className="flex justify-end px-4 py-3 border-t border-border/60">
                            <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </EmployerLayout>
    );
}
