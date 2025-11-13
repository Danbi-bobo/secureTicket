import React, { useState, useMemo } from 'react';
import { AuditLogEntry, User, Role } from '../types';

interface AuditLogProps {
  auditLog: AuditLogEntry[];
  findUser: (id: string) => User | undefined;
  currentUserRole?: Role;
}

const AuditLog: React.FC<AuditLogProps> = ({ auditLog, findUser, currentUserRole }) => {
  const [startIndex, setStartIndex] = useState(0);
  const ITEMS_PER_PAGE = 3;

  // Sắp xếp logs theo thời gian (mới nhất trước)
  const sortedLogs = useMemo(() => {
    return [...auditLog].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [auditLog]);

  // Lấy 3 logs hiện tại để hiển thị
  const displayedLogs = useMemo(() => {
    return sortedLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedLogs, startIndex]);

  const canShowEarlier = startIndex + ITEMS_PER_PAGE < sortedLogs.length;
  const canShowLater = startIndex > 0;

  const handleShowEarlier = () => {
    setStartIndex(prev => Math.min(prev + ITEMS_PER_PAGE, sortedLogs.length - ITEMS_PER_PAGE));
  };

  const handleShowLater = () => {
    setStartIndex(prev => Math.max(prev - ITEMS_PER_PAGE, 0));
  };

  // Format thời gian đến đơn vị giây
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="p-4 bg-gradient-to-br from-white to-blue-50 h-full flex flex-col border-l border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
        <span>📜</span> Ticket History
      </h3>
      <div className="flow-root flex-grow overflow-y-auto">
        <ul role="list" className="-mb-8">
          {displayedLogs.length === 0 ? (
            <li className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">No history available</li>
          ) : (
            displayedLogs.map((log, logIdx) => {
              const actorDisplay =
                currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN
                  ? `${findUser(log.userId)?.name || 'Unknown User'} (${log.role})`
                  : log.role;

              return (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {logIdx !== displayedLogs.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gradient-to-b from-indigo-200 to-blue-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center ring-4 ring-white shadow-md">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div className="bg-white rounded-xl p-3 border-2 border-gray-100 shadow-sm flex-1">
                          <p className="text-sm text-gray-700">
                            {log.details}{' '}
                            <span className="font-semibold text-gray-900">
                              by {actorDisplay}
                            </span>
                          </p>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-gray-600 pt-3">
                          <time dateTime={log.timestamp.toISOString()} className="font-medium">
                            {formatTimestamp(log.timestamp)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
      {(canShowEarlier || canShowLater) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          {canShowLater && (
            <button
              onClick={handleShowLater}
              className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-blue-100 to-indigo-100 text-gray-700 rounded-xl hover:from-blue-200 hover:to-indigo-200 font-semibold transition-all shadow-sm hover:shadow-md"
            >
              Later logs
            </button>
          )}
          {canShowEarlier && (
            <button
              onClick={handleShowEarlier}
              className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-indigo-100 to-purple-100 text-gray-700 rounded-xl hover:from-indigo-200 hover:to-purple-200 font-semibold transition-all shadow-sm hover:shadow-md"
            >
              Earlier logs
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLog;