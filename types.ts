
export enum Role {
  MEMBER = 'Member',
  MEDIATOR = 'Mediator',
  ADMIN = 'Admin',
}

export enum TicketStatus {
  PENDING_APPROVAL = 'Pending Approval',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  WAITING_FEEDBACK = 'Waiting for Feedback',
  PENDING_CLOSE_APPROVAL = 'Pending Close Approval',
  CLOSED = 'Closed',
  REJECTED = 'Rejected',
}

export enum MessageStatus {
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  EDITED = 'Edited',
}

export interface Project {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  memberships: {
    projectId: string;
    role: Role;
  }[];
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  originalContent?: string;
  status: MessageStatus;
  timestamp: Date;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  role: Role;
  action: string;
  details: string;
  timestamp: Date;
}

export interface Ticket {
  id: number;
  projectId: string;
  title: string;
  description: string;
  originalDescription?: string;
  files?: File[];
  status: TicketStatus;
  querentId: string;
  responderId?: string;
  mediatorId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  auditLog: AuditLogEntry[];
}