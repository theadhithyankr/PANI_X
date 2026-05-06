import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ShieldCheck, Lock, KeyRound, AlertTriangle, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface AuditLog {
    id: string;
    action: string;
    target_type: string;
    target_id: string | null;
    details: Record<string, unknown>;
    created_at: string;
    profiles: { full_name: string; email: string; } | null;
}

const SECURITY_SECTIONS = [
    {
        icon: Lock,
        title: 'Access Control',
        description: 'Role-based access control policies.',
        items: [
            'Admin: Full access to all resources',
            'Employer: Access to own jobs, candidates, and applications',
            'Candidate: Access to own profile and applications',
            'Public: Access to job listings only',
        ],
    },
    {
        icon: KeyRound,
        title: 'Authentication',
        description: 'Authentication methods and session settings.',
        items: [
            'Auth Provider: Supabase Auth',
            'Session expiry: 1 week',
            'Password policy: Min 8 characters',
            'Email verification: Required',
        ],
    },
    {
        icon: AlertTriangle,
        title: 'Threat Detection',
        description: 'Active security monitoring settings.',
        items: [
            'Brute-force protection: Enabled',
            'Rate limiting: Supabase default',
            'SQL injection guard: RLS policies enforced',
            'XSS protection: React sanitization active',
        ],
    },
    {
        icon: Eye,
        title: 'Audit & Compliance',
        description: 'Logging and compliance configuration.',
        items: [
            'Auth events: Logged by Supabase',
            'Admin actions: Logged to admin_audit_logs',
            'GDPR compliance: User data deletion supported',
            'Data encryption: TLS in transit, AES-256 at rest',
        ],
    },
];

const targetTypeBadgeClass = (type: string) => {
    switch (type) {
        case 'user':    return 'bg-violet-400/10 text-violet-400 border-violet-400/30';
        case 'job':     return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30';
        case 'ticket':  return 'bg-blue-400/10 text-blue-400 border-blue-400/30';
        case 'setting': return 'bg-amber-400/10 text-amber-400 border-amber-400/30';
        default:        return 'bg-rose-400/10 text-rose-400 border-rose-400/30';
    }
};

export default function AdminSecurity() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            const { data, error } = await supabase
                .from('admin_audit_logs')
                .select('id, action, target_type, target_id, details, created_at, profiles!admin_audit_logs_admin_id_fkey(full_name, email)')
                .order('created_at', { ascending: false })
                .limit(100);
            if (data) setLogs(data as unknown as AuditLog[]);
            if (error) console.error(error);
            setLoadingLogs(false);
        }
        fetchLogs();
    }, []);

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                <div className="hidden md:block">
                    <h1 className="text-3xl font-bold text-foreground">Security & Compliance</h1>
                    <p className="text-muted-foreground mt-1">Platform security configuration and compliance overview.</p>
                </div>

                {/* Security Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {SECURITY_SECTIONS.map(({ icon: Icon, title, description, items }) => (
                        <Card key={title} className="bg-card border-border/60">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-primary" />
                                    {title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">{description}</p>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {items.map((item) => (
                                        <li key={item} className="flex items-center gap-2 text-sm">
                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Admin Audit Log */}
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-4">Admin Audit Log</h2>
                    <Card className="bg-card border-border/60">
                        <CardContent className="p-0">
                            {loadingLogs ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-sm">
                                    No audit events recorded yet.
                                </div>
                            ) : (
                                <>
                                    {/* Desktop table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border bg-muted/30">
                                                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Admin</th>
                                                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Action</th>
                                                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Target Type</th>
                                                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Target ID</th>
                                                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logs.map((log) => (
                                                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <p className="font-medium text-foreground">{log.profiles?.full_name || '—'}</p>
                                                            <p className="text-xs text-muted-foreground">{log.profiles?.email || '—'}</p>
                                                        </td>
                                                        <td className="px-6 py-3 font-mono text-xs text-foreground">{log.action}</td>
                                                        <td className="px-6 py-3">
                                                            <Badge className={`capitalize text-xs ${targetTypeBadgeClass(log.target_type)}`}>
                                                                {log.target_type}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-3 text-muted-foreground font-mono text-xs">
                                                            {log.target_id ? log.target_id.slice(0, 8) + '…' : '—'}
                                                        </td>
                                                        <td className="px-6 py-3 text-muted-foreground text-xs">
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile cards */}
                                    <div className="md:hidden flex flex-col divide-y divide-border/50">
                                        {logs.map((log) => (
                                            <div key={log.id} className="px-4 py-3 flex flex-col gap-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono text-xs font-medium text-foreground">{log.action}</span>
                                                    <Badge className={`capitalize text-[10px] ${targetTypeBadgeClass(log.target_type)}`}>
                                                        {log.target_type}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {log.profiles?.full_name || '—'} · {log.profiles?.email || '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
