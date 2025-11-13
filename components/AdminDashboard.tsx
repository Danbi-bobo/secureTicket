import React, { useMemo } from 'react';
import { Ticket, Project, TicketStatus } from '../types';
import ManagerOverview from './ManagerOverview';

interface AdminDashboardProps {
  projects: Project[];
  users: any[];
  tickets: Ticket[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ projects, users, tickets }) => {
  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const closedTickets = tickets.filter(t => t.status === TicketStatus.CLOSED);
    const pendingTickets = tickets.filter(t => t.status === TicketStatus.PENDING_APPROVAL);
    const inProgressTickets = tickets.filter(t => t.status === TicketStatus.IN_PROGRESS);
    const waitingFeedback = tickets.filter(t => t.status === TicketStatus.WAITING_FEEDBACK);
    
    // Tính thời gian giải quyết trung bình
    const avgResolutionTime = closedTickets.length > 0
      ? closedTickets.reduce((sum, t) => {
          const ms = new Date(t.closedAt!).getTime() - new Date(t.createdAt).getTime();
          return sum + ms;
        }, 0) / closedTickets.length
      : 0;
    const avgHours = Math.round((avgResolutionTime / 36e5) * 10) / 10;
    const avgDays = Math.round((avgHours / 24) * 10) / 10;

    // Tính tỷ lệ đóng ticket
    const closureRate = totalTickets > 0 ? Math.round((closedTickets.length / totalTickets) * 100) : 0;

    // Tickets theo project
    const ticketsByProject = projects.map(p => ({
      name: p.name,
      count: tickets.filter(t => t.projectId === p.id).length
    }));

    // Tickets mới trong 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTickets = tickets.filter(t => new Date(t.createdAt) >= sevenDaysAgo).length;

    return {
      totalTickets,
      closedTickets: closedTickets.length,
      pendingTickets: pendingTickets.length,
      inProgressTickets: inProgressTickets.length,
      waitingFeedback: waitingFeedback.length,
      avgHours,
      avgDays,
      closureRate,
      ticketsByProject,
      recentTickets,
      totalProjects: projects.length,
      totalUsers: users.length
    };
  }, [tickets, projects, users]);

  const StatCard = ({ title, value, subtitle, icon, gradient }: { 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    icon: React.ReactNode;
    gradient: string;
  }) => (
    <div className={`relative overflow-hidden rounded-2xl ${gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white/90 text-sm font-medium">{title}</div>
          <div className="text-white/80">{icon}</div>
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        {subtitle && <div className="text-white/70 text-xs">{subtitle}</div>}
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-white">📊 Admin Dashboard</h1>
        <p className="text-white/90">Overview & Analytics</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={stats.totalTickets}
          subtitle={`${stats.recentTickets} new this week`}
          icon={<span className="text-2xl">🎫</span>}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Closed Tickets"
          value={stats.closedTickets}
          subtitle={`${stats.closureRate}% closure rate`}
          icon={<span className="text-2xl">✅</span>}
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressTickets}
          subtitle={`${stats.waitingFeedback} waiting feedback`}
          icon={<span className="text-2xl">⚡</span>}
          gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingTickets}
          subtitle="Awaiting review"
          icon={<span className="text-2xl">⏳</span>}
          gradient="bg-gradient-to-br from-purple-500 to-pink-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Avg Resolution Time</span>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.avgHours}h</div>
          <div className="text-xs text-gray-500 mt-1">({stats.avgDays} days)</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Total Projects</span>
            <span className="text-2xl">📁</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalProjects}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Total Users</span>
            <span className="text-2xl">👥</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📈</span> Analytics & Trends
        </h2>
        <ManagerOverview tickets={tickets} projects={projects} />
      </div>

      {/* Tickets by Project */}
      {stats.ticketsByProject.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span> Tickets by Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.ticketsByProject.map((project, idx) => {
              const colors = [
                'from-blue-400 to-blue-500',
                'from-purple-400 to-purple-500',
                'from-pink-400 to-pink-500',
                'from-indigo-400 to-indigo-500',
                'from-cyan-400 to-cyan-500',
                'from-teal-400 to-teal-500'
              ];
              const color = colors[idx % colors.length];
              return (
                <div key={project.name} className={`bg-gradient-to-r ${color} rounded-xl p-4 text-white shadow-md`}>
                  <div className="font-semibold mb-1">{project.name}</div>
                  <div className="text-2xl font-bold">{project.count}</div>
                  <div className="text-xs text-white/80 mt-1">tickets</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
