import React, { useMemo } from 'react';
import { Ticket, Project, TicketStatus } from '../types';

interface ManagerOverviewProps {
  tickets: Ticket[];
  projects: Project[];
}

const ChartBar: React.FC<{ data: { label: string; value: number }[]; title: string; colorClass?: string }>
= ({ data, title, colorClass = 'fill-indigo-500' }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  const barW = 36;
  const gap = 16;
  const width = data.length * (barW + gap) + gap;
  const height = 140;
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <svg width={width} height={height}>
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * (height - 30));
          const x = gap + i * (barW + gap);
          const y = height - 20 - h;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={h} className={colorClass} />
              <text x={x + barW / 2} y={height - 6} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[10px]">
                {d.label}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="fill-gray-700 dark:fill-gray-200 text-[10px]">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const ChartLine: React.FC<{ data: { label: string; value: number }[]; title: string }>
= ({ data, title }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  const width = 420;
  const height = 140;
  const padding = 24;
  const step = (width - padding * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = padding + i * step;
    const y = height - padding - (d.value / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <svg width={width} height={height}>
        <polyline points={points} fill="none" className="stroke-indigo-500" strokeWidth={2} />
        {data.map((d, i) => {
          const x = padding + i * step;
          const y = height - padding - (d.value / max) * (height - padding * 2);
          return (
            <g key={d.label}>
              <circle cx={x} cy={y} r={3} className="fill-indigo-500" />
              <text x={x} y={height - 6} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[10px]">{d.label}</text>
              <text x={x} y={y - 6} textAnchor="middle" className="fill-gray-700 dark:fill-gray-200 text-[10px]">{d.value}</text>
            </g>
          );
        })}
      </svg>
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartBar data={statusData} title="Tickets by status" />
        <ChartBar data={perProject} title="Tickets by project" colorClass="fill-emerald-500" />
        <ChartLine data={weeklyAvgResolution} title="Avg resolution time (hours) per week" />
      </div>
    </div>
  );
};

export default ManagerOverview;
