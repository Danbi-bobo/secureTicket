import React, { useState } from 'react';
import { Ticket, TicketStatus, User, Role, Project, MessageStatus, Message } from '../types';
import { ClockIcon, CheckIcon, XMarkIcon } from './icons';

interface TicketListProps {
  tickets: Ticket[];
  sourceTicketsForCounts: Ticket[];
  onSelectTicket: (id: number) => void;
  users: User[];
  currentUser: User;
  currentUserRole?: Role;
  statusFilter: TicketStatus | 'all';
  setStatusFilter: (status: TicketStatus | 'all') => void;
  responderFilter: string | 'all';
  setResponderFilter: (responderId: string | 'all') => void;
  projectId: string | null;
  projects?: Project[];
  onUpdateTicket: (ticketId: number, updates: Partial<Ticket>) => void;
  onUpdateMessage: (ticketId: number, messageId: string, updates: Partial<Message>) => void;
  onAddAuditLog: (ticketId: number, userId: string, role: Role, action: string, details: string) => void;
}

const TicketStatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const statusStyles: { [key in TicketStatus]: string } = {
    [TicketStatus.PENDING_APPROVAL]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [TicketStatus.ASSIGNED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [TicketStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    [TicketStatus.WAITING_FEEDBACK]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    [TicketStatus.PENDING_CLOSE_APPROVAL]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [TicketStatus.CLOSED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [TicketStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

const TicketList: React.FC<TicketListProps> = ({ 
    tickets, 
    sourceTicketsForCounts,
    onSelectTicket, 
    users, 
    currentUser,
    currentUserRole,
    statusFilter,
    setStatusFilter,
    responderFilter,
    setResponderFilter,
    projectId,
    projects,
    onUpdateTicket,
    onUpdateMessage,
    onAddAuditLog,
 }) => {
  
  const [assigneeSelections, setAssigneeSelections] = useState<{ [key: number]: string }>({});
  
  const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'N/A';
  
  const handleClearFilters = () => {
    setStatusFilter('all');
    setResponderFilter('all');
  };

  const isMediatorOrAdmin = currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN;
  
  const membersForFilter = React.useMemo(() => {
    if (projects) {
        const allMembers = users.filter(u => 
            u.memberships.some(m => m.role === Role.MEMBER)
        );
        return Array.from(new Map(allMembers.map(item => [item.id, item])).values());
    }
    return users.filter(u =>
        u.memberships.some(m => m.projectId === projectId && m.role === Role.MEMBER)
    );
  }, [users, projectId, projects]);

  const renderFilters = () => {
    if (!isMediatorOrAdmin) return null;

    const statusCounts = sourceTicketsForCounts.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
    }, {} as Record<TicketStatus, number>);

    const tabs = [
        { id: 'all', name: 'All Tickets', count: sourceTicketsForCounts.length },
        ...Object.values(TicketStatus).map(status => ({
            id: status,
            name: status,
            count: statusCounts[status] || 0
        }))
    ];

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id as TicketStatus | 'all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full flex items-center gap-2 transition-colors ${
                            statusFilter === tab.id
                                ? 'bg-indigo-600 text-white shadow'
                                : 'bg-white text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {tab.name}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                            statusFilter === tab.id
                                ? 'bg-indigo-400 text-white'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-100'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="responder-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Member:</label>
                    <select
                        id="responder-filter"
                        value={responderFilter}
                        onChange={(e) => setResponderFilter(e.target.value as string | 'all')}
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
                    >
                        <option value="all">All Members</option>
                        {membersForFilter.map(responder => (
                            <option key={responder.id} value={responder.id}>{responder.name}</option>
                        ))}
                    </select>
                </div>

                {(responderFilter !== 'all') && (
                    <button
                        onClick={() => setResponderFilter('all')}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                    >
                        Clear Member Filter
                    </button>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {renderFilters()}
      {tickets.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No tickets found.</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">There are currently no tickets matching your criteria.</p>
        </div>
      ) : (
        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
          {tickets.map(ticket => {
             const project = projects?.find(p => p.id === ticket.projectId);
             const pendingMessage = ticket.messages.find(m => m.status === MessageStatus.PENDING_APPROVAL);

             const membersForAssignment = users.filter(u =>
                u.memberships.some(m => m.projectId === ticket.projectId && m.role === Role.MEMBER) &&
                u.id !== ticket.querentId
             );

             const handleApproveTicket = () => {
                const selectedResponder = assigneeSelections[ticket.id];
                if (!selectedResponder || !currentUserRole) {
                    alert("Please select a member to assign the ticket to.");
                    return;
                }
                onUpdateTicket(ticket.id, { status: TicketStatus.ASSIGNED, responderId: selectedResponder });
                onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'APPROVE & ASSIGN', `Ticket approved and assigned to a Member.`);
             };

            const handleRejectTicket = () => {
                if (!currentUserRole) return;
                onUpdateTicket(ticket.id, { status: TicketStatus.REJECTED });
                onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'REJECT', 'Ticket was rejected.');
            };

            const handleMessageAction = (messageId: string, action: 'approve' | 'reject') => {
                if (!currentUserRole) return;
                const actionText = action === 'approve' ? 'approved' : 'rejected';
                onUpdateMessage(ticket.id, messageId, { status: action === 'approve' ? MessageStatus.APPROVED : MessageStatus.REJECTED });
                onAddAuditLog(ticket.id, currentUser.id, currentUserRole, `${action.toUpperCase()}_MESSAGE`, `Message ${actionText}.`);
            };

            const handleApproveClosure = () => {
              if (!currentUserRole) return;
              onUpdateTicket(ticket.id, { status: TicketStatus.CLOSED });
              onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'APPROVE_CLOSE', 'Ticket closure approved.');
            };

            const handleRejectClosure = () => {
                if (!currentUserRole) return;
                onUpdateTicket(ticket.id, { status: TicketStatus.IN_PROGRESS });
                onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'REJECT_CLOSE', 'Ticket closure request rejected.');
            };

             return (
            <li key={ticket.id} className="transition-colors duration-200">
              <div
                onClick={() => onSelectTicket(ticket.id)}
                className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-4">
                     <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        Ticket #{ticket.id}
                     </p>
                     {project && <p className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">{project.name}</p>}
                   </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white truncate mt-1">
                    {ticket.title}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <TicketStatusBadge status={ticket.status} />
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>Last updated: {new Date(ticket.updatedAt).toLocaleString()}</span>
                </div>
                {isMediatorOrAdmin && (
                    <div className="mt-2 sm:mt-0">
                        <span>Creator: {getUserName(ticket.querentId)}</span>
                        <span className="mx-2">|</span>
                        <span>Assigned: {getUserName(ticket.responderId)}</span>
                    </div>
                )}
              </div>
              </div>

              {currentUserRole === Role.MEDIATOR && ticket.status === TicketStatus.PENDING_APPROVAL && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800/30">
                  <h4 className="font-semibold text-sm text-yellow-800 dark:text-yellow-300 mb-2">Review Ticket</h4>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <select 
                      value={assigneeSelections[ticket.id] || ''}
                      onChange={e => setAssigneeSelections(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      className="flex-grow p-2 text-sm border rounded-md dark:bg-gray-600 dark:border-gray-500 w-full"
                    >
                      <option value="">-- Assign a Member --</option>
                      {membersForAssignment.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <div className="flex gap-2 w-full sm:w-auto self-stretch">
                      <button 
                        disabled={!assigneeSelections[ticket.id]} 
                        onClick={handleApproveTicket} 
                        className="flex-1 px-3 py-2 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 flex items-center justify-center gap-1"
                      >
                        <CheckIcon className="w-4 h-4"/> Approve & Assign
                      </button>
                      <button onClick={handleRejectTicket} className="flex-1 px-3 py-2 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center gap-1">
                        <XMarkIcon className="w-4 h-4"/> Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {currentUserRole === Role.MEDIATOR && pendingMessage && ticket.status !== TicketStatus.PENDING_APPROVAL && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-200 dark:border-indigo-800/30">
                  <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-300 mb-2">Pending Message from <span className="font-bold">{getUserName(pendingMessage.senderId)}</span></h4>
                  <blockquote className="p-3 rounded-md bg-white dark:bg-gray-700 text-sm italic border-l-4 border-indigo-300 dark:border-indigo-600">"{pendingMessage.content}"</blockquote>
                  <div className="flex gap-2 mt-3 justify-end">
                    <button onClick={() => handleMessageAction(pendingMessage.id, 'approve')} className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1">
                      <CheckIcon className="w-4 h-4"/> Approve
                    </button>
                    <button onClick={() => handleMessageAction(pendingMessage.id, 'reject')} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1">
                      <XMarkIcon className="w-4 h-4"/> Reject
                    </button>
                  </div>
                </div>
              )}
              
              {currentUserRole === Role.MEDIATOR && ticket.status === TicketStatus.PENDING_CLOSE_APPROVAL && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-t border-orange-200 dark:border-orange-800/30">
                    <h4 className="font-semibold text-sm text-orange-800 dark:text-orange-300 mb-2">Review Closure Request</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">The creator has requested to close this ticket.</p>
                    <div className="flex gap-2 justify-end">
                        <button onClick={handleApproveClosure} className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1">
                            <CheckIcon className="w-4 h-4"/> Approve Closure
                        </button>
                        <button onClick={handleRejectClosure} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1">
                            <XMarkIcon className="w-4 h-4"/> Reject
                        </button>
                    </div>
                </div>
              )}

            </li>
          )})}
        </ul>
      )}
    </div>
  );
};

export default TicketList;
