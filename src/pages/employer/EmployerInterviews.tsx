import { useState } from 'react';
import { useInterviews } from '../../hooks/useSupabase';
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CalendarDays, Loader2, CalendarPlus, Trash2, Edit, X } from 'lucide-react';
import { DatePicker, TimePicker } from '../../components/ui/DateTimePicker';
import { Label } from '../../components/ui/label';
import { useToast } from '../../contexts/ToastContext';

export default function EmployerInterviews() {
    const { interviews, loading, updateInterview, deleteInterview } = useInterviews();
    const toast = useToast();
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');

    if (loading) {
        return (
            <EmployerLayout>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </EmployerLayout>
        );
    }

    const upcoming = interviews.filter((i) => i.status === 'scheduled');

    const generateGoogleCalendarUrl = (interview: any) => {
        const title = encodeURIComponent(`Interview with ${interview.name} - ${interview.role}`);
        
        // Format to YYYYMMDDTHHmmssZ
        const formatDate = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };

        const start = formatDate(interview.start_time);
        const end = formatDate(interview.end_time || new Date(new Date(interview.start_time).getTime() + 60*60*1000).toISOString());
        const details = encodeURIComponent(`Pani AI Interview with ${interview.name} for the ${interview.role} role.`);

        let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
        if (interview.candidate_email) {
            url += `&add=${encodeURIComponent(interview.candidate_email)}`;
        }
        return url;
    };

    const handleEditClick = (interview: any) => {
        const d = new Date(interview.start_time);
        // Format to local date and time string
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setEditDate(`${year}-${month}-${day}`);
        setEditTime(d.toTimeString().slice(0, 5));
        setEditingId(interview.id);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editDate || !editTime) return;
        try {
            const startDateTime = new Date(`${editDate}T${editTime}`).toISOString();
            const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();
            await updateInterview(editingId, { start_time: startDateTime, end_time: endDateTime });
            toast('Interview updated successfully', 'success');
            setEditingId(null);
        } catch (error: any) {
            toast(`Failed to update: ${error.message}`, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to cancel this interview?")) return;
        try {
            await deleteInterview(id);
            toast('Interview cancelled', 'success');
        } catch (error: any) {
            toast(`Failed to cancel: ${error.message}`, 'error');
        }
    };

    return (
        <EmployerLayout>
            <div className="flex flex-col gap-6">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Interviews</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Your scheduled interviews.</p>
                </div>

                <Card className="bg-card border-border/60">
                    <CardHeader className="border-b border-border/60 py-3 px-5">
                        <CardTitle className="text-base font-semibold">Upcoming</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {upcoming.length === 0 ? (
                            <p className="text-muted-foreground text-sm px-5 py-10 text-center">No upcoming interviews scheduled.</p>
                        ) : (
                            <ul className="divide-y divide-border/50">
                                {upcoming.map((interview) => (
                                    <li key={interview.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 gap-3 hover:bg-muted/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-violet-400/10 flex items-center justify-center text-violet-400 font-bold shrink-0">
                                                {interview.name[0]}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold text-foreground text-sm">{interview.name}</p>
                                                    <span className="px-1.5 py-0.5 text-xs rounded border border-border text-muted-foreground">{interview.role}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {interview.time}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(generateGoogleCalendarUrl(interview), '_blank')}
                                                className="shrink-0 gap-2 text-xs"
                                            >
                                                <CalendarPlus className="h-3.5 w-3.5" />
                                                <span className="hidden xs:inline">Add to </span>Calendar
                                            </Button>
                                            <Button size="icon" variant="outline" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(interview)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="outline" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(interview.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {editingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                            <h2 className="text-lg font-semibold text-foreground">Edit Interview</h2>
                            <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div className="space-y-1">
                                <Label>Date</Label>
                                <DatePicker value={editDate} onChange={setEditDate} placeholder="Select Date" />
                            </div>
                            <div className="space-y-1">
                                <Label>Time</Label>
                                <TimePicker value={editTime} onChange={setEditTime} placeholder="Select Time" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/60">
                            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            <Button onClick={handleSaveEdit}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}
        </EmployerLayout>
    );
}
