import { supabase } from './supabase/client';

export interface SuspiciousUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    is_suspended: boolean;
    reasons: string[];
    risk_level: 'low' | 'medium' | 'high';
}

const TEMP_EMAIL_DOMAINS = [
    'mailinator.com', 'guerrillamail.com', 'yopmail.com', 'tempmail.com',
    'throwam.com', 'fakeinbox.com', 'trashmail.com', 'sharklasers.com',
    'grr.la', 'spam4.me', 'maildrop.cc', 'dispostable.com', '10minutemail.com',
    'guerrillamail.info', 'byom.de', 'trashmail.at', 'trashmail.io',
];

function emailReasons(email: string): string[] {
    const reasons: string[] = [];
    const lower = email.toLowerCase();
    const atIndex = lower.indexOf('@');
    if (atIndex === -1) return ['Invalid email format'];
    const local = lower.slice(0, atIndex);
    const domain = lower.slice(atIndex + 1);

    if (TEMP_EMAIL_DOMAINS.includes(domain)) reasons.push('Disposable email domain');
    if (/\d{5,}/.test(local)) reasons.push('Email has excessive numbers');
    // High-entropy local part: long, no vowel runs, looks random
    if (local.length >= 10 && !/[aeiou]{2,}/.test(local) && /^[a-z0-9]+$/.test(local)) {
        reasons.push('Email looks auto-generated');
    }
    return reasons;
}

function nameReasons(name: string | null | undefined): string[] {
    if (!name || name.trim().length === 0) return ['No name set'];
    const t = name.trim();
    const reasons: string[] = [];
    if (t.length < 3) reasons.push('Name too short');
    if (/^\d+$/.test(t)) reasons.push('Name is all numbers');
    if (/^(test|fake|dummy|user|admin|null|undefined|sample|bot|robot|temp)\s*\d*$/i.test(t)) {
        reasons.push('Name looks like a test/bot account');
    }
    return reasons;
}

export async function detectSuspiciousUsers(): Promise<SuspiciousUser[]> {
    // Only flag accounts that are at least 3 days old
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);

    const [profilesRes, appsRes, jobsRes] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, full_name, email, role, created_at, is_suspended')
            .neq('role', 'admin'),
        supabase.from('applications').select('candidate_id'),
        supabase.from('jobs').select('employer_id'),
    ]);

    const profiles = profilesRes.data ?? [];
    const appliedIds = new Set((appsRes.data ?? []).map((a: any) => a.candidate_id));
    const postedIds = new Set((jobsRes.data ?? []).map((j: any) => j.employer_id));

    const result: SuspiciousUser[] = [];

    for (const p of profiles) {
        const reasons: string[] = [];
        const isOld = new Date(p.created_at) < cutoff;

        reasons.push(...emailReasons(p.email ?? ''));
        reasons.push(...nameReasons(p.full_name));

        if (isOld) {
            if (p.role === 'candidate' && !appliedIds.has(p.id)) {
                reasons.push('No applications in 3+ days (inactive candidate)');
            }
            if (p.role === 'employer' && !postedIds.has(p.id)) {
                reasons.push('No jobs posted in 3+ days (inactive employer)');
            }
        }

        if (reasons.length > 0) {
            result.push({
                id: p.id,
                full_name: p.full_name ?? '',
                email: p.email ?? '',
                role: p.role,
                created_at: p.created_at,
                is_suspended: p.is_suspended ?? false,
                reasons,
                risk_level: reasons.length >= 3 ? 'high' : reasons.length === 2 ? 'medium' : 'low',
            });
        }
    }

    return result.sort((a, b) => {
        const o = { high: 0, medium: 1, low: 2 };
        return o[a.risk_level] - o[b.risk_level];
    });
}
