import React, { useState } from 'react';
import { Ticket, User, Role, TicketStatus, MessageStatus, Message, AuditLogEntry } from '../types';
import { ArrowUturnLeftIcon, SendIcon, CheckIcon, XMarkIcon, PencilIcon, UserIcon, LockClosedIcon } from './icons';
import AuditLog from './AuditLog';
import MessageBubble from './MessageBubble';

interface TicketDetailProps {
  ticket: Ticket;
  currentUser: User;
  currentUserRole?: Role;
  onBack: () => void;
  onUpdateTicket: (ticketId: number, updates: Partial<Ticket>) => void;
  onAddMessage: (ticketId: number, senderId: string, content: string, status: MessageStatus) => void;
  onUpdateMessage: (ticketId: number, messageId: string, updates: Partial<Message>) => void;
  onAddAuditLog: (ticketId: number, userId: string, role: Role, action: string, details: string) => void;
  users: User[];
  findUser: (id: string) => User | undefined;
}

const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket, currentUser, currentUserRole, onBack, onUpdateTicket, onAddMessage, onUpdateMessage, onAddAuditLog, users, findUser
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<{ id: string, content: string } | null>(null);
  const [editingTicket, setEditingTicket] = useState<{ title: string, description: string } | null>(null);
  const [selectedResponder, setSelectedResponder] = useState(ticket.responderId || '');
  const [isReopening, setIsReopening] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenAssignee, setReopenAssignee] = useState('');
  
  const isTicketLocked = ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.REJECTED;

  const handleApproveTicket = () => {
    if (!currentUserRole) return;
    if (!selectedResponder) {
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUserRole) return;
    const status = currentUserRole === Role.MEDIATOR ? MessageStatus.APPROVED : MessageStatus.PENDING_APPROVAL;
    onAddMessage(ticket.id, currentUser.id, newMessage, status);
    
    if (currentUser.id === ticket.querentId) {
        onUpdateTicket(ticket.id, { status: TicketStatus.IN_PROGRESS });
    } else if (currentUser.id === ticket.responderId) {
        onUpdateTicket(ticket.id, { status: TicketStatus.WAITING_FEEDBACK });
    }
    
    onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'SEND_MESSAGE', `Message sent (Status: ${status}).`);
    setNewMessage('');
  };
  
  const handleMessageAction = (messageId: string, action: 'approve' | 'reject' | 'edit', newContent?: string) => {
    const message = ticket.messages.find(m => m.id === messageId);
    if(!message || !currentUserRole) return;
    
    if (action === 'approve') {
      onUpdateMessage(ticket.id, messageId, { status: MessageStatus.APPROVED });
      onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'APPROVE_MESSAGE', `Message approved.`);
    } else if (action === 'reject') {
      onUpdateMessage(ticket.id, messageId, { status: MessageStatus.REJECTED });
      onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'REJECT_MESSAGE', `Message rejected.`);
    } else if (action === 'edit' && newContent) {
      onUpdateMessage(ticket.id, messageId, { content: newContent, status: MessageStatus.EDITED });
      onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'EDIT_MESSAGE', `Message edited and approved.`);
      setEditingMessage(null);
    }
  };

  const handleChangeResponder = () => {
     if (!currentUserRole) return;
     if (!selectedResponder || selectedResponder === ticket.responderId) {
         alert("Please select a new member to assign.");
         return;
     }
     onUpdateTicket(ticket.id, { responderId: selectedResponder });
     onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'CHANGE_ASSIGNEE', `The assigned Member has been changed.`);
  }

  const handleRequestCloseTicket = () => {
      if (!currentUserRole || currentUser.id !== ticket.querentId) return;
      onUpdateTicket(ticket.id, { status: TicketStatus.PENDING_CLOSE_APPROVAL });
      onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'REQUEST_CLOSE', `Creator requested to close ticket.`);
  };

  const handleForceCloseTicket = () => {
    if (currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN) {
        onUpdateTicket(ticket.id, { status: TicketStatus.CLOSED });
        onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'CLOSE_TICKET', `Mediator/Admin closed the ticket.`);
    }
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

  const handleReopenTicket = () => {
    if (!reopenReason.trim() || !currentUserRole) {
        alert("A reason is required to reopen the ticket.");
        return;
    }

    if (currentUser.id === ticket.querentId) {
        onUpdateTicket(ticket.id, { status: TicketStatus.PENDING_APPROVAL });
        onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'REOPEN', `Ticket reopened by Creator. Reason: ${reopenReason}`);
    } else if (currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN) {
        if (!reopenAssignee) {
            alert("Please select a member to assign the reopened ticket to.");
            return;
        }
        onUpdateTicket(ticket.id, { status: TicketStatus.ASSIGNED, responderId: reopenAssignee });
        onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'REOPEN', `Ticket reopened by ${currentUserRole}. Reason: ${reopenReason}`);
    }
    setIsReopening(false);
    setReopenReason('');
    setReopenAssignee('');
  };
  
  const membersInProject = users.filter(u => 
    u.memberships.some(m => m.projectId === ticket.projectId && m.role === Role.MEMBER) &&
    u.id !== ticket.querentId
  );
  
  const isCreator = currentUser.id === ticket.querentId;
  const canReopen = isTicketLocked && (isCreator || currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN);

  const renderTicketHeader = () => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-t-lg border-b dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">#{ticket.id}: {ticket.title}</h2>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {ticket.description}
          </div>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${ {
            [TicketStatus.PENDING_APPROVAL]: 'bg-yellow-100 text-yellow-800',
            [TicketStatus.ASSIGNED]: 'bg-blue-100 text-blue-800',
            [TicketStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800',
            [TicketStatus.WAITING_FEEDBACK]: 'bg-purple-100 text-purple-800',
            [TicketStatus.PENDING_CLOSE_APPROVAL]: 'bg-orange-100 text-orange-800',
            [TicketStatus.CLOSED]: 'bg-green-100 text-green-800',
            [TicketStatus.REJECTED]: 'bg-red-100 text-red-800',
          }[ticket.status]}`}>
          {ticket.status}
        </span>
      </div>
    </div>
  );

  const renderMediatorActions = () => {
    if (currentUserRole !== Role.MEDIATOR || isTicketLocked) return null;

    if (ticket.status === TicketStatus.PENDING_APPROVAL) {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-gray-700/50 flex flex-col sm:flex-row items-center gap-4">
          <h3 className="text-lg font-semibold flex-shrink-0">Review Ticket</h3>
          <select value={selectedResponder} onChange={e => setSelectedResponder(e.target.value)} className="flex-grow p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
            <option value="">-- Select Member to Assign --</option>
            {membersInProject.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleApproveTicket} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"><CheckIcon className="w-5 h-5"/>Approve & Assign</button>
            <button onClick={handleRejectTicket} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"><XMarkIcon className="w-5 h-5"/>Reject</button>
          </div>
        </div>
      );
    }

    if (ticket.status === TicketStatus.PENDING_CLOSE_APPROVAL) {
      return (
          <div className="p-4 bg-orange-50 dark:bg-gray-700/50 flex flex-col sm:flex-row items-center gap-4 justify-between">
              <h3 className="text-lg font-semibold">Review Closure Request</h3>
              <div className="flex gap-2">
                  <button onClick={handleApproveClosure} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"><CheckIcon className="w-5 h-5"/>Approve Closure</button>
                  <button onClick={handleRejectClosure} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"><XMarkIcon className="w-5 h-5"/>Reject</button>
              </div>
          </div>
      );
    }
    
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold flex-shrink-0">Change Assignee</h3>
            <select value={selectedResponder} onChange={e => setSelectedResponder(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                {membersInProject.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button onClick={handleChangeResponder} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Change</button>
          </div>
          <button onClick={handleForceCloseTicket} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"><LockClosedIcon className="w-5 h-5"/> Force Close Ticket</button>
      </div>
    );
  };
  
  const renderReopenForm = () => (
    <div className="p-4 border-t dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
        <h3 className="font-semibold text-lg mb-2">Reopen Ticket</h3>
        <textarea
            value={reopenReason}
            onChange={e => setReopenReason(e.target.value)}
            placeholder="Please provide a reason for reopening this ticket..."
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 mb-2"
            rows={3}
        />
        {(currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN) && (
          <select value={reopenAssignee} onChange={e => setReopenAssignee(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 mb-2">
              <option value="">-- Select Member to Assign --</option>
              {membersInProject.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <div className="flex justify-end gap-2">
            <button onClick={() => setIsReopening(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-500 rounded-md">Cancel</button>
            <button onClick={handleReopenTicket} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Submit</button>
        </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
      <div className="p-4 border-b dark:border-gray-700">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              <ArrowUturnLeftIcon className="w-4 h-4"/>
              Back to Ticket List
          </button>
      </div>
      
      {renderTicketHeader()}
      {renderMediatorActions()}

      <div className="flex flex-col lg:flex-row">
        <div className="flex-grow lg:w-2/3 p-6 space-y-4 h-[60vh] overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
          {ticket.messages.map(msg => (
             <MessageBubble
                key={msg.id}
                message={msg}
                currentUser={currentUser}
                currentUserRole={currentUserRole}
                ticket={ticket}
                findUser={findUser}
                onMessageAction={handleMessageAction}
             />
          ))}
          {ticket.messages.length === 0 && ticket.status !== TicketStatus.PENDING_APPROVAL && (
            <div className="text-center text-gray-500 pt-16">No messages yet.</div>
          )}
        </div>
        <div className="lg:w-1/3 border-l dark:border-gray-700">
          <AuditLog 
            auditLog={ticket.auditLog} 
            findUser={findUser} 
            currentUserRole={currentUserRole}
          />
        </div>
      </div>
      
      {isReopening && renderReopenForm()}

      {!isTicketLocked && !isReopening && ticket.status !== TicketStatus.PENDING_APPROVAL && ticket.status !== TicketStatus.PENDING_CLOSE_APPROVAL && (
        <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-grow px-4 py-2 border rounded-full dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={handleSendMessage}
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-300"
              disabled={!newMessage.trim()}
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
       
       {!isTicketLocked && !isReopening && isCreator && ticket.status !== TicketStatus.PENDING_CLOSE_APPROVAL && (
         <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-600 text-center">
            <button onClick={handleRequestCloseTicket} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Request to Close Ticket</button>
         </div>
       )}
       
       {isTicketLocked && !isReopening && (
        <div className="p-4 text-center bg-gray-100 dark:bg-gray-700 border-t dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-400 font-medium flex items-center justify-center gap-2"><LockClosedIcon className="w-5 h-5"/> This ticket is closed. No further messages can be sent.</p>
           {canReopen && (
             <button onClick={() => setIsReopening(true)} className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Reopen Ticket</button>
           )}
        </div>
      )}
    </div>
  );
};

export default TicketDetail;