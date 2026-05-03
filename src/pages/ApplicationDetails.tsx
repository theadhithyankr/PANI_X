import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Building2, CalendarDays, Loader2 } from 'lucide-react';
import { useApplications } from '../hooks/useSupabase';
import { usePageContext } from '../contexts/PageContext';

const STATUS_STYLES: Record<string, string> = {
    accepted: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    rejected:  'bg-rose-400/10 text-rose-400 border-rose-400/30',
    reviewed:  'bg-blue-400/10 text-blue-400 border-blue-400/30',
    pending:   'bg-muted/40 text-muted-foreground border-border',
};

export default function ApplicationDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { applications, loading } = useApplications();
    const [application, setApplication] = useState<any | null>(null);
    const { setPageContext, clearPageContext } = usePageContext();

    useEffect(() => {
        if (!loading && applications.length > 0) {
            setApplication(applications.find(a => a.id === id) || null);
        }
    }, [id, applications, loading]);

    useEffect(() => {
        if (!application) return;
        setPageContext({
            page: 'Application Details',
            summary: `Viewing application details.
Job Role: ${application.role}
Company: ${application.company}
Applied On: ${application.date}
Status: ${application.status}
Cover Letter: ${application.cover_letter || 'None submitted'}${application.rejection_feedback ? `\nFeedback from Employer: ${application.rejection_feedback}` : ''}`,
            suggestions: [
                `What does "${application.status}" status mean?`,
                application.status === 'rejected'
                    ? 'How can I improve after this rejection?'
                    : 'What can I do to increase my chances?',
                'How can I improve my cover letter for next time?',
            ],
        });
        return () => clearPageContext();
    }, [application?.id]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!application) {
        return (
            <DashboardLayout>
                <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate('/applications')}>
                    <ArrowLeft className="h-4 w-4" /> Back to Applications
                </Button>
                <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 text-rose-400 px-4 py-3 text-sm">
                    Application not found.
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <Button variant="ghost" className="gap-2 w-fit -ml-2" onClick={() => navigate('/applications')}>
                    <ArrowLeft className="h-4 w-4" /> Back to Applications
                </Button>

                {/* Header Card */}
                <Card className="bg-card border-border/60">
                    <CardContent className="pt-6">
                        <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border uppercase mb-4 inline-block ${STATUS_STYLES[application.status] || STATUS_STYLES.pending}`}>
                            {application.status}
                        </span>
                        <h1 className="text-3xl font-bold text-foreground mb-3">{application.role}</h1>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" /> {application.company}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" /> Applied on {application.date}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Rejection Feedback */}
                {application.status === 'rejected' && application.rejection_feedback && (
                    <div className="rounded-xl border border-rose-400/30 bg-rose-400/5 px-5 py-4">
                        <p className="font-semibold text-rose-400 mb-2">Feedback from Employer</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{application.rejection_feedback}</p>
                    </div>
                )}

                {/* Cover Letter */}
                <Card className="bg-card border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Application Details</CardTitle>
                    </CardHeader>
                    <div className="h-px bg-border/60 mx-6" />
                    <CardContent className="pt-4">
                        <p className="text-sm font-medium text-foreground mb-2">Cover Letter</p>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {application.cover_letter || 'No cover letter submitted.'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
