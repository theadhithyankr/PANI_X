import { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
    Video, FileText, Mail, CheckCircle2, Clock, Loader2,
    CalendarPlus, MailOpen, Trash2
} from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import { useInboxContext } from '../contexts/InboxContext';

const TABS = ['All', 'Interviews', 'Messages'];

function getItemStyle(item: any) {
    if (item.type === 'interview') return { bg: 'bg-violet-400/10', color: 'text-violet-400', Icon: Video };
    if (item.status?.toLowerCase().includes('offer')) return { bg: 'bg-emerald-400/10', color: 'text-emerald-400', Icon: CheckCircle2 };
    if (item.status?.toLowerCase().includes('rejected')) return { bg: 'bg-rose-400/10', color: 'text-rose-400', Icon: Mail };
    if (item.type === 'test') return { bg: 'bg-amber-400/10', color: 'text-amber-400', Icon: FileText };
    return { bg: 'bg-blue-400/10', color: 'text-blue-400', Icon: Mail };
}

function InboxContent() {
    const { inboxItems, loading, markApplicationAsViewed, markDirectMessagesAsRead, toggleItemRead, deleteItem } = useInboxContext();
    const [tab, setTab] = useState(0);
    const [openChat, setOpenChat] = useState(false);
    const [chatTarget, setChatTarget] = useState<{ id: string; name: string } | null>(null);

    const interviewCount = inboxItems.filter(i => i.type === 'interview').length;

    const displayed = inboxItems.filter(item => {
        if (tab === 1) return item.type === 'interview';
        if (tab === 2) return item.type === 'message';
        return true;
    });

    const handleAction = (item: any) => {
        if (item.id.startsWith('app-') && !item.isRead) {
            markApplicationAsViewed(item.id.replace('app-', ''));
        }
        if ((item.type === 'message' || item.action === 'Message') && item.senderId) {
            if (!item.isRead) markDirectMessagesAsRead(item.senderId);
            setChatTarget({ id: item.senderId, name: item.company });
            setOpenChat(true);
        }
    };

    const generateGoogleCalendarUrl = (item: any) => {
        const title = encodeURIComponent(item.title);
        const fmt = (d: string) => d ? new Date(d).toISOString().replace(/-|:|\.\d\d\d/g, '') : '';
        const start = fmt(item.start_time);
        const end = fmt(item.end_time || new Date(new Date(item.start_time).getTime() + 3600000).toISOString());
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${encodeURIComponent(`Interview with ${item.company} via Pani AI.`)}`;
    };

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inbox</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your interviews, assessments, and messages.</p>
                </div>

                <Card className="bg-card border-border/60 min-h-[500px]">
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
                                    return (
                                        <li key={item.id} className={`flex gap-3 px-4 sm:px-5 py-4 hover:bg-muted/20 transition-colors ${!item.isRead ? 'bg-primary/5' : ''}`}>
                                            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                                    <p className="font-semibold text-foreground text-sm">{item.company}</p>
                                                    {!item.isRead && (
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

                                                {/* Action buttons */}
                                                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                                    {/* Primary action */}
                                                    {item.type === 'interview' && item.start_time && (
                                                        <Button size="sm" variant="outline" onClick={() => window.open(generateGoogleCalendarUrl(item), '_blank')} className="h-8 px-3 text-xs gap-1.5 rounded-lg border-border/60 hover:border-primary/50 hover:text-primary transition-colors">
                                                            <CalendarPlus className="h-3.5 w-3.5" />
                                                            Add to Calendar
                                                        </Button>
                                                    )}
                                                    {item.type !== 'interview' && (
                                                        <Button size="sm" variant="outline" onClick={() => handleAction(item)} className="h-8 px-3 text-xs rounded-lg border-border/60 hover:border-primary/50 hover:text-primary transition-colors">
                                                            {item.action}
                                                        </Button>
                                                    )}

                                                    {/* Separator */}
                                                    <div className="w-px h-4 bg-border/60 mx-0.5" />

                                                    {/* Mark read / unread */}
                                                    <button
                                                        onClick={() => toggleItemRead(item, !item.isRead)}
                                                        className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                                    >
                                                        {item.isRead
                                                            ? <><Mail className="h-3.5 w-3.5" /> Mark unread</>
                                                            : <><MailOpen className="h-3.5 w-3.5" /> Mark read</>
                                                        }
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => deleteItem(item)}
                                                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                                                        title="Remove notification"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
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
        </>
    );
}

export default function Inbox() {
    return (
        <DashboardLayout>
            <InboxContent />
        </DashboardLayout>
    );
}
