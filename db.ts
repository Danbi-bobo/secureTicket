import { supabase } from './supabaseClient';
import { Project, User, Role, Ticket, Message, MessageStatus, AuditLogEntry, TicketStatus } from './types';

function mapRole(dbRole: string): Role {
  switch (dbRole) {
    case 'member': return Role.MEMBER;
    case 'mediator': return Role.MEDIATOR;
    case 'admin': return Role.ADMIN;
    default: return Role.MEMBER;
  }
}

function mapTicketStatus(dbStatus: string): TicketStatus {
  switch (dbStatus) {
    case 'pending_approval': return TicketStatus.PENDING_APPROVAL;
    case 'assigned': return TicketStatus.ASSIGNED;
    case 'in_progress': return TicketStatus.IN_PROGRESS;
    case 'waiting_feedback': return TicketStatus.WAITING_FEEDBACK;
    case 'pending_close_approval': return TicketStatus.PENDING_CLOSE_APPROVAL;
    case 'closed': return TicketStatus.CLOSED;
    case 'rejected': return TicketStatus.REJECTED;
    default: return TicketStatus.PENDING_APPROVAL;
  }
}

function mapMessageStatus(dbStatus: string): MessageStatus {
  switch (dbStatus) {
    case 'pending_approval': return MessageStatus.PENDING_APPROVAL;
    case 'approved': return MessageStatus.APPROVED;
    case 'rejected': return MessageStatus.REJECTED;
    case 'edited': return MessageStatus.EDITED;
    default: return MessageStatus.PENDING_APPROVAL;
  }
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('id,name');
  if (error) {
    console.error('fetchProjects error', error);
    return [];
  }
  return (data ?? []).map(p => ({ id: p.id, name: p.name }));
}

export async function fetchUsers(): Promise<User[]> {
  const { data: users, error: usersErr } = await supabase.from('users').select('id,name,is_admin');
  if (usersErr) {
    console.error('fetchUsers error', usersErr);
    return [];
  }
  const { data: memberships, error: memErr } = await supabase.from('memberships').select('id,user_id,project_id,role');
  if (memErr) {
    console.error('fetchUsers memberships error', memErr);
  }
  const userIdToMemberships: Record<string, { projectId: string; role: Role }[]> = {};
  (memberships ?? []).forEach(m => {
    const list = userIdToMemberships[m.user_id] ?? [];
    list.push({ projectId: m.project_id, role: mapRole(m.role as string) });
    userIdToMemberships[m.user_id] = list;
  });
  return (users ?? []).map(u => ({
    id: u.id,
    name: u.name,
    isAdmin: u.is_admin ?? false,
    memberships: userIdToMemberships[u.id] ?? []
  }));
}

export async function fetchTickets(): Promise<Ticket[]> {
  const { data: tickets, error: tErr } = await supabase
    .from('tickets')
    .select('id,project_id,title,description,original_description,status,querent_id,responder_id,mediator_id,created_at,updated_at,closed_at');
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

  const ticketIdToMessages: Record<string, Message[]> = {};
  (messages ?? []).forEach(m => {
    const list = ticketIdToMessages[m.ticket_id] ?? [];
    list.push({
      id: m.id,
      senderId: m.sender_id,
      content: m.content,
      originalContent: m.original_content ?? undefined,
      status: mapMessageStatus(m.status as string),
      timestamp: new Date(m.timestamp)
    });
    ticketIdToMessages[m.ticket_id] = list;
  });

  const ticketIdToAudit: Record<string, AuditLogEntry[]> = {};
  (audit ?? []).forEach(a => {
    const list = ticketIdToAudit[a.ticket_id] ?? [];
    list.push({
      id: a.id,
      userId: a.user_id,
      role: mapRole(a.role as string),
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
    status: mapTicketStatus(t.status as string),
    querentId: t.querent_id,
    responderId: t.responder_id ?? undefined,
    mediatorId: t.mediator_id,
    createdAt: new Date(t.created_at),
    updatedAt: new Date(t.updated_at),
    closedAt: t.closed_at ? new Date(t.closed_at) : undefined,
    messages: ticketIdToMessages[t.id] ?? [],
    auditLog: ticketIdToAudit[t.id] ?? []
  }));
}


