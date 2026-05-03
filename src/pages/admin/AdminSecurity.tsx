import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ShieldCheck, Lock, KeyRound, AlertTriangle, Eye } from 'lucide-react';

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
            'Data access logs: Available in Supabase dashboard',
            'GDPR compliance: User data deletion supported',
            'Data encryption: TLS in transit, AES-256 at rest',
        ],
    },
];

export default function AdminSecurity() {
    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                {/* Header */}
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

                <p className="text-xs text-muted-foreground mt-2">
                    Security policies are enforced at the database level via Supabase Row Level Security (RLS).
                    Review the Supabase dashboard for full audit logs.
                </p>
            </div>
        </AdminLayout>
    );
}
