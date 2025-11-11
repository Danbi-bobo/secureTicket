

import React, { useState, useMemo } from 'react';
import { Role, TicketStatus, MessageStatus, User, Ticket, AuditLogEntry, Message, Project } from './types';
import { USERS, INITIAL_TICKETS, PROJECTS } from './constants';
import TicketDetail from './components/TicketDetail';
import TicketList from './components/TicketList';
import AdminDashboard from './components/AdminDashboard';
import { CreateIcon, UserIcon, BriefcaseIcon } from './components/icons';

interface CreateTicketFormProps {
  onCancel: () => void;
  onSubmit: (title: string, description: string) => void;
}

const CreateTicketForm: React.FC<CreateTicketFormProps> = ({ onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (title.trim() && description.trim()) {
      onSubmit(title, description);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg animate-fade-in">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Create a New Ticket</h2>
        <div className="space-y-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="A brief summary of your inquiry"
                />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                    id="description"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Provide as much detail as possible..."
                ></textarea>
            </div>
            <div className="flex justify-end gap-4">
                <button
                    onClick={onCancel}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!title || !description}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                >
                    Submit Ticket
                </button>
            </div>
        </div>
    </div>
  );
};

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(USERS);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    currentUser.memberships.length > 0 ? currentUser.memberships[0].projectId : null
  );

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [responderFilter, setResponderFilter] = useState<string | 'all'>('all');
  const [adminTab, setAdminTab] = useState<'manage' | 'tickets'>('manage');

  const currentUserRole = useMemo(() => {
    if (!selectedProjectId) return undefined;
    return currentUser.memberships.find(m => m.projectId === selectedProjectId)?.role;
  }, [currentUser, selectedProjectId]);
  
  const availableProjectsForCurrentUser = useMemo(() => {
    return projects.filter(p => currentUser.memberships.some(m => m.projectId === p.id));
  }, [currentUser, projects]);

  const findUser = (id: string) => users.find(u => u.id === id);

  const handleCreateTicket = (title: string, description: string) => {
    if (!selectedProjectId || !currentUserRole) return;

    const newTicket: Ticket = {
      id: Math.floor(Math.random() * 10000),
      projectId: selectedProjectId,
      title,
      description,
      originalDescription: description,
      status: TicketStatus.PENDING_APPROVAL,
      querentId: currentUser.id,
      mediatorId: users.find(u => u.memberships.some(m => m.projectId === selectedProjectId && m.role === Role.MEDIATOR))?.id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      auditLog: [{
        id: `log_${Date.now()}`,
        userId: currentUser.id,
        role: currentUserRole,
        action: 'CREATE',
        details: 'Ticket created.',
        timestamp: new Date(),
      }],
    };
    setTickets(prev => [newTicket, ...prev]);
    setIsCreatingTicket(false);
  };
  
  const addAuditLog = (ticketId: number, userId: string, role: Role, action: string, details: string) => {
    const newLog: AuditLogEntry = {
      id: `log_${Date.now()}`,
      userId,
      role,
      action,
      details,
      timestamp: new Date(),
    };
    setTickets(prevTickets => prevTickets.map(t =>
      t.id === ticketId ? { ...t, auditLog: [...t.auditLog, newLog], updatedAt: new Date() } : t
    ));
  };
  
  const updateTicket = (ticketId: number, updates: Partial<Ticket>) => {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: new Date() } : t));
  };
  
  const addMessage = (ticketId: number, senderId: string, content: string, status: MessageStatus) => {
        const newMessage: Message = {
            id: `msg_${Date.now()}`,
            senderId,
            content,
            originalContent: content,
            status,
            timestamp: new Date(),
        };
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, messages: [...t.messages, newMessage], updatedAt: new Date() } : t));
  };

  const updateMessage = (ticketId: number, messageId: string, updates: Partial<Message>) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updatedMessages = t.messages.map(m => m.id === messageId ? { ...m, ...updates } : m);
        return { ...t, messages: updatedMessages, updatedAt: new Date() };
      }
      return t;
    }));
  };

  const handleAddProject = (name: string) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name,
    };
    setProjects(prev => [...prev, newProject]);
    
    const adminUser = users.find(u => u.id === currentUser.id);
    if(adminUser && adminUser.memberships.some(m => m.role === Role.ADMIN)) {
        const updatedMemberships = [...adminUser.memberships, { projectId: newProject.id, role: Role.ADMIN }];
        handleUpdateUserMemberships(adminUser.id, updatedMemberships);
    }
  };

  const handleUpdateUserMemberships = (userId: string, memberships: { projectId: string; role: Role }[]) => {
    const newUsers = users.map(u => u.id === userId ? { ...u, memberships } : u);
    setUsers(newUsers);
    
    if (currentUser.id === userId) {
        setCurrentUser(newUsers.find(u => u.id === userId)!);
    }
  };
  
  const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedTicketId), [tickets, selectedTicketId]);

  const filteredTicketsForUser = useMemo(() => {
    if (!selectedProjectId) return [];

    const projectTickets = tickets.filter(t => t.projectId === selectedProjectId);

    let roleFilteredTickets: Ticket[];
    switch (currentUserRole) {
      case Role.QUERENT:
        roleFilteredTickets = projectTickets.filter(t => t.querentId === currentUser.id);
        break;
      case Role.RESPONDER:
        roleFilteredTickets = projectTickets.filter(t => t.responderId === currentUser.id);
        break;
      case Role.MEDIATOR:
        roleFilteredTickets = projectTickets;
        break;
      default:
        roleFilteredTickets = [];
    }

    const statusFiltered = statusFilter === 'all'
      ? roleFilteredTickets
      : roleFilteredTickets.filter(t => t.status === statusFilter);

    if (currentUserRole === Role.MEDIATOR && responderFilter !== 'all') {
      return statusFiltered.filter(t => t.responderId === responderFilter);
    }
    
    return statusFiltered;
  }, [currentUser, currentUserRole, tickets, selectedProjectId, statusFilter, responderFilter]);
  
  const adminAllTickets = useMemo(() => {
    let allTickets = tickets;
    const statusFiltered = statusFilter === 'all'
        ? allTickets
        : allTickets.filter(t => t.status === statusFilter);

    if (responderFilter !== 'all') {
        return statusFiltered.filter(t => t.responderId === responderFilter);
    }
    return statusFiltered;
  }, [tickets, statusFilter, responderFilter]);

  const renderDashboard = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          {currentUserRole} Dashboard
        </h2>
        {currentUserRole === Role.QUERENT && (
          <button
            onClick={() => setIsCreatingTicket(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-300"
          >
            <CreateIcon className="w-5 h-5" />
            Create New Ticket
          </button>
        )}
      </div>
      <TicketList 
        tickets={filteredTicketsForUser} 
        onSelectTicket={setSelectedTicketId} 
        users={users} 
        currentUser={currentUser}
        currentUserRole={currentUserRole}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        responderFilter={responderFilter}
        setResponderFilter={setResponderFilter}
        projectId={selectedProjectId}
      />
    </>
  );

  const renderAdminView = () => {
    const TabButton = ({ tab, children }: {tab: 'manage' | 'tickets', children: React.ReactNode}) => (
        <button
            onClick={() => setAdminTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${adminTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
            {children}
        </button>
    );

    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Admin Panel
        </h2>
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            {/* FIX: The TabButton component requires a 'children' prop which was missing. Added text content as children. */}
            <TabButton tab="manage">Manage Projects &amp; Users</TabButton>
            {/* FIX: The TabButton component requires a 'children' prop which was missing. Added text content as children. */}
            <TabButton tab="tickets">All Tickets</TabButton>
        </div>

        {adminTab === 'manage' ? (
             <AdminDashboard 
                projects={projects}
                users={users}
                onAddProject={handleAddProject}
                onUpdateUserMemberships={handleUpdateUserMemberships}
            />
        ) : (
            <TicketList 
                tickets={adminAllTickets}
                onSelectTicket={setSelectedTicketId}
                users={users}
                currentUser={currentUser}
                currentUserRole={currentUserRole}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                responderFilter={responderFilter}
                setResponderFilter={setResponderFilter}
                projectId={selectedProjectId}
                projects={projects}
            />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-200 font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">SecureTick</h1>
            <div className="flex items-center gap-6">
               {availableProjectsForCurrentUser.length > 0 && (
                <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <select
                        value={selectedProjectId || ''}
                        onChange={e => {
                            setSelectedProjectId(e.target.value);
                            setSelectedTicketId(null);
                        }}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        {availableProjectsForCurrentUser.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">{currentUser.name}</span>
                  {currentUserRole && <span className="text-sm text-gray-500 dark:text-gray-400">({currentUserRole})</span>}
                </div>
                <select
                  value={currentUser.id}
                  onChange={e => {
                      const newUserId = e.target.value;
                      const newUser = users.find(u => u.id === newUserId)!;
                      setCurrentUser(newUser);
                      const firstProjectId = newUser.memberships.length > 0 ? newUser.memberships[0].projectId : null;
                      setSelectedProjectId(firstProjectId);
                      setSelectedTicketId(null);
                      setIsCreatingTicket(false);
                      setStatusFilter('all');
                      setResponderFilter('all');
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {selectedTicket ? (
          <TicketDetail
            ticket={selectedTicket}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            onBack={() => setSelectedTicketId(null)}
            onUpdateTicket={updateTicket}
            onAddMessage={addMessage}
            onUpdateMessage={updateMessage}
            onAddAuditLog={addAuditLog}
            users={users}
            findUser={findUser}
          />
        ) : isCreatingTicket ? (
          <CreateTicketForm
            onCancel={() => setIsCreatingTicket(false)}
            onSubmit={handleCreateTicket}
          />
        ) : currentUserRole === Role.ADMIN ? renderAdminView() 
          : renderDashboard()}
      </main>
    </div>
  );
};

export default App;