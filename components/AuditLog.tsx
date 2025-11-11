import React from 'react';
import { AuditLogEntry, User, Role } from '../types';

interface AuditLogProps {
  auditLog: AuditLogEntry[];
  findUser: (id: string) => User | undefined;
  currentUserRole?: Role;
}

const AuditLog: React.FC<AuditLogProps> = ({ auditLog, findUser, currentUserRole }) => {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 h-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4 dark:border-gray-700">Ticket History</h3>
      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {auditLog.map((log, logIdx) => {
            const actorDisplay =
              currentUserRole === Role.MEDIATOR || currentUserRole === Role.ADMIN
                ? `${findUser(log.userId)?.name || 'Unknown User'} (${log.role})`
                : log.role;

            return (
              <li key={log.id}>
                <div className="relative pb-8">
                  {logIdx !== auditLog.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                        <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {log.details}{' '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            by {actorDisplay}
                          </span>
                        </p>
                      </div>
                      <div className="text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <time dateTime={log.timestamp.toISOString()}>
                          {log.timestamp.toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  );
};

export default AuditLog;