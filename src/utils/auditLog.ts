import { supabase } from './supabase/client';

export async function insertAuditLog(
    adminId: string,
    action: string,
    targetType: 'user' | 'job' | 'ticket' | 'setting' | 'system',
    targetId?: string,
    details?: Record<string, unknown>
) {
    await supabase.from('admin_audit_logs').insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId ?? null,
        details: details ?? {},
    });
}
