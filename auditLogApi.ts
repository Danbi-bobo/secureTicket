import { supabase } from './supabaseClient';
import { Role } from './types';
import { mapRoleToDb } from './db';

export async function insertAuditLog(
  ticketId: string,
  userId: string,
  role: Role,
  action: string,
  details: string
): Promise<boolean> {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      ticket_id: ticketId,
      user_id: userId,
      role: mapRoleToDb(role),
      action: action,
      details: details,
      timestamp: new Date().toISOString(),
    });

  if (error) {
    console.error('insertAuditLog error', error);
    return false;
  }

  return true;
}
