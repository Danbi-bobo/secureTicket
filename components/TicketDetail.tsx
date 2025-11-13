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
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  onAddMessage: (ticketId: string, senderId: string, content: string, status: MessageStatus) => void;
  onUpdateMessage: (ticketId: string, messageId: string, updates: Partial<Message>) => void;
  onAddAuditLog: (ticketId: string, userId: string, role: Role, action: string, details: string) => void;
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserRole) return;
    const messageStatus = currentUserRole === Role.MEDIATOR ? MessageStatus.APPROVED : MessageStatus.PENDING_APPROVAL;
    
    // Lưu message content trước khi clear
    const messageContent = newMessage.trim();
    
    // Clear input ngay để có thể gõ message mới
    setNewMessage('');
    
    // Gửi message
    onAddMessage(ticket.id, currentUser.id, messageContent, messageStatus);
    
    // Chỉ cập nhật ticket status nếu message đã được APPROVED (mediator gửi)
    // Nếu message là PENDING_APPROVAL, sẽ cập nhật status khi message được approve
    if (messageStatus === MessageStatus.APPROVED) {
      let newTicketStatus: TicketStatus | undefined;
      if (currentUser.id === ticket.querentId) {
        // Querent gửi message đã approved -> chuyển sang IN_PROGRESS
        newTicketStatus = TicketStatus.IN_PROGRESS;
      } else if (ticket.responderId && currentUser.id === ticket.responderId) {
        // Responder gửi message đã approved -> chuyển sang WAITING_FEEDBACK
        newTicketStatus = TicketStatus.WAITING_FEEDBACK;
      }
      
      if (newTicketStatus) {
        onUpdateTicket(ticket.id, { status: newTicketStatus });
      }
    }
    
    onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'SEND_MESSAGE', `Message sent (Status: ${messageStatus}).`);
  };
  
  const handleMessageAction = (messageId: string, action: 'approve' | 'reject' | 'edit', newContent?: string) => {
    const message = ticket.messages.find(m => m.id === messageId);
    if(!message || !currentUserRole) return;
    
    if (action === 'approve') {
      onUpdateMessage(ticket.id, messageId, { status: MessageStatus.APPROVED });
      onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'APPROVE_MESSAGE', `Message approved.`);
      
      // Cập nhật ticket status khi message được approve
      // Dựa trên người gửi message để xác định status mới
      let newTicketStatus: TicketStatus | undefined;
      if (message.senderId === ticket.querentId) {
        // Message từ querent được approve -> chuyển sang IN_PROGRESS
        newTicketStatus = TicketStatus.IN_PROGRESS;
      } else if (ticket.responderId && message.senderId === ticket.responderId) {
        // Message từ responder được approve -> chuyển sang WAITING_FEEDBACK
        newTicketStatus = TicketStatus.WAITING_FEEDBACK;
      }
      
      if (newTicketStatus) {
        onUpdateTicket(ticket.id, { status: newTicketStatus });
      }
    } else if (action === 'reject') {
      onUpdateMessage(ticket.id, messageId, { status: MessageStatus.REJECTED });
      onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'REJECT_MESSAGE', `Message rejected.`);
    } else if (action === 'edit' && newContent) {
      onUpdateMessage(ticket.id, messageId, { content: newContent, status: MessageStatus.EDITED });
      onAddAuditLog(ticket.id, currentUser.id, currentUserRole, 'EDIT_MESSAGE', `Message edited and approved.`);
      setEditingMessage(null);
      
      // Khi edit message, cũng cập nhật ticket status như approve
      let newTicketStatus: TicketStatus | undefined;
      if (message.senderId === ticket.querentId) {
        newTicketStatus = TicketStatus.IN_PROGRESS;
      } else if (ticket.responderId && message.senderId === ticket.responderId) {
        newTicketStatus = TicketStatus.WAITING_FEEDBACK;
      }
      
      if (newTicketStatus) {
        onUpdateTicket(ticket.id, { status: newTicketStatus });
      }
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
    <div className="p-6 bg-gradient-to-r from-white to-indigo-50 rounded-t-lg border-b border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">#{ticket.id}: {ticket.title}</h2>
          <div className="mt-2 text-sm text-gray-700">
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
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 flex flex-col sm:flex-row items-center gap-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex-shrink-0 text-gray-800">Review Ticket</h3>
          <select value={selectedResponder} onChange={e => setSelectedResponder(e.target.value)} className="flex-grow p-2 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none">
            <option value="">-- Select Member to Assign --</option>
            {membersInProject.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleApproveTicket} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 font-semibold transition-all"><CheckIcon className="w-5 h-5"/>Approve & Assign</button>
            <button onClick={handleRejectTicket} className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 font-semibold transition-all"><XMarkIcon className="w-5 h-5"/>Reject</button>
          </div>
        </div>
      );
    }

    if (ticket.status === TicketStatus.PENDING_CLOSE_APPROVAL) {
      return (
          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 flex flex-col sm:flex-row items-center gap-4 justify-between border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Review Closure Request</h3>
              <div className="flex gap-2">
                  <button onClick={handleApproveClosure} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 font-semibold transition-all"><CheckIcon className="w-5 h-5"/>Approve Closure</button>
                  <button onClick={handleRejectClosure} className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 font-semibold transition-all"><XMarkIcon className="w-5 h-5"/>Reject</button>
              </div>
          </div>
      );
    }
    
    return (
      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 flex flex-col sm:flex-row items-center gap-4 justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold flex-shrink-0 text-gray-800">Change Assignee</h3>
            <select value={selectedResponder} onChange={e => setSelectedResponder(e.target.value)} className="p-2 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none">
                {membersInProject.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button onClick={handleChangeResponder} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all">Change</button>
          </div>
          <button onClick={handleForceCloseTicket} className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:shadow-lg flex items-center gap-2 font-semibold transition-all"><LockClosedIcon className="w-5 h-5"/> Force Close Ticket</button>
      </div>
    );
  };
  
  const renderReopenForm = () => (
    <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">Reopen Ticket</h3>
        <textarea
            value={reopenReason}
            onChange={e => setReopenReason(e.target.value)}
            placeholder="Please provide a reason for reopening this ticket..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-3"
            rows={3}
        />
        {(currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN) && (
          <select value={reopenAssignee} onChange={e => setReopenAssignee(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-3">
              <option value="">-- Select Member to Assign --</option>
              {membersInProject.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <div className="flex justify-end gap-2">
            <button onClick={() => setIsReopening(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all">Cancel</button>
            <button onClick={handleReopenTicket} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all">Submit</button>
        </div>
    </div>
  );

  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium">
              <ArrowUturnLeftIcon className="w-4 h-4"/>
              Back to Ticket List
          </button>
      </div>
      
      {renderTicketHeader()}
      {renderMediatorActions()}

      <div className="flex flex-col lg:flex-row">
        <div className="flex-grow lg:w-2/3 p-6 space-y-4 h-[60vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
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
        <div className="lg:w-1/3 border-l border-gray-200 bg-white">
          <AuditLog 
            auditLog={ticket.auditLog} 
            findUser={findUser} 
            currentUserRole={currentUserRole}
          />
        </div>
      </div>
      
      {isReopening && renderReopenForm()}

      {!isTicketLocked && !isReopening && ticket.status !== TicketStatus.PENDING_APPROVAL && ticket.status !== TicketStatus.PENDING_CLOSE_APPROVAL && (
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-white to-indigo-50">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-grow px-4 py-3 border-2 border-gray-200 rounded-full bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
            <button
              onClick={handleSendMessage}
              className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:transform-none"
              disabled={!newMessage.trim()}
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
       
       {!isTicketLocked && !isReopening && isCreator && ticket.status !== TicketStatus.PENDING_CLOSE_APPROVAL && (
         <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 text-center">
            <button onClick={handleRequestCloseTicket} className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 shadow-md font-semibold transition-all">Request to Close Ticket</button>
         </div>
       )}
       
       {isTicketLocked && !isReopening && (
        <div className="p-4 text-center bg-gradient-to-r from-gray-100 to-red-50 border-t border-gray-200">
          <p className="text-gray-700 font-medium flex items-center justify-center gap-2"><LockClosedIcon className="w-5 h-5"/> This ticket is closed. No further messages can be sent.</p>
           {canReopen && (
             <button onClick={() => setIsReopening(true)} className="mt-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-md font-semibold transition-all">Reopen Ticket</button>
           )}
        </div>
      )}
    </div>
  );
};

export default TicketDetail;