import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface UserRecord {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    location?: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [filtered, setFiltered] = useState<UserRecord[]>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'candidate' | 'employer' | 'admin'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, created_at, location')
                .order('created_at', { ascending: false });
            if (data) setUsers(data);
            if (error) console.error(error);
            setLoading(false);
        }
        fetchUsers();
    }, []);

    useEffect(() => {
        let result = users;
        if (roleFilter !== 'all') result = result.filter((u) => u.role === roleFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (u) =>
                    u.full_name?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [users, search, roleFilter]);

    const roleBadgeVariant = (role: string) => {
        if (role === 'admin') return 'destructive';
        if (role === 'employer') return 'secondary';
        return 'outline';
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
                    <p className="text-muted-foreground mt-1">View and manage all platform users.</p>
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
                        {(['all', 'candidate', 'employer', 'admin'] as const).map((r) => (
                            <Button
                                key={r}
                                variant={roleFilter === r ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setRoleFilter(r)}
                                className="capitalize"
                            >
                                {r}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <Card className="bg-card border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {filtered.length} User{filtered.length !== 1 ? 's' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">No users found.</div>
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
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Location</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((user) => (
                                                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                                {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <span className="font-medium">{user.full_name || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={roleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">{user.location || '—'}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden flex flex-col divide-y divide-border/50">
                                    {filtered.map((user) => (
                                        <div key={user.id} className="px-4 py-4 flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-foreground text-sm truncate">{user.full_name || '—'}</p>
                                                    <Badge variant={roleBadgeVariant(user.role)} className="capitalize text-[10px] shrink-0">{user.role}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {user.location || '—'} · {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
