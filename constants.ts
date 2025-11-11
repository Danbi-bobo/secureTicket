
import { Role, TicketStatus, MessageStatus, User, Ticket, Project } from './types';

export const PROJECTS: Project[] = [
  { id: 'proj_hr', name: 'HR Department' },
  { id: 'proj_it', name: 'IT Support' },
];

export const USERS: User[] = [
  {
    id: 'user_admin_1',
    name: 'Edwin (Admin)',
    memberships: [
      { projectId: 'proj_hr', role: Role.ADMIN },
      { projectId: 'proj_it', role: Role.ADMIN },
    ],
  },
  {
    id: 'user_querent_1',
    name: 'Alice',
    memberships: [
      { projectId: 'proj_hr', role: Role.QUERENT },
      { projectId: 'proj_it', role: Role.QUERENT },
    ],
  },
  {
    id: 'user_responder_1',
    name: 'Bob',
    memberships: [{ projectId: 'proj_it', role: Role.RESPONDER }],
  },
  {
    id: 'user_responder_2',
    name: 'Charlie',
    memberships: [{ projectId: 'proj_hr', role: Role.RESPONDER }],
  },
  {
    id: 'user_mediator_1',
    name: 'Diana',
    memberships: [
      { projectId: 'proj_hr', role: Role.MEDIATOR },
      { projectId: 'proj_it', role: Role.MEDIATOR },
    ],
  },
];


export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 101,
    projectId: 'proj_hr',
    title: 'Salary Information Inquiry',
    description: 'I would like to inquire about the salary adjustment policy for this year. Can you provide details on the process and timeline?',
    originalDescription: 'I would like to inquire about the salary adjustment policy for this year. Can you provide details on the process and timeline?',
    status: TicketStatus.PENDING_APPROVAL,
    querentId: 'user_querent_1',
    mediatorId: 'user_mediator_1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    messages: [],
    auditLog: [
      { id: 'log_1_1', userId: 'user_querent_1', role: Role.QUERENT, action: 'CREATE', details: 'Ticket created.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 102,
    projectId: 'proj_it',
    title: 'Project Alpha Deadline Extension',
    description: 'We need to discuss extending the deadline for Project Alpha. What are the steps to formally request this?',
    status: TicketStatus.IN_PROGRESS,
    querentId: 'user_querent_1',
    responderId: 'user_responder_1',
    mediatorId: 'user_mediator_1',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    messages: [
      { id: 'msg_2_1', senderId: 'user_querent_1', content: 'We need to discuss extending the deadline for Project Alpha. What are the steps to formally request this?', status: MessageStatus.APPROVED, timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000) },
      { id: 'msg_2_2', senderId: 'user_responder_1', content: 'To request an extension, please fill out Form-XF-102 and submit it to the project board for review. I have attached the form for your convenience.', status: MessageStatus.APPROVED, timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000) },
      { id: 'msg_2_3', senderId: 'user_querent_1', content: 'Thank you. I have submitted the form. How long does the review process usually take?', status: MessageStatus.PENDING_APPROVAL, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
    ],
    auditLog: [
      { id: 'log_2_1', userId: 'user_querent_1', role: Role.QUERENT, action: 'CREATE', details: 'Ticket created.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { id: 'log_2_2', userId: 'user_mediator_1', role: Role.MEDIATOR, action: 'ASSIGN', details: 'Ticket assigned to Bob.', timestamp: new Date(Date.now() - 23.5 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 103,
    projectId: 'proj_hr',
    title: 'Work From Home Policy Clarification',
    description: 'Is the new hybrid work policy mandatory for all departments?',
    status: TicketStatus.CLOSED,
    querentId: 'user_querent_1',
    responderId: 'user_responder_2',
    mediatorId: 'user_mediator_1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    messages: [
       { id: 'msg_3_1', senderId: 'user_querent_1', content: 'Is the new hybrid work policy mandatory for all departments?', status: MessageStatus.APPROVED, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
       { id: 'msg_3_2', senderId: 'user_responder_2', content: 'Yes, the policy applies to all departments, but exceptions can be made with direct manager approval.', status: MessageStatus.APPROVED, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
    ],
    auditLog: [
      { id: 'log_3_1', userId: 'user_querent_1', role: Role.QUERENT, action: 'CREATE', details: 'Ticket created.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { id: 'log_3_2', userId: 'user_mediator_1', role: Role.MEDIATOR, action: 'ASSIGN', details: 'Ticket assigned to Charlie.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 10000) },
      { id: 'log_3_3', userId: 'user_querent_1', role: Role.QUERENT, action: 'CLOSE', details: 'Ticket closed by querent, approved by mediator.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    ],
  },
];
