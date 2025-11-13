
import React, { useState } from 'react';
import { Message, User, Role, MessageStatus, Ticket } from '../types';
import { UserIcon, CheckIcon, XMarkIcon, PencilIcon, ClockIcon } from './icons';

interface MessageBubbleProps {
  message: Message;
  currentUser: User;
  currentUserRole?: Role;
  ticket: Ticket;
  findUser: (id: string) => User | undefined;
  onMessageAction: (messageId: string, action: 'approve' | 'reject' | 'edit', newContent?: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser, currentUserRole, ticket, findUser, onMessageAction }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const sender = findUser(message.senderId);
  const isCurrentUserSender = message.senderId === currentUser.id;
  
  const getDisplayName = () => {
    if (!sender) return 'Unknown User';
    
    const senderRoleInProject = sender.memberships.find(m => m.projectId === ticket.projectId)?.role;

    if (currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN) {
        return `${sender.name} (${senderRoleInProject || 'User'})`;
    }

    if (isCurrentUserSender) return 'You';
    
    if (sender.id === ticket.querentId) return 'Creator';
    if (sender.id === ticket.responderId) return 'Assignee';
    if (senderRoleInProject === Role.MEDIATOR) return 'Mediator';

    return 'System';
  };
  
  const canViewMessage = () => {
    if (message.status === MessageStatus.APPROVED || message.status === MessageStatus.EDITED) return true;
    if (currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN) return true;
    if (isCurrentUserSender && message.status === MessageStatus.PENDING_APPROVAL) return true;
    return false;
  };

  const handleEditSave = () => {
    onMessageAction(message.id, 'edit', editedContent);
    setIsEditing(false);
  };
  
  const renderMediatorMessageActions = () => {
    if (currentUserRole !== Role.MEDIATOR || message.status !== MessageStatus.PENDING_APPROVAL) return null;

    return (
      <div className="flex items-center gap-2 mt-2">
        <button onClick={() => onMessageAction(message.id, 'approve')} className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200"><CheckIcon className="w-4 h-4" /></button>
        <button onClick={() => setIsEditing(true)} className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"><PencilIcon className="w-4 h-4" /></button>
        <button onClick={() => onMessageAction(message.id, 'reject')} className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><XMarkIcon className="w-4 h-4" /></button>
      </div>
    );
  };
  
  if (!canViewMessage()) return null;

  return (
    <div className={`flex items-start gap-3 ${isCurrentUserSender ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
        isCurrentUserSender 
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
          : 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white'
      }`}>
        <UserIcon className="w-5 h-5" />
      </div>
      <div className={`w-full max-w-lg ${isCurrentUserSender ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`flex items-center gap-2 mb-1 ${isCurrentUserSender ? 'flex-row-reverse' : ''}`}>
          <span className="font-semibold text-sm text-gray-700">{getDisplayName()}</span>
          <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className={`mt-1 p-4 rounded-2xl w-fit shadow-sm ${
          isCurrentUserSender 
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
            : 'bg-white border-2 border-gray-200 text-gray-800'
        }`}>
          {isEditing && currentUserRole === Role.MEDIATOR ? (
            <div>
              <textarea 
                value={editedContent} 
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-3 text-sm bg-white text-gray-900 rounded-xl border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={handleEditSave} className="px-4 py-2 text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-md font-semibold transition-all">Save</button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-all">Cancel</button>
              </div>
            </div>
          ) : (
             <p className={`text-sm ${isCurrentUserSender ? 'text-white' : 'text-gray-800'}`}>{message.content}</p>
          )}

          {message.status === MessageStatus.PENDING_APPROVAL && (
            <div className={`text-xs mt-2 flex items-center gap-1 italic ${
              isCurrentUserSender ? 'text-white/90' : 'text-gray-600'
            }`}>
                <ClockIcon className="w-3 h-3"/>
                Waiting for mediator approval...
            </div>
          )}
          {message.status === MessageStatus.EDITED && (
             <div className={`text-xs mt-2 italic ${
              isCurrentUserSender ? 'text-white/90' : 'text-gray-600'
            }`}>
                (Edited by Mediator)
            </div>
          )}
        </div>
        {renderMediatorMessageActions()}
      </div>
    </div>
  );
};

export default MessageBubble;