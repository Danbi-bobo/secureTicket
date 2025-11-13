import React, { useState, useMemo, useEffect } from 'react';
import { Role, TicketStatus, MessageStatus, User, Ticket, AuditLogEntry, Message, Project } from './types';
import TicketDetail from './components/TicketDetail';
import TicketList from './components/TicketList';
import AdminDashboard from './components/AdminDashboard';
import ProjectManagement from './components/ProjectManagement';
import UserManagement from './components/UserManagement';
import { CreateIcon, UserIcon, BriefcaseIcon } from './components/icons';
import LoginScreen from './components/LoginScreen';
import { supabase } from './supabaseClient';
import { fetchProjects, fetchUsers, fetchTickets, insertProject, insertMembership, updateUserMemberships, insertTicket, updateTicket as updateTicketInDb, insertMessage, updateMessage as updateMessageInDb } from './db';
import { insertAuditLog } from './auditLogApi';

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
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [responderFilter, setResponderFilter] = useState<string | 'all'>('all');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'projects' | 'users' | 'tickets'>('dashboard');

  const currentUserRole = useMemo(() => {
    if (!currentUser || !selectedProjectId) return undefined;
    return currentUser.memberships.find(m => m.projectId === selectedProjectId)?.role;
  }, [currentUser, selectedProjectId]);

  const isGlobalAdmin = useMemo(() => {
    return currentUser?.isAdmin ?? false;
  }, [currentUser]);

  const availableProjectsForCurrentUser = useMemo(() => {
    if (!currentUser) return [];
    return projects.filter(p => currentUser.memberships.some(m => m.projectId === p.id));
  }, [currentUser, projects]);

  const findUser = (id: string) => users.find(u => u.id === id);

  // Subscribe to auth state
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load data only when session exists
  useEffect(() => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const user = session.user;
        if (user) {
          await supabase.from('users').upsert({
            id: user.id,
            name: (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || (user.email ? user.email.split('@')[0] : 'User'),
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url ?? null
          }, { onConflict: 'id' });
        }
        const [p, u, t] = await Promise.all([fetchProjects(), fetchUsers(), fetchTickets()]);
        setProjects(p);
        setUsers(u);
        setTickets(t);
        if (u.length > 0) {
          const me = user ? u.find(x => x.id === user.id) || u[0] : u[0];
          setCurrentUser(me);
          const firstProjectId = me.memberships.length > 0 ? me.memberships[0].projectId : null;
          setSelectedProjectId(firstProjectId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [session]);

  const handleCreateTicket = async (title: string, description: string) => {
    if (!currentUser || !selectedProjectId || !currentUserRole) return;

    const mediator = users.find(u => u.memberships.some(m => m.projectId === selectedProjectId && m.role === Role.MEDIATOR));
    
    if (!mediator || !mediator.id) {
      console.error('Mediator not found for project:', selectedProjectId);
      alert('Không tìm thấy mediator cho project này. Vui lòng kiểm tra lại.');
      return;
    }
    
    const ticketId = crypto.randomUUID?.() || Date.now().toString();
    
    const newTicket = await insertTicket(
      {
        id: ticketId,
        projectId: selectedProjectId,
        title,
        description,
        originalDescription: description,
        status: TicketStatus.PENDING_APPROVAL,
        querentId: currentUser.id,
        mediatorId: mediator.id,
      },
      {
        userId: currentUser.id,
        role: currentUserRole,
        action: 'CREATE',
        details: 'Ticket created.',
      }
    );

    if (newTicket) {
      setTickets(prev => [newTicket, ...prev]);
      setIsCreatingTicket(false);
    } else {
      console.error('Failed to create ticket');
      alert('Không thể tạo ticket. Vui lòng thử lại.');
    }
  };

  const addAuditLog = async (ticketId: string, userId: string, role: Role, action: string, details: string) => {
    // Cập nhật state local ngay để UI responsive
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

    // Lưu vào database qua API (dùng service_role)
    const success = await insertAuditLog(ticketId, userId, role, action, details);
    if (!success) {
      console.error('Failed to save audit log to database');
      // Có thể hiển thị warning hoặc retry logic ở đây
    }
  };

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    // Cập nhật state local ngay để UI responsive
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: new Date() } : t));
    
    // Lưu vào database
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.responderId !== undefined) dbUpdates.responderId = updates.responderId;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.originalDescription !== undefined) dbUpdates.originalDescription = updates.originalDescription;
    if (updates.closedAt !== undefined) dbUpdates.closedAt = updates.closedAt;

    const success = await updateTicketInDb(ticketId, dbUpdates);
    if (!success) {
      console.error('Failed to update ticket in database');
      // Có thể revert state hoặc hiển thị error message
    }
  };

  const addMessage = async (ticketId: string, senderId: string, content: string, status: MessageStatus) => {
    // Cập nhật state local ngay để UI responsive
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId,
      content,
      originalContent: content,
      status,
      timestamp: new Date(),
    };
    
    // Sử dụng functional update để đảm bảo lấy state mới nhất
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, messages: [...t.messages, newMessage], updatedAt: new Date() };
      }
      return t;
    }));

    // Lưu vào database
    const savedMessage = await insertMessage(ticketId, senderId, content, status, content);
    if (!savedMessage) {
      console.error('Failed to save message to database');
      // Revert: xóa message tạm thời nếu lưu thất bại
      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return { ...t, messages: t.messages.filter(m => m.id !== newMessage.id), updatedAt: new Date() };
        }
        return t;
      }));
    } else {
      // Cập nhật với ID thực từ database, giữ nguyên TẤT CẢ properties khác của ticket (bao gồm status đã được cập nhật)
      // Sử dụng functional update để đảm bảo lấy state mới nhất (có thể đã có status update từ updateTicket)
      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          const updatedMessages = t.messages.map(m => 
            m.id === newMessage.id ? savedMessage : m
          );
          // Spread toàn bộ ticket để giữ nguyên status và các properties khác
          return { ...t, messages: updatedMessages, updatedAt: new Date() };
        }
        return t;
      }));
    }
  };

  const updateMessage = async (ticketId: string, messageId: string, updates: Partial<Message>) => {
    // Cập nhật state local ngay để UI responsive
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updatedMessages = t.messages.map(m => m.id === messageId ? { ...m, ...updates } : m);
        return { ...t, messages: updatedMessages, updatedAt: new Date() };
      }
      return t;
    }));

    // Lưu vào database
    const dbUpdates: any = {};
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.originalContent !== undefined) dbUpdates.originalContent = updates.originalContent;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const success = await updateMessageInDb(messageId, dbUpdates);
    if (!success) {
      console.error('Failed to update message in database');
      // Có thể revert state hoặc hiển thị error message
    }
  };

  const handleAddProject = async (name: string) => {
    const newProject = await insertProject(name);
    if (!newProject) {
      alert('Failed to create project');
      return;
    }

    setProjects(prev => [...prev, newProject]);

    // Thêm admin vào project
    const adminUser = currentUser ? users.find(u => u.id === currentUser.id) : undefined;
    if (adminUser && adminUser.isAdmin) {
      const success = await insertMembership(adminUser.id, newProject.id, 'admin');
      if (success) {
        const updatedMemberships = [...adminUser.memberships, { projectId: newProject.id, role: Role.ADMIN }];
        handleUpdateUserMemberships(adminUser.id, updatedMemberships);
      }
    }
  };

  const handleUpdateUserMemberships = async (userId: string, memberships: { projectId: string; role: Role }[]) => {
    const success = await updateUserMemberships(userId, memberships);
    if (!success) {
      alert('Failed to update user memberships');
      return;
    }
    
    // Reload users để lấy data mới nhất
    const updatedUsers = await fetchUsers();
    setUsers(updatedUsers);
    
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(updatedUsers.find(u => u.id === userId)!);
    }
  };

  const handleUpdateUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase.from('users').update({ is_admin: isAdmin }).eq('id', userId);
      if (error) throw error;
      const newUsers = users.map(u => u.id === userId ? { ...u, isAdmin } : u);
      setUsers(newUsers);
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(newUsers.find(u => u.id === userId)!);
      }
    } catch (e) {
      console.error('Failed to update admin status:', e);
      alert('Failed to update admin status');
    }
  };

  const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedTicketId), [tickets, selectedTicketId]);

  const ticketsForDashboard = useMemo(() => {
    if (!selectedProjectId) return [];

    const projectTickets = tickets.filter(t => t.projectId === selectedProjectId);

    switch (currentUserRole) {
      case Role.MEMBER:
        return projectTickets.filter(t => t.querentId === currentUser.id || t.responderId === currentUser.id);
      case Role.MEDIATOR:
        return projectTickets;
      default:
        return [];
    }
  }, [currentUser, currentUserRole, tickets, selectedProjectId]);

  const filteredTicketsForUser = useMemo(() => {
    const responderFiltered = responderFilter === 'all'
      ? ticketsForDashboard
      : ticketsForDashboard.filter(t => t.responderId === responderFilter);

    const statusFiltered = statusFilter === 'all'
      ? responderFiltered
      : responderFiltered.filter(t => t.status === statusFilter);

    return statusFiltered;
  }, [ticketsForDashboard, statusFilter, responderFilter]);


  const adminAllTickets = useMemo(() => {
    let allTickets = tickets;
    const responderFiltered = responderFilter === 'all'
      ? allTickets
      : allTickets.filter(t => t.responderId === responderFilter);

    const statusFiltered = statusFilter === 'all'
      ? responderFiltered
      : responderFiltered.filter(t => t.status === statusFilter);

    return statusFiltered;
  }, [tickets, statusFilter, responderFilter]);

  const effectiveRole = isGlobalAdmin ? Role.ADMIN : currentUserRole;

  const renderDashboard = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          {effectiveRole} Dashboard
        </h2>
        {effectiveRole === Role.MEMBER && (
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
        sourceTicketsForCounts={ticketsForDashboard}
        onSelectTicket={setSelectedTicketId}
        users={users}
        currentUser={currentUser}
        currentUserRole={effectiveRole}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        responderFilter={responderFilter}
        setResponderFilter={setResponderFilter}
        projectId={selectedProjectId}
        onUpdateTicket={updateTicket}
        onUpdateMessage={updateMessage}
        onAddAuditLog={addAuditLog}
      />
    </>
  );

  const renderAdminView = () => {
    const TabButton = ({ tab, children, icon }: { tab: 'dashboard' | 'projects' | 'users' | 'tickets', children: React.ReactNode, icon: string }) => (
      <button
        onClick={() => setAdminTab(tab)}
        className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all transform hover:scale-105 ${
          adminTab === tab
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-indigo-300 shadow-md'
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          {children}
        </span>
      </button>
    );

    return (
      <div className="bg-gray-50 min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Admin Control Center
          </h2>
          <p className="text-gray-600">Manage your entire system from one place</p>
        </div>
        
        <div className="mb-6 flex flex-wrap gap-3 bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <TabButton tab="dashboard" icon="📊">Dashboard</TabButton>
          <TabButton tab="projects" icon="📁">Projects</TabButton>
          <TabButton tab="users" icon="👥">Users</TabButton>
          <TabButton tab="tickets" icon="🎫">Tickets</TabButton>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          {adminTab === 'dashboard' ? (
            <AdminDashboard
              projects={projects}
              users={users}
              tickets={tickets}
            />
          ) : adminTab === 'projects' ? (
            <ProjectManagement
              projects={projects}
              users={users}
              onAddProject={handleAddProject}
              onUpdateUserMemberships={handleUpdateUserMemberships}
            />
          ) : adminTab === 'users' ? (
            <UserManagement
              users={users}
              onUpdateUserAdmin={handleUpdateUserAdmin}
            />
          ) : (
            <TicketList
              tickets={adminAllTickets}
              sourceTicketsForCounts={tickets}
              onSelectTicket={setSelectedTicketId}
              users={users}
              currentUser={currentUser}
              currentUserRole={Role.ADMIN}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              responderFilter={responderFilter}
              setResponderFilter={setResponderFilter}
              projectId={selectedProjectId}
              projects={projects}
              onUpdateTicket={updateTicket}
              onUpdateMessage={updateMessage}
              onAddAuditLog={addAuditLog}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 font-sans bg-gray-50">
      {!session ? (
        <LoginScreen />
      ) : (
        <>
          <header className="bg-white shadow-lg sticky top-0 z-10 border-b border-gray-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SecureTick</h1>
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
                      <span className="font-medium">{currentUser ? currentUser.name : '—'}</span>
                      {effectiveRole && <span className="text-sm text-gray-500 dark:text-gray-400">({effectiveRole})</span>}
                    </div>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); }}
                      className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : !currentUser ? (
              <div className="text-sm text-gray-500">No users found.</div>
            ) : selectedTicket ? (
              <TicketDetail
                ticket={selectedTicket}
                currentUser={currentUser}
                currentUserRole={isGlobalAdmin ? Role.ADMIN : effectiveRole}
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
            ) : isGlobalAdmin ? (
              renderAdminView()
            ) : effectiveRole === Role.ADMIN ? (
              renderAdminView()
            ) : (
              renderDashboard()
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
