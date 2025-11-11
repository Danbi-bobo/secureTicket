
import React from 'react';
import { Ticket, TicketStatus, User, Role } from '../types';
import { ClockIcon } from './icons';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (id: number) => void;
  users: User[];
  currentUser: User;
  currentUserRole?: Role;
  statusFilter: TicketStatus | 'all';
  setStatusFilter: (status: TicketStatus | 'all') => void;
  responderFilter: string | 'all';
  setResponderFilter: (responderId: string | 'all') => void;
  projectId: string | null;
}

const TicketStatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const statusStyles: { [key in TicketStatus]: string } = {
    [TicketStatus.PENDING_APPROVAL]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [TicketStatus.ASSIGNED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [TicketStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    [TicketStatus.WAITING_FEEDBACK]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
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
    onSelectTicket, 
    users, 
    currentUser,
    currentUserRole,
    statusFilter,
    setStatusFilter,
    responderFilter,
    setResponderFilter,
    projectId,
 }) => {
  
  const getUserName = (id?: string) => users.find(u => u.id === id)?.name || 'N/A';
  
  const handleClearFilters = () => {
    setStatusFilter('all');
    setResponderFilter('all');
  };

  const isMediatorOrAdmin = currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN;

  const respondersInProject = users.filter(u => 
    u.memberships.some(m => m.projectId === projectId && m.role === Role.RESPONDER)
  );

  const renderFilters = () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
        >
          <option value="all">All Statuses</option>
          {Object.values(TicketStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {isMediatorOrAdmin && (
        <div className="flex items-center gap-2">
          <label htmlFor="responder-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Responder:</label>
          <select
            id="responder-filter"
            value={responderFilter}
            onChange={(e) => setResponderFilter(e.target.value as string | 'all')}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
          >
            <option value="all">All Responders</option>
            {respondersInProject.map(responder => (
              <option key={responder.id} value={responder.id}>{responder.name}</option>
            ))}
          </select>
        </div>
      )}

      {(statusFilter !== 'all' || (isMediatorOrAdmin && responderFilter !== 'all')) && (
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {renderFilters()}
      {tickets.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No tickets found.</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">There are currently no tickets in this project matching your criteria.</p>
        </div>
      ) : (
        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
          {tickets.map(ticket => (
            <li
              key={ticket.id}
              onClick={() => onSelectTicket(ticket.id)}
              className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Ticket #{ticket.id}
                  </p>
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
                        <span>Querent: {getUserName(ticket.querentId)}</span>
                        <span className="mx-2">|</span>
                        <span>Responder: {getUserName(ticket.responderId)}</span>
                    </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TicketList;
