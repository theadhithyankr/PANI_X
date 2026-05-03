import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Bell, Database, Globe, Palette } from 'lucide-react';

const SETTING_SECTIONS = [
    {
        icon: Globe,
        title: 'General',
        description: 'Platform name, contact email, and regional preferences.',
        items: ['Platform Name: PANI', 'Contact Email: admin@pani.com', 'Region: Global', 'Timezone: UTC'],
    },
    {
        icon: Bell,
        title: 'Notifications',
        description: 'Configure system-wide notification behavior.',
        items: [
            'New user registration alerts: Enabled',
            'Job posting alerts: Enabled',
            'Application milestone alerts: Enabled',
            'System health alerts: Enabled',
        ],
    },
    {
        icon: Database,
        title: 'Data Management',
        description: 'Database and storage configuration.',
        items: [
            'Database: PostgreSQL / Supabase',
            'File Storage: Supabase Storage',
            'Resume Retention: 90 days (inactive)',
            'Log Retention: 30 days',
        ],
    },
    {
        icon: Palette,
        title: 'Content Moderation',
        description: 'Rules and policies for content on the platform.',
        items: [
            'Job posting review: Auto-approved',
            'Flagged content: Manual review required',
            'Spam detection: Enabled',
            'Profanity filter: Enabled',
        ],
    },
];

export default function AdminSettings() {
    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="hidden md:block">
                    <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
                    <p className="text-muted-foreground mt-1">Platform configuration and content moderation policies.</p>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {SETTING_SECTIONS.map(({ icon: Icon, title, description, items }) => (
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
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                    Settings are managed via environment configuration and Supabase project settings.
                    Contact your system administrator to modify these values.
                </p>
            </div>
        </AdminLayout>
    );
}
