import { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Video, FileText, Mail, CheckCircle2, Clock, Loader2, CalendarPlus } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import { useInbox } from '../hooks/useSupabase';

const TABS = ['All', 'Interviews', 'Messages'];

function getItemStyle(item: any) {
    if (item.type === 'interview') return { bg: 'bg-violet-400/10', color: 'text-violet-400', Icon: Video };
    if (item.status?.toLowerCase().includes('offer')) return { bg: 'bg-emerald-400/10', color: 'text-emerald-400', Icon: CheckCircle2 };
    if (item.status?.toLowerCase().includes('rejected')) return { bg: 'bg-rose-400/10', color: 'text-rose-400', Icon: Mail };
    if (item.type === 'test') return { bg: 'bg-amber-400/10', color: 'text-amber-400', Icon: FileText };
    return { bg: 'bg-blue-400/10', color: 'text-blue-400', Icon: Mail };
}

export default function Inbox() {
    const { inboxItems, loading } = useInbox();
    const [tab, setTab] = useState(0);
    const [openChat, setOpenChat] = useState(false);
    const [chatTarget, setChatTarget] = useState<{ id: string; name: string } | null>(null);

    const interviewCount = inboxItems.filter(i => i.type === 'interview').length;

    const displayed = inboxItems.filter(item => {
        if (tab === 0) return true;
        if (tab === 1) return item.type === 'interview';
        if (tab === 2) return item.type === 'message';
        return true;
    });

    const handleAction = (item: any) => {
        if ((item.type === 'message' || item.action === 'Message') && item.senderId) {
            setChatTarget({ id: item.senderId, name: item.company });
            setOpenChat(true);
        }
    };

    const generateGoogleCalendarUrl = (item: any) => {
        const title = encodeURIComponent(item.title);
        
        // Format to YYYYMMDDTHHmmssZ
        const formatDate = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };

        const start = formatDate(item.start_time);
        const end = formatDate(item.end_time || new Date(new Date(item.start_time).getTime() + 60*60*1000).toISOString());
        const details = encodeURIComponent(`Interview with ${item.company} via Pani AI.`);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inbox</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your interviews, assessments, and messages.</p>
                </div>

                <Card className="bg-card border-border/60 min-h-[500px]">
                    {/* Tabs */}
                    <div className="flex border-b border-border/60 px-4">
                        {TABS.map((label, idx) => (
                            <button
                                key={label}
                                onClick={() => setTab(idx)}
                                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === idx ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                {label}
                                {idx === 1 && interviewCount > 0 && (
                                    <span className="inline-flex items-center justify-center h-4 w-4 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                                        {interviewCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : displayed.length === 0 ? (
                            <p className="text-center py-16 text-muted-foreground text-sm">No items in this category.</p>
                        ) : (
                            <ul className="divide-y divide-border/50">
                                {displayed.map((item) => {
                                    const { bg, color, Icon } = getItemStyle(item);
                                    const isPrimary = item.action === 'Join Meeting';
                                    return (
                                        <li key={item.id} className={`flex gap-3 px-4 sm:px-5 py-4 hover:bg-muted/20 transition-colors ${item.status === 'Unread' ? 'bg-primary/5' : ''}`}>
                                            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                                    <p className="font-semibold text-foreground text-sm">{item.company}</p>
                                                    {item.status === 'Unread' && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-400/10 text-rose-400 border border-rose-400/30 uppercase">New</span>
                                                    )}
                                                    <span className="px-1.5 py-0.5 text-[10px] rounded border border-border text-muted-foreground uppercase">{item.type}</span>
                                                </div>
                                                <p className="text-sm text-foreground/90">{item.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" /> {item.date}
                                                    <span>·</span>
                                                    <span>{item.status}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    {item.type === 'interview' && item.start_time && (
                                                        <Button size="sm" variant="outline" onClick={() => window.open(generateGoogleCalendarUrl(item), '_blank')} className="shrink-0 gap-1.5 text-xs h-8">
                                                            <CalendarPlus className="h-3.5 w-3.5" />
                                                            Calendar
                                                        </Button>
                                                    )}
                                                    {item.type !== 'interview' && (
                                                        <Button size="sm" variant={isPrimary ? 'default' : 'outline'} onClick={() => handleAction(item)} className="shrink-0 h-8 text-xs">
                                                            {item.action}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Chat Modal */}
            {openChat && chatTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <ChatInterface otherUserId={chatTarget.id} otherUserName={chatTarget.name} />
                        <div className="flex justify-end px-4 py-3 border-t border-border/60">
                            <Button variant="ghost" size="sm" onClick={() => setOpenChat(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
