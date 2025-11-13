import React, { useMemo } from 'react';
import { Ticket, Project, TicketStatus } from '../types';

interface ManagerOverviewProps {
  tickets: Ticket[];
  projects: Project[];
}

// Tickets by Status - Card-based với progress bars
const StatusChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  const getStatusConfig = (label: string) => {
    const statusMap: Record<string, { icon: string; gradient: string; bg: string }> = {
      'Pending Approval': { icon: '⏳', gradient: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-50' },
      'Assigned': { icon: '📋', gradient: 'from-blue-400 to-blue-600', bg: 'bg-blue-50' },
      'In Progress': { icon: '⚡', gradient: 'from-indigo-400 to-purple-600', bg: 'bg-indigo-50' },
      'Waiting for Feedback': { icon: '💬', gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-50' },
      'Pending Close Approval': { icon: '🔒', gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
      'Closed': { icon: '✅', gradient: 'from-green-400 to-emerald-600', bg: 'bg-green-50' },
      'Rejected': { icon: '❌', gradient: 'from-red-400 to-red-600', bg: 'bg-red-50' },
    };
    return statusMap[label] || { icon: '📌', gradient: 'from-gray-400 to-gray-600', bg: 'bg-gray-50' };
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>📊</span> Tickets by Status
      </div>
      <div className="space-y-4">
        {data.map((item) => {
          const config = getStatusConfig(item.label);
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const progressWidth = total > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <div key={item.label} className={`${config.bg} rounded-xl p-4 border-2 border-transparent hover:border-gray-200 transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center justify-center text-2xl shadow-md`}>
                    {config.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-600">{percentage.toFixed(1)}% of total</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">{item.value}</div>
                  <div className="text-xs text-gray-500">tickets</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-500 shadow-sm`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Tickets by Project - Horizontal bar chart với gradient
const ProjectChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-indigo-500 to-blue-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-yellow-500 to-orange-500',
    'from-pink-500 to-rose-500',
    'from-teal-500 to-cyan-500',
  ];

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>📁</span> Tickets by Project
      </div>
      <div className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No project data available</div>
        ) : (
          data.map((item, idx) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const barWidth = (item.value / maxValue) * 100;
            const color = colors[idx % colors.length];
            
            return (
              <div key={item.label} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}>
                      {item.label.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-800 truncate">{item.label}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</div>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="text-xl font-bold text-gray-800">{item.value}</div>
                    <div className="text-xs text-gray-500">tickets</div>
                  </div>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700 ease-out shadow-sm group-hover:shadow-md`}
                    style={{ width: `${barWidth}%` }}
                  />
                  {item.value > 0 && (
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-xs font-semibold text-gray-700">{item.value}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ChartLine: React.FC<{ data: { label: string; value: number }[]; title: string }>
= ({ data, title }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  const height = 200;
  const padding = 40;
  
  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="text-lg font-bold text-gray-800 mb-4">{title}</div>
      <div className="w-full overflow-x-auto">
        <svg className="w-full" viewBox={`0 0 ${Math.max(800, data.length * 100 + padding * 2)} ${height}`} preserveAspectRatio="xMidYMid meet">
          {data.length > 0 && (
            <>
              <polyline
                points={data.map((d, i) => {
                  const step = (Math.max(800, data.length * 100 + padding * 2) - padding * 2) / Math.max(1, data.length - 1);
                  const x = padding + i * step;
                  const y = height - padding - (d.value / max) * (height - padding * 2);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                className="stroke-indigo-500"
                strokeWidth="3"
              />
              {data.map((d, i) => {
                const step = (Math.max(800, data.length * 100 + padding * 2) - padding * 2) / Math.max(1, data.length - 1);
                const x = padding + i * step;
                const y = height - padding - (d.value / max) * (height - padding * 2);
                return (
                  <g key={d.label}>
                    <circle cx={x} cy={y} r="5" className="fill-indigo-500" />
                    <text x={x} y={height - 15} textAnchor="middle" className="fill-gray-700 text-xs font-medium">{d.label}</text>
                    {d.value > 0 && (
                      <text x={x} y={y - 10} textAnchor="middle" className="fill-gray-800 text-sm font-bold">{d.value}</text>
                    )}
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7; // Monday start
  x.setHours(0,0,0,0);
  x.setDate(x.getDate() - diff);
  return x;
};

const formatWeek = (d: Date) => {
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const ManagerOverview: React.FC<ManagerOverviewProps> = ({ tickets, projects }) => {
  const statusData = useMemo(() => {
    const allStatuses = Object.values(TicketStatus);
    const counts: Record<string, number> = {};
    allStatuses.forEach(s => { counts[s] = 0; });
    tickets.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return allStatuses.map(s => ({ label: s.replace(' ', '\n'), value: counts[s] || 0 }));
  }, [tickets]);

  const perProject = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => { counts[t.projectId] = (counts[t.projectId] || 0) + 1; });
    return projects.map(p => ({ label: p.name, value: counts[p.id] || 0 }));
  }, [tickets, projects]);

  const weeklyAvgResolution = useMemo(() => {
    const buckets: Record<string, { sum: number; n: number }> = {};
    tickets.filter(t => t.closedAt).forEach(t => {
      const w = formatWeek(startOfWeek(new Date(t.closedAt!)));
      const ms = new Date(t.closedAt!).getTime() - new Date(t.createdAt).getTime();
      if (!buckets[w]) buckets[w] = { sum: 0, n: 0 };
      buckets[w].sum += ms;
      buckets[w].n += 1;
    });
    const keys = Object.keys(buckets).sort();
    return keys.map(k => ({ label: k.slice(5), value: Math.round((buckets[k].sum / buckets[k].n) / 36e5) }));
  }, [tickets]);

  return (
    <div className="space-y-6">
      <StatusChart data={statusData} />
      <ProjectChart data={perProject} />
      <ChartLine data={weeklyAvgResolution} title="⏱️ Average Resolution Time (hours) per Week" />
    </div>
  );
};

export default ManagerOverview;
