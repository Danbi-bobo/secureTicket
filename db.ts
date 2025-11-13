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

function mapMessageStatusToDb(status: MessageStatus): string {
  switch (status) {
    case MessageStatus.PENDING_APPROVAL: return 'pending_approval';
    case MessageStatus.APPROVED: return 'approved';
    case MessageStatus.REJECTED: return 'rejected';
    case MessageStatus.EDITED: return 'edited';
    default: return 'pending_approval';
  }
}

function mapTicketStatusToDb(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.PENDING_APPROVAL: return 'pending_approval';
    case TicketStatus.ASSIGNED: return 'assigned';
    case TicketStatus.IN_PROGRESS: return 'in_progress';
    case TicketStatus.WAITING_FEEDBACK: return 'waiting_feedback';
    case TicketStatus.PENDING_CLOSE_APPROVAL: return 'pending_close_approval';
    case TicketStatus.CLOSED: return 'closed';
    case TicketStatus.REJECTED: return 'rejected';
    default: return 'pending_approval';
  }
}

export function mapRoleToDb(role: Role): string {
  switch (role) {
    case Role.MEMBER: return 'member';
    case Role.MEDIATOR: return 'mediator';
    case Role.ADMIN: return 'admin';
    default: return 'member';
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

  // Filter messages theo ticketIds để tối ưu performance và đảm bảo RLS
  const { data: messages, error: mErr } = await supabase
    .from('messages')
    .select('id,ticket_id,sender_id,content,original_content,status,timestamp')
    .in('ticket_id', ticketIds);
  if (mErr) {
    console.error('fetchTickets messages error', mErr);
  }

  // Filter audit logs theo ticketIds
  const { data: audit, error: aErr } = await supabase
    .from('audit_logs')
    .select('id,ticket_id,user_id,role,action,details,timestamp')
    .in('ticket_id', ticketIds);
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

export async function insertProject(name: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name })
    .select('id, name')
    .single();

  if (error) {
    console.error('insertProject error', error);
    return null;
  }

  return data ? { id: data.id, name: data.name } : null;
}

export async function insertMembership(userId: string, projectId: string, role: string): Promise<boolean> {
  const { error } = await supabase
    .from('memberships')
    .insert({
      user_id: userId,
      project_id: projectId,
      role: role.toLowerCase()
    });

  if (error) {
    console.error('insertMembership error', error);
    return false;
  }

  return true;
}

export async function updateUserMemberships(userId: string, memberships: { projectId: string; role: Role }[]): Promise<boolean> {
  // Xóa tất cả memberships cũ
  const { error: deleteErr } = await supabase
    .from('memberships')
    .delete()
    .eq('user_id', userId);

  if (deleteErr) {
    console.error('updateUserMemberships delete error', deleteErr);
    return false;
  }

  // Insert memberships mới
  if (memberships.length > 0) {
    const { error: insertErr } = await supabase
      .from('memberships')
      .insert(
        memberships.map(m => ({
          user_id: userId,
          project_id: m.projectId,
          role: m.role.toLowerCase()
        }))
      );

    if (insertErr) {
      console.error('updateUserMemberships insert error', insertErr);
      return false;
    }
  }

  return true;
}

