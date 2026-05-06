import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Search, Loader2, Eye, MessageSquare, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { insertAuditLog } from '../../utils/auditLog';

interface SupportTicket {
    id: string;
    submitter_id: string;
    subject: string;
    body: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    admin_reply: string | null;
    created_at: string;
    updated_at: string;
    profiles: { full_name: string; email: string; role: string; } | null;
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
type PriorityFilter = 'all' | 'high' | 'urgent';

const statusBadge = (status: string) => {
    switch (status) {
        case 'open':        return <Badge className="bg-blue-400/10 text-blue-400 border-blue-400/30 capitalize">{status}</Badge>;
        case 'in_progress': return <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/30">In Progress</Badge>;
        case 'resolved':    return <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/30 capitalize">{status}</Badge>;
        default:            return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
};

const priorityBadge = (priority: string) => {
    switch (priority) {
        case 'urgent': return <Badge variant="destructive" className="capitalize">{priority}</Badge>;
        case 'high':   return <Badge className="bg-orange-400/10 text-orange-400 border-orange-400/30 capitalize">{priority}</Badge>;
        case 'low':    return <Badge variant="outline" className="capitalize">{priority}</Badge>;
        default:       return <Badge variant="secondary" className="capitalize">{priority}</Badge>;
    }
};

const roleBadgeVariant = (role: string) => {
    if (role === 'employer') return 'secondary';
    if (role === 'admin') return 'destructive';
    return 'outline';
};

export default function AdminSupport() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [filtered, setFiltered] = useState<SupportTicket[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [draftStatus, setDraftStatus] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        fetchTickets();
    }, []);

    async function fetchTickets() {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*, profiles!support_tickets_submitter_id_fkey(full_name, email, role)')
            .order('created_at', { ascending: false });
        if (data) setTickets(data as unknown as SupportTicket[]);
        if (error) console.error(error);
        setLoading(false);
    }

    useEffect(() => {
        let result = tickets;
        if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter);
        if (priorityFilter !== 'all') result = result.filter((t) => t.priority === priorityFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (t) =>
                    t.subject?.toLowerCase().includes(q) ||
                    t.profiles?.full_name?.toLowerCase().includes(q) ||
                    t.profiles?.email?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [tickets, search, statusFilter, priorityFilter]);

    const openTicket = (t: SupportTicket) => {
        setSelected(t);
        setReplyText(t.admin_reply ?? '');
        setDraftStatus(t.status);
    };

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        const { error } = await supabase
            .from('support_tickets')
            .update({ status: draftStatus, admin_reply: replyText || null })
            .eq('id', selected.id);
        if (!error) {
            setTickets((prev) =>
                prev.map((t) =>
                    t.id === selected.id
                        ? { ...t, status: draftStatus as SupportTicket['status'], admin_reply: replyText || null }
                        : t
                )
            );
            await insertAuditLog(user!.id, 'update_ticket', 'ticket', selected.id, {
                status: draftStatus,
                subject: selected.subject,
            });
            setSelected(null);
            toast('Ticket updated successfully', 'success');
        } else {
            toast('Failed to update ticket', 'error');
        }
        setSaving(false);
    };

    const openCount = tickets.filter((t) => t.status === 'open').length;
    const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
    const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Support</h1>
                    <p className="text-muted-foreground mt-1">Manage support requests from platform users.</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Open', value: openCount, icon: AlertCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                        { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { label: 'Total', value: tickets.length, icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-400/10' },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <Card key={label} className="bg-card border-border/60">
                            <CardContent className="pt-5 pb-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">{label}</p>
                                        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
                                    </div>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                                        <Icon className={`h-5 w-5 ${color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by subject, name, or email..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground self-center mr-1">Status:</span>
                        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                            <Button
                                key={s}
                                variant={statusFilter === s ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(s)}
                                className="capitalize"
                            >
                                {s === 'in_progress' ? 'In Progress' : s}
                            </Button>
                        ))}
                        <span className="text-xs text-muted-foreground self-center ml-2 mr-1">Priority:</span>
                        {(['all', 'high', 'urgent'] as const).map((p) => (
                            <Button
                                key={p}
                                variant={priorityFilter === p ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPriorityFilter(p)}
                                className="capitalize"
                            >
                                {p}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <Card className="bg-card border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {filtered.length} Ticket{filtered.length !== 1 ? 's' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">No tickets found.</div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/30">
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Subject</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">From</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Priority</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Status</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Submitted</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((t) => (
                                                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-4 font-medium max-w-xs truncate">{t.subject}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-medium">{t.profiles?.full_name || '—'}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">{t.profiles?.email || '—'}</span>
                                                                {t.profiles?.role && (
                                                                    <Badge variant={roleBadgeVariant(t.profiles.role)} className="capitalize text-[10px]">
                                                                        {t.profiles.role}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">{priorityBadge(t.priority)}</td>
                                                    <td className="px-6 py-4">{statusBadge(t.status)}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {new Date(t.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openTicket(t)}>
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden flex flex-col divide-y divide-border/50">
                                    {filtered.map((t) => (
                                        <div key={t.id} className="px-4 py-4 flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-semibold text-foreground text-sm flex-1 truncate">{t.subject}</p>
                                                <div className="flex gap-1 shrink-0">
                                                    {priorityBadge(t.priority)}
                                                    {statusBadge(t.status)}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {t.profiles?.full_name || '—'} · {t.profiles?.email || '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                                            <Button variant="outline" size="sm" className="self-start h-8 text-xs gap-1" onClick={() => openTicket(t)}>
                                                <Eye className="h-3.5 w-3.5" />View
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Support Ticket</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-3">
                                <p className="font-semibold text-foreground">{selected.subject}</p>
                                <div className="flex gap-1.5 shrink-0">
                                    {priorityBadge(selected.priority)}
                                    {statusBadge(selected.status)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">From</p>
                                    <p className="mt-0.5 font-medium">{selected.profiles?.full_name || '—'}</p>
                                    <p className="text-xs text-muted-foreground">{selected.profiles?.email || '—'}</p>
                                    {selected.profiles?.role && (
                                        <Badge variant={roleBadgeVariant(selected.profiles.role)} className="capitalize text-[10px] mt-1">
                                            {selected.profiles.role}
                                        </Badge>
                                    )}
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Submitted</p>
                                    <p className="mt-0.5">{new Date(selected.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Message</p>
                                <div className="rounded-lg bg-muted/40 border border-border/60 p-3 text-sm text-foreground whitespace-pre-wrap">
                                    {selected.body}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="ticket-status" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Update Status
                                </Label>
                                <Select value={draftStatus} onValueChange={setDraftStatus}>
                                    <SelectTrigger id="ticket-status" className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="admin-reply" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Admin Reply
                                </Label>
                                <Textarea
                                    id="admin-reply"
                                    placeholder="Write a reply to the user..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Cancel</Button>
                                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
