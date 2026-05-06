import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Search, Loader2, UserX, UserCheck, Eye, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { insertAuditLog } from '../../utils/auditLog';
import { detectSuspiciousUsers, SuspiciousUser } from '../../utils/suspiciousUsers';

interface UserRecord {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    location?: string;
    is_suspended: boolean;
    // injected after suspicious detection
    suspicious?: SuspiciousUser;
}

type RoleFilter = 'all' | 'candidate' | 'employer' | 'admin' | 'suspended' | 'suspicious';

const riskBadgeClass = (level: 'low' | 'medium' | 'high') => {
    if (level === 'high') return 'bg-red-500/10 text-red-500 border-red-500/30';
    if (level === 'medium') return 'bg-orange-400/10 text-orange-400 border-orange-400/30';
    return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30';
};

export default function AdminUsers() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [filtered, setFiltered] = useState<UserRecord[]>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [loading, setLoading] = useState(true);
    const [suspiciousMap, setSuspiciousMap] = useState<Map<string, SuspiciousUser>>(new Map());
    const [loadingSuspicious, setLoadingSuspicious] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
    const { user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, created_at, location, is_suspended')
            .order('created_at', { ascending: false });
        if (data) setUsers(data);
        if (error) console.error(error);
        setLoading(false);
    }

    // Load suspicious data when filter is selected
    useEffect(() => {
        if (roleFilter === 'suspicious' && suspiciousMap.size === 0) {
            setLoadingSuspicious(true);
            detectSuspiciousUsers()
                .then((list) => {
                    const map = new Map<string, SuspiciousUser>();
                    list.forEach((s) => map.set(s.id, s));
                    setSuspiciousMap(map);
                })
                .catch(console.error)
                .finally(() => setLoadingSuspicious(false));
        }
    }, [roleFilter]);

    useEffect(() => {
        let result = users;
        if (roleFilter === 'suspended') {
            result = result.filter((u) => u.is_suspended);
        } else if (roleFilter === 'suspicious') {
            result = result.filter((u) => suspiciousMap.has(u.id));
        } else if (roleFilter !== 'all') {
            result = result.filter((u) => u.role === roleFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (u) =>
                    u.full_name?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q)
            );
        }
        setFiltered(result.map((u) => ({ ...u, suspicious: suspiciousMap.get(u.id) })));
    }, [users, search, roleFilter, suspiciousMap]);

    const roleBadgeVariant = (role: string) => {
        if (role === 'admin') return 'destructive';
        if (role === 'employer') return 'secondary';
        return 'outline';
    };

    const handleToggleSuspend = async (target: UserRecord) => {
        if (target.role === 'admin') {
            toast('Cannot suspend an admin user', 'error');
            return;
        }
        const newSuspended = !target.is_suspended;
        const { error } = await supabase.from('profiles').update({ is_suspended: newSuspended }).eq('id', target.id);
        if (!error) {
            setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, is_suspended: newSuspended } : u)));
            if (selectedUser?.id === target.id) setSelectedUser((p) => p ? { ...p, is_suspended: newSuspended } : null);
            await insertAuditLog(user!.id, newSuspended ? 'suspend_user' : 'activate_user', 'user', target.id, { email: target.email });
            toast(`User ${newSuspended ? 'suspended' : 'activated'} successfully`, 'success');
        } else {
            toast('Failed to update user status', 'error');
        }
    };

    const handleChangeRole = async (target: UserRecord, newRole: string) => {
        if (target.id === user?.id) {
            toast('Cannot change your own role', 'error');
            return;
        }
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', target.id);
        if (!error) {
            setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, role: newRole } : u)));
            if (selectedUser?.id === target.id) setSelectedUser((p) => p ? { ...p, role: newRole } : null);
            await insertAuditLog(user!.id, 'change_role', 'user', target.id, { from: target.role, to: newRole, email: target.email });
            toast(`Role updated to ${newRole}`, 'success');
        } else {
            toast('Failed to update role', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const { error } = await supabase.from('profiles').delete().eq('id', deleteTarget.id);
        if (!error) {
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            setSuspiciousMap((prev) => { const m = new Map(prev); m.delete(deleteTarget.id); return m; });
            if (selectedUser?.id === deleteTarget.id) setSelectedUser(null);
            await insertAuditLog(user!.id, 'delete_user', 'user', deleteTarget.id, { email: deleteTarget.email, role: deleteTarget.role });
            toast('User profile deleted', 'success');
        } else {
            toast('Failed to delete user', 'error');
        }
        setDeleteTarget(null);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
                    <p className="text-muted-foreground mt-1">View, manage, and flag suspicious platform users.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(['all', 'candidate', 'employer', 'admin', 'suspended', 'suspicious'] as const).map((r) => (
                            <Button
                                key={r}
                                variant={roleFilter === r ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setRoleFilter(r)}
                                className={`capitalize ${r === 'suspicious' && roleFilter !== 'suspicious' ? 'border-orange-400/50 text-orange-400 hover:bg-orange-400/10' : ''}`}
                            >
                                {r === 'suspicious' && <ShieldAlert className="h-3.5 w-3.5 mr-1" />}
                                {r}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Suspicious warning banner */}
                {roleFilter === 'suspicious' && (
                    <div className="flex items-start gap-3 rounded-lg border border-orange-400/30 bg-orange-400/5 px-4 py-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">
                            These users were flagged by automated checks. Review the reasons before taking action — some may be false positives.
                        </p>
                    </div>
                )}

                {/* Table */}
                <Card className="bg-card border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {loading || loadingSuspicious
                                ? 'Loading...'
                                : `${filtered.length} User${filtered.length !== 1 ? 's' : ''}`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading || loadingSuspicious ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                {roleFilter === 'suspicious' ? 'No suspicious users detected.' : 'No users found.'}
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/30">
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Name</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Email</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Role</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                                                    {roleFilter === 'suspicious' ? 'Flags' : 'Location'}
                                                </th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Joined</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((u) => (
                                                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                                {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{u.full_name || '—'}</span>
                                                                <div className="flex gap-1 mt-0.5 flex-wrap">
                                                                    {u.is_suspended && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                                                                    {u.suspicious && (
                                                                        <Badge className={`text-[10px] ${riskBadgeClass(u.suspicious.risk_level)}`}>
                                                                            {u.suspicious.risk_level} risk
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                                                    <td className="px-6 py-4">
                                                        <Select
                                                            value={u.role}
                                                            onValueChange={(val) => handleChangeRole(u, val)}
                                                            disabled={u.id === user?.id}
                                                        >
                                                            <SelectTrigger className="h-8 w-28 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="candidate">Candidate</SelectItem>
                                                                <SelectItem value="employer">Employer</SelectItem>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {roleFilter === 'suspicious' && u.suspicious ? (
                                                            <ul className="space-y-0.5">
                                                                {u.suspicious.reasons.map((r, i) => (
                                                                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                                                        <span className="text-orange-400 shrink-0">•</span>{r}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-muted-foreground">{u.location || '—'}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setSelectedUser(u)} title="View details">
                                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                            {u.role !== 'admin' && (
                                                                <>
                                                                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleToggleSuspend(u)}
                                                                        title={u.is_suspended ? 'Activate' : 'Suspend'}>
                                                                        {u.is_suspended
                                                                            ? <UserCheck className="h-4 w-4 text-emerald-500" />
                                                                            : <UserX className="h-4 w-4 text-rose-500" />}
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setDeleteTarget(u)} title="Delete profile">
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden flex flex-col divide-y divide-border/50">
                                    {filtered.map((u) => (
                                        <div key={u.id} className="px-4 py-4 flex flex-col gap-2">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                    {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-foreground text-sm truncate">{u.full_name || '—'}</p>
                                                        <Badge variant={roleBadgeVariant(u.role)} className="capitalize text-[10px] shrink-0">{u.role}</Badge>
                                                        {u.is_suspended && <Badge variant="destructive" className="text-[10px] shrink-0">Suspended</Badge>}
                                                        {u.suspicious && (
                                                            <Badge className={`text-[10px] shrink-0 ${riskBadgeClass(u.suspicious.risk_level)}`}>
                                                                {u.suspicious.risk_level} risk
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {u.location || '—'} · {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                                    </p>
                                                    {u.suspicious && (
                                                        <ul className="mt-1 space-y-0.5">
                                                            {u.suspicious.reasons.slice(0, 2).map((r, i) => (
                                                                <li key={i} className="text-xs text-orange-400 flex items-start gap-1">
                                                                    <span className="shrink-0">•</span>{r}
                                                                </li>
                                                            ))}
                                                            {u.suspicious.reasons.length > 2 && (
                                                                <li className="text-xs text-muted-foreground">+{u.suspicious.reasons.length - 2} more</li>
                                                            )}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap mt-1">
                                                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setSelectedUser(u)}>
                                                    <Eye className="h-3.5 w-3.5" /> View
                                                </Button>
                                                {u.role !== 'admin' && (
                                                    <>
                                                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => handleToggleSuspend(u)}>
                                                            {u.is_suspended
                                                                ? <><UserCheck className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-500">Activate</span></>
                                                                : <><UserX className="h-3.5 w-3.5 text-rose-500" /><span className="text-rose-500">Suspend</span></>}
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 text-destructive border-destructive/30" onClick={() => setDeleteTarget(u)}>
                                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* User Detail Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
                                    {selectedUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-base">{selectedUser.full_name || '—'}</p>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                        <Badge variant={roleBadgeVariant(selectedUser.role)} className="capitalize text-xs">{selectedUser.role}</Badge>
                                        {selectedUser.is_suspended && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                                        {selectedUser.suspicious && (
                                            <Badge className={`text-xs ${riskBadgeClass(selectedUser.suspicious.risk_level)}`}>
                                                {selectedUser.suspicious.risk_level} risk
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedUser.suspicious && (
                                <div className="rounded-lg border border-orange-400/30 bg-orange-400/5 p-3">
                                    <p className="text-xs font-semibold text-orange-400 mb-1.5 flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />Suspicious Activity Flags
                                    </p>
                                    <ul className="space-y-1">
                                        {selectedUser.suspicious.reasons.map((r, i) => (
                                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                                <span className="text-orange-400 shrink-0 mt-0.5">•</span>{r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Location</p>
                                    <p className="mt-0.5">{selectedUser.location || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Joined</p>
                                    <p className="mt-0.5">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '—'}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
                                {selectedUser.role !== 'admin' && (
                                    <>
                                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleToggleSuspend(selectedUser)}>
                                            {selectedUser.is_suspended
                                                ? <><UserCheck className="h-4 w-4 text-emerald-500" /><span className="text-emerald-500">Activate</span></>
                                                : <><UserX className="h-4 w-4 text-rose-500" /><span className="text-rose-500">Suspend</span></>}
                                        </Button>
                                        <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => { setSelectedUser(null); setDeleteTarget(selectedUser); }}>
                                            <Trash2 className="h-4 w-4" />Delete Profile
                                        </Button>
                                    </>
                                )}
                                {selectedUser.id !== user?.id && (
                                    <Select value={selectedUser.role} onValueChange={(val) => handleChangeRole(selectedUser, val)}>
                                        <SelectTrigger className="h-9 w-36 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="candidate">Candidate</SelectItem>
                                            <SelectItem value="employer">Employer</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete User Profile</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">
                            This will permanently remove <span className="font-semibold text-foreground">{deleteTarget?.full_name || deleteTarget?.email}</span>'s
                            profile and all their data (applications, messages, jobs). This cannot be undone.
                        </p>
                        <p className="text-xs text-muted-foreground rounded-md bg-muted/50 border border-border/60 px-3 py-2">
                            Note: The user's login account remains in Supabase Auth. To fully prevent re-registration, go to your Supabase dashboard → Authentication → Users.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
                                <Trash2 className="h-4 w-4" />Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
