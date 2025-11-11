import { supabase } from './supabaseClient';
import { Project, User, Role, Ticket, Message, MessageStatus, AuditLogEntry, TicketStatus } from './types';

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('id,name');
  if (error) {
    console.error('fetchProjects error', error);
    return [];
  }
  return (data ?? []).map(p => ({ id: p.id, name: p.name }));
}

export async function fetchUsers(): Promise<User[]> {
  const { data: users, error: usersErr } = await supabase.from('users').select('id,name');
  if (usersErr) {
    console.error('fetchUsers error', usersErr);
    return [];
  }
  const { data: memberships, error: memErr } = await supabase.from('memberships').select('user_id,project_id,role');
  if (memErr) {
    console.error('fetchUsers memberships error', memErr);
  }
  const userIdToMemberships: Record<string, { projectId: string; role: Role }[]> = {};
  (memberships ?? []).forEach(m => {
    const list = userIdToMemberships[m.user_id] ?? [];
    list.push({ projectId: m.project_id, role: m.role as Role });
    userIdToMemberships[m.user_id] = list;
  });
  return (users ?? []).map(u => ({
    id: u.id,
    name: u.name,
    memberships: userIdToMemberships[u.id] ?? []
  }));
}

export async function fetchTickets(): Promise<Ticket[]> {
  const { data: tickets, error: tErr } = await supabase
    .from('tickets')
    .select('id,project_id,title,description,original_description,status,querent_id,responder_id,mediator_id,created_at,updated_at');
  if (tErr) {
    console.error('fetchTickets error', tErr);
    return [];
  }

  const ticketIds = (tickets ?? []).map(t => t.id);
  if (ticketIds.length === 0) return [];

  const { data: messages, error: mErr } = await supabase
    .from('messages')
    .select('id,ticket_id,sender_id,content,original_content,status,timestamp');
  if (mErr) {
    console.error('fetchTickets messages error', mErr);
  }

  const { data: audit, error: aErr } = await supabase
    .from('audit_logs')
    .select('id,ticket_id,user_id,role,action,details,timestamp');
  if (aErr) {
    console.error('fetchTickets audit error', aErr);
  }

  const ticketIdToMessages: Record<number, Message[]> = {};
  (messages ?? []).forEach(m => {
    const list = ticketIdToMessages[m.ticket_id] ?? [];
    list.push({
      id: m.id,
      senderId: m.sender_id,
      content: m.content,
      originalContent: m.original_content ?? undefined,
      status: m.status as MessageStatus,
      timestamp: new Date(m.timestamp)
    });
    ticketIdToMessages[m.ticket_id] = list;
  });

  const ticketIdToAudit: Record<number, AuditLogEntry[]> = {};
  (audit ?? []).forEach(a => {
    const list = ticketIdToAudit[a.ticket_id] ?? [];
    list.push({
      id: a.id,
      userId: a.user_id,
      role: a.role as Role,
      action: a.action,
      details: a.details,
      timestamp: new Date(a.timestamp)
    });
    ticketIdToAudit[a.ticket_id] = list;
  });

  return (tickets ?? []).map(t => ({
    id: t.id,
    projectId: t.project_id,
    title: t.title,
    description: t.description,
    originalDescription: t.original_description ?? undefined,
    status: t.status as TicketStatus,
    querentId: t.querent_id,
    responderId: t.responder_id ?? undefined,
    mediatorId: t.mediator_id,
    createdAt: new Date(t.created_at),
    updatedAt: new Date(t.updated_at),
    messages: ticketIdToMessages[t.id] ?? [],
    auditLog: ticketIdToAudit[t.id] ?? []
  }));
}


