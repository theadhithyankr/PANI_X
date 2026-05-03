import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { X, FileText, Loader2, MessageSquare } from 'lucide-react';
import { Application, useInterviews, useProfile } from '../../hooks/useSupabase';
import ChatInterface from '../ChatInterface';
import ResumeViewerModal from '../common/ResumeViewerModal';
import { useToast } from '../../contexts/ToastContext';
import { DatePicker, TimePicker } from '../ui/DateTimePicker';

interface Props {
    open: boolean;
    onClose: () => void;
    application: Application | null;
    onStatusChange: (id: string, newStatus: string, feedback?: string) => Promise<void>;
}

const STATUS_OPTIONS = ['pending', 'reviewed', 'interview', 'offer', 'accepted', 'rejected'];

const STATUS_STYLES: Record<string, string> = {
    accepted: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    rejected:  'bg-rose-400/10 text-rose-400 border-rose-400/30',
    interview: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    offer:     'bg-blue-400/10 text-blue-400 border-blue-400/30',
    reviewed:  'bg-purple-400/10 text-purple-400 border-purple-400/30',
    pending:   'bg-muted/40 text-muted-foreground border-border',
};

export default function ApplicationReviewDialog({ open, onClose, application, onStatusChange }: Props) {
    const [status, setStatus] = useState('pending');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewTime, setInterviewTime] = useState('');
    const [openChat, setOpenChat] = useState(false);
    const [showResumeViewer, setShowResumeViewer] = useState(false);

    const { scheduleInterview } = useInterviews();
    const { profile } = useProfile();
    const toast = useToast();

    useEffect(() => {
        if (application) {
            setStatus(application.status || 'pending');
            setFeedback(application.rejection_feedback || '');
        }
    }, [application]);

    const handleSave = async () => {
        if (!application) return;
        setLoading(true);
        try {
            if (status === 'interview') {
                if (!interviewDate || !interviewTime) {
                    toast('Please select a date and time for the interview.', 'error');
                    setLoading(false);
                    return;
                }
                // Update application status first (always works)
                await onStatusChange(application.id, status, feedback);
                // Then try to create the interview record (best-effort)
                if (profile?.id) {
                    const startDateTime = new Date(`${interviewDate}T${interviewTime}`).toISOString();
                    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();
                    try {
                        await scheduleInterview(application.id, profile.id, application.candidate_id, startDateTime, endDateTime);
                    } catch (scheduleErr: any) {
                        console.error('Interview scheduling error:', scheduleErr);
                        // Status was already updated; warn but don't block
                        toast(`Status updated, but interview record failed: ${scheduleErr?.message ?? scheduleErr}`, 'error');
                        onClose();
                        return;
                    }
                }
            } else {
                await onStatusChange(application.id, status, feedback);
            }
            toast('Status updated successfully!', 'success');
            onClose();
        } catch (error: any) {
            console.error('Status update error:', error);
            toast(`Failed to update status: ${error?.message ?? error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!open || !application) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                        <h2 className="text-lg font-semibold text-foreground">Review Application</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
                        {/* Candidate Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-foreground">Candidate Application</p>
                                <p className="text-sm text-muted-foreground">Applied for: {application.role}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                                {status}
                            </span>
                        </div>

                        {/* Resume */}
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/60">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground">Resume</p>
                                {application.resume_url ? (
                                    <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowResumeViewer(true)}>
                                        View Resume
                                    </Button>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {application.cover_letter ? 'Cover letter available below' : 'No documents provided'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-border/60" />

                        {/* Cover Letter */}
                        <div>
                            <p className="text-sm font-semibold text-foreground mb-2">Cover Letter</p>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {application.cover_letter || 'No cover letter provided.'}
                            </p>
                        </div>

                        <div className="h-px bg-border/60" />

                        {/* Action */}
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-semibold text-foreground">Actions</p>

                            <div className="space-y-1">
                                <Label>Update Status</Label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
                                >
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <Button variant="outline" className="gap-2" onClick={() => setOpenChat(true)}>
                                <MessageSquare className="h-4 w-4" /> Message Candidate
                            </Button>

                            {status === 'interview' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Interview Date</Label>
                                        <DatePicker value={interviewDate} onChange={setInterviewDate} placeholder="Pick a date" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Start Time</Label>
                                        <TimePicker value={interviewTime} onChange={setInterviewTime} placeholder="Pick a time" />
                                    </div>
                                </div>
                            )}

                            {status === 'rejected' && (
                                <div className="space-y-1">
                                    <Label>Rejection Feedback (Optional)</Label>
                                    <textarea
                                        rows={3}
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        placeholder="Help the candidate improve..."
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/60">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading} className="gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? 'Saving...' : status === 'interview' ? 'Schedule Interview' : 'Update Status'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Chat Modal */}
            {openChat && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <ChatInterface otherUserId={application.candidate_id} otherUserName="Candidate" />
                        <div className="flex justify-end px-4 py-3 border-t border-border/60">
                            <Button variant="ghost" size="sm" onClick={() => setOpenChat(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Resume Viewer Modal */}
            {application.resume_url && (
                <ResumeViewerModal
                    open={showResumeViewer}
                    onClose={() => setShowResumeViewer(false)}
                    resumeUrl={application.resume_url}
                    candidateName="Candidate"
                    profile={application}
                    viewerRole="employer"
                    jobContext={application.job_data}
                />
            )}
        </>
    );
}
