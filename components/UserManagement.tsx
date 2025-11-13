import React, { useState } from 'react';
import { User, Role } from '../types';

interface UserManagementProps {
  users: User[];
  onUpdateUserAdmin: (userId: string, isAdmin: boolean) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUserAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' 
      ? true 
      : filterRole === 'admin' 
        ? user.isAdmin 
        : !user.isAdmin;
    return matchesSearch && matchesFilter;
  });

  const adminCount = users.filter(u => u.isAdmin).length;
  const regularUserCount = users.filter(u => !u.isAdmin).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-white">👥 User Management</h1>
        <p className="text-white/90">Manage user permissions and admin status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Total Users</span>
            <span className="text-2xl">👥</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{users.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Admins</span>
            <span className="text-2xl">👑</span>
          </div>
          <div className="text-3xl font-bold text-purple-600">{adminCount}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Regular Users</span>
            <span className="text-2xl">👤</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{regularUserCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search users..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filterRole === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterRole('admin')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filterRole === 'admin'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setFilterRole('user')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filterRole === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Users
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📋</span> User List ({filteredUsers.length})
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-xl">
              <div className="text-4xl mb-4">🔍</div>
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-100 hover:border-pink-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    user.isAdmin
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                      : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{user.name}</span>
                      {user.isAdmin && (
                        <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold rounded-full shadow-sm">
                          👑 ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {user.memberships.length} project{user.memberships.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={user.isAdmin ?? false}
                    onChange={(e) => onUpdateUserAdmin(user.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-rose-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">About Admin Privileges</h4>
            <p className="text-sm text-gray-600">
              Admins have full access to all projects and can manage users, projects, and tickets system-wide. 
              Use this toggle to grant or revoke admin privileges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