export async function insertTicket(
  ticket: {
    id: string;
    projectId: string;
    title: string;
    description: string;
    originalDescription?: string;
    status: TicketStatus;
    querentId: string;
    responderId?: string;
    mediatorId: string;
  },
  auditLog: {
    userId: string;
    role: Role;
    action: string;
    details: string;
  }
): Promise<Ticket | null> {
  const now = new Date().toISOString();
  
  // Insert ticket
  const { data: ticketData, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      id: ticket.id,
      project_id: ticket.projectId,
      title: ticket.title,
      description: ticket.description,
      original_description: ticket.originalDescription ?? ticket.description,
      status: mapTicketStatusToDb(ticket.status),
      querent_id: ticket.querentId,
      responder_id: ticket.responderId ?? null,
      mediator_id: ticket.mediatorId,
      created_at: now,
      updated_at: now,
      closed_at: null
    })
    .select('id,project_id,title,description,original_description,status,querent_id,responder_id,mediator_id,created_at,updated_at,closed_at')
    .single();

  if (ticketError) {
    console.error('insertTicket error', ticketError);
    return null;
  }

  if (!ticketData) {
    return null;
  }

  // Insert audit log
  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      ticket_id: ticket.id,
      user_id: auditLog.userId,
      role: mapRoleToDb(auditLog.role),
      action: auditLog.action,
      details: auditLog.details,
      timestamp: now,
    });

  if (auditError) {
    console.error('insertTicket audit log error', auditError);
    // Ticket was created but audit log failed - still return the ticket
  }

  // Return the ticket in the same format as fetchTickets
  return {
    id: ticketData.id,
    projectId: ticketData.project_id,
    title: ticketData.title,
    description: ticketData.description,
    originalDescription: ticketData.original_description ?? undefined,
    status: mapTicketStatus(ticketData.status as string),
    querentId: ticketData.querent_id,
    responderId: ticketData.responder_id ?? undefined,
    mediatorId: ticketData.mediator_id,
    createdAt: new Date(ticketData.created_at),
    updatedAt: new Date(ticketData.updated_at),
    closedAt: ticketData.closed_at ? new Date(ticketData.closed_at) : undefined,
    messages: [],
    auditLog: [{
      id: `log_${Date.now()}`,
      userId: auditLog.userId,
      role: auditLog.role,
      action: auditLog.action,
      details: auditLog.details,
      timestamp: new Date(now)
    }]
  };
}

export async function updateTicket(
  ticketId: string,
  updates: {
    status?: TicketStatus;
    responderId?: string;
    title?: string;
    description?: string;
    originalDescription?: string;
    closedAt?: Date | null;
  }
): Promise<boolean> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) {
    updateData.status = mapTicketStatusToDb(updates.status);
  }

  if (updates.responderId !== undefined) {
    updateData.responder_id = updates.responderId || null;
  }

  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }

  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }

  if (updates.originalDescription !== undefined) {
    updateData.original_description = updates.originalDescription || null;
  }

  if (updates.closedAt !== undefined) {
    updateData.closed_at = updates.closedAt ? updates.closedAt.toISOString() : null;
  }

  const { error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId);

  if (error) {
    console.error('updateTicket error', error);
    return false;
  }

  return true;
}

export async function insertMessage(
  ticketId: string,
  senderId: string,
  content: string,
  status: MessageStatus,
  originalContent?: string
): Promise<Message | null> {
  const now = new Date().toISOString();
  const messageId = crypto.randomUUID();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: messageId,
      ticket_id: ticketId,
      sender_id: senderId,
      content: content,
      original_content: originalContent ?? content,
      status: mapMessageStatusToDb(status),
      timestamp: now,
    })
    .select('id,ticket_id,sender_id,content,original_content,status,timestamp')
    .single();

  if (error) {
    console.error('insertMessage error', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    senderId: data.sender_id,
    content: data.content,
    originalContent: data.original_content ?? undefined,
    status: mapMessageStatus(data.status as string),
    timestamp: new Date(data.timestamp)
  };
}

export async function updateMessage(
  messageId: string,
  updates: {
    content?: string;
    originalContent?: string;
    status?: MessageStatus;
  }
): Promise<boolean> {
  const updateData: any = {};

  if (updates.content !== undefined) {
    updateData.content = updates.content;
  }

  if (updates.originalContent !== undefined) {
    updateData.original_content = updates.originalContent || null;
  }

  if (updates.status !== undefined) {
    updateData.status = mapMessageStatusToDb(updates.status);
  }

  const { error } = await supabase
    .from('messages')
    .update(updateData)
    .eq('id', messageId);

  if (error) {
    console.error('updateMessage error', error);
    return false;
  }

  return true;
}