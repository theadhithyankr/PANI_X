import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Bell, Database, Globe, Palette, Loader2, Pencil, Save, X } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { insertAuditLog } from '../../utils/auditLog';

type SettingsMap = Record<string, string>;

const SECTIONS = [
    {
        icon: Globe,
        title: 'General',
        description: 'Platform name, contact email, and regional preferences.',
        keys: [
            { key: 'platform_name', label: 'Platform Name' },
            { key: 'contact_email', label: 'Contact Email' },
            { key: 'region', label: 'Region' },
            { key: 'timezone', label: 'Timezone' },
        ],
    },
    {
        icon: Bell,
        title: 'Notifications',
        description: 'Configure system-wide notification behavior.',
        keys: [
            { key: 'notify_new_user', label: 'New user registration alerts' },
            { key: 'notify_new_job', label: 'Job posting alerts' },
            { key: 'notify_app_milestone', label: 'Application milestone alerts' },
            { key: 'notify_system_health', label: 'System health alerts' },
        ],
    },
    {
        icon: Database,
        title: 'Data Management',
        description: 'Database and storage configuration.',
        keys: [
            { key: 'resume_retention_days', label: 'Resume Retention (days, inactive)' },
            { key: 'log_retention_days', label: 'Log Retention (days)' },
        ],
    },
    {
        icon: Palette,
        title: 'Content Moderation',
        description: 'Rules and policies for content on the platform.',
        keys: [
            { key: 'job_posting_review', label: 'Job Posting Review Mode' },
            { key: 'spam_detection', label: 'Spam Detection' },
            { key: 'profanity_filter', label: 'Profanity Filter' },
        ],
    },
];

const BOOLEAN_KEYS = new Set([
    'notify_new_user', 'notify_new_job', 'notify_app_milestone',
    'notify_system_health', 'spam_detection', 'profanity_filter',
]);

export default function AdminSettings() {
    const [settings, setSettings] = useState<SettingsMap>({});
    const [draft, setDraft] = useState<SettingsMap>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        async function fetchSettings() {
            const { data, error } = await supabase.from('system_settings').select('key, value');
            if (data) {
                const map: SettingsMap = {};
                data.forEach(({ key, value }) => { map[key] = value; });
                setSettings(map);
            }
            if (error) console.error(error);
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const startEditing = () => {
        setDraft({ ...settings });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setDraft({});
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const changedKeys = Object.keys(draft).filter((k) => draft[k] !== settings[k]);
        if (changedKeys.length === 0) {
            setIsEditing(false);
            setSaving(false);
            return;
        }
        try {
            await Promise.all(
                changedKeys.map((key) =>
                    supabase
                        .from('system_settings')
                        .update({ value: draft[key], updated_by: user!.id })
                        .eq('key', key)
                )
            );
            const changedDetails: Record<string, unknown> = {};
            changedKeys.forEach((k) => { changedDetails[k] = { from: settings[k], to: draft[k] }; });
            await insertAuditLog(user!.id, 'update_settings', 'setting', undefined, changedDetails);
            setSettings({ ...settings, ...Object.fromEntries(changedKeys.map((k) => [k, draft[k]])) });
            setIsEditing(false);
            toast('Settings saved successfully', 'success');
        } catch {
            toast('Failed to save settings', 'error');
        }
        setSaving(false);
    };

    const currentValue = (key: string) => (isEditing ? draft[key] : settings[key]) ?? '';

    const renderValue = (key: string) => {
        const val = currentValue(key);
        if (BOOLEAN_KEYS.has(key)) {
            if (!isEditing) {
                return (
                    <span className={val === 'true' ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
                        {val === 'true' ? 'Enabled' : 'Disabled'}
                    </span>
                );
            }
            return (
                <Checkbox
                    checked={val === 'true'}
                    onCheckedChange={(checked) => setDraft((d) => ({ ...d, [key]: checked ? 'true' : 'false' }))}
                />
            );
        }
        if (!isEditing) return <span className="text-muted-foreground">{val || '—'}</span>;
        return (
            <Input
                value={val}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                className="h-8 text-sm max-w-xs"
            />
        );
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                <div className="hidden md:flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">System Configuration</h1>
                        <p className="text-muted-foreground mt-1">Platform configuration and content moderation policies.</p>
                    </div>
                    {!loading && (
                        isEditing ? (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={cancelEditing} className="gap-1.5">
                                    <X className="h-4 w-4" />Cancel
                                </Button>
                                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5">
                                <Pencil className="h-4 w-4" />Edit Settings
                            </Button>
                        )
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Mobile edit toggle */}
                        <div className="md:hidden flex justify-end">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={cancelEditing} className="gap-1.5">
                                        <X className="h-4 w-4" />Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5">
                                    <Pencil className="h-4 w-4" />Edit Settings
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {SECTIONS.map(({ icon: Icon, title, description, keys }) => (
                                <Card key={title} className="bg-card border-border/60">
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <Icon className="h-5 w-5 text-primary" />
                                            {title}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">{description}</p>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {keys.map(({ key, label }) => (
                                                <li key={key} className="flex items-center justify-between gap-3 text-sm">
                                                    <Label className="text-muted-foreground shrink-0">{label}</Label>
                                                    {renderValue(key)}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
