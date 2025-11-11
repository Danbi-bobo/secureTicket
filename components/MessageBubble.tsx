
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
    if (senderRoleInProject === Role.QUERENT) return 'Querent';
    if (senderRoleInProject === Role.RESPONDER) return 'Responder';
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
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
        <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>
      <div className={`w-full max-w-lg ${isCurrentUserSender ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{getDisplayName()}</span>
          <span className="text-xs text-gray-400">{new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className={`mt-1 p-3 rounded-lg w-fit ${isCurrentUserSender ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
          {isEditing && currentUserRole === Role.MEDIATOR ? (
            <div>
              <textarea 
                value={editedContent} 
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-gray-500"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleEditSave} className="px-2 py-1 text-xs bg-green-500 text-white rounded">Save</button>
                <button onClick={() => setIsEditing(false)} className="px-2 py-1 text-xs bg-gray-500 text-white rounded">Cancel</button>
              </div>
            </div>
          ) : (
             <p className="text-sm">{message.content}</p>
          )}

          {message.status === MessageStatus.PENDING_APPROVAL && (
            <div className="text-xs mt-2 opacity-80 flex items-center gap-1 italic">
                <ClockIcon className="w-3 h-3"/>
                Waiting for mediator approval...
            </div>
          )}
          {message.status === MessageStatus.EDITED && (
             <div className="text-xs mt-2 opacity-80 italic">
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
