import React, { useState } from 'react';
import { Project, User, Role } from '../types';

interface ProjectManagementProps {
  projects: Project[];
  users: User[];
  onAddProject: (name: string) => void;
  onUpdateUserMemberships: (userId: string, memberships: { projectId: string; role: Role }[]) => void;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({
  projects,
  users,
  onAddProject,
  onUpdateUserMemberships
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userToAdd, setUserToAdd] = useState('');
  const [roleToAssign, setRoleToAssign] = useState<Role>(Role.MEMBER);

  const handleProjectCreate = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  const handleAddUserToProject = () => {
    if (!selectedProject || !userToAdd) return;
    const user = users.find(u => u.id === userToAdd);
    if (!user) return;
    const existingMembership = user.memberships.find(m => m.projectId === selectedProject.id);
    if (existingMembership) {
      alert(`${user.name} is already in this project.`);
      return;
    }
    const updatedMemberships = [...user.memberships, { projectId: selectedProject.id, role: roleToAssign }];
    onUpdateUserMemberships(user.id, updatedMemberships);
    setUserToAdd('');
  };

  const handleRemoveUserFromProject = (userId: string) => {
    if (!selectedProject) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const updatedMemberships = user.memberships.filter(m => m.projectId !== selectedProject.id);
    onUpdateUserMemberships(user.id, updatedMemberships);
  };

  const getProjectMembers = (projectId: string) => {
    return users.filter(u => u.memberships.some(m => m.projectId === projectId));
  };

  const getRoleInProject = (user: User, projectId: string) => {
    return user.memberships.find(m => m.projectId === projectId)?.role || 'N/A';
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case Role.MEDIATOR:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case Role.MEMBER:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-white">📁 Project Management</h1>
        <p className="text-white/90">Create and manage projects</p>
      </div>

      {/* Create New Project */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>➕</span> Create New Project
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleProjectCreate()}
            placeholder="Enter project name..."
            className="flex-grow px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          />
          <button
            onClick={handleProjectCreate}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg font-semibold transition-all transform hover:scale-105"
          >
            Create
          </button>
        </div>
      </div>

      {/* Projects List & Management */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>⚙️</span> Manage Projects & Members
        </h3>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Projects List */}
          <div className="lg:w-1/3">
            <h4 className="font-semibold text-gray-700 mb-3">Projects ({projects.length})</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {projects.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No projects yet</div>
              ) : (
                projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedProject?.id === p.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-indigo-200'
                    }`}
                  >
                    <div className={`font-semibold ${selectedProject?.id === p.id ? 'text-white' : 'text-gray-800'}`}>{p.name}</div>
                    <div className={`text-xs mt-1 ${selectedProject?.id === p.id ? 'text-white/90' : 'text-gray-500'}`}>
                      {getProjectMembers(p.id).length} members
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Project Details & Members */}
          <div className="lg:w-2/3">
            {selectedProject ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-800">
                    Members of <span className="text-indigo-600">{selectedProject.name}</span>
                  </h4>
                  <span className="text-sm text-gray-500">
                    {getProjectMembers(selectedProject.id).length} members
                  </span>
                </div>

                {/* Add Member Form */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-100">
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>➕</span> Add Member
                  </h5>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={userToAdd}
                      onChange={e => setUserToAdd(e.target.value)}
                      className="flex-grow p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                    >
                      <option value="">-- Select User --</option>
                      {users
                        .filter(u => !getProjectMembers(selectedProject.id).some(pm => pm.id === u.id))
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    <select
                      value={roleToAssign}
                      onChange={e => setRoleToAssign(e.target.value as Role)}
                      className="p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                    >
                      {Object.values(Role).filter(r => r !== Role.ADMIN).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddUserToProject}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg font-semibold transition-all transform hover:scale-105 whitespace-nowrap"
                    >
                      Add Member
                    </button>
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getProjectMembers(selectedProject.id).length === 0 ? (
                    <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl">
                      No members in this project
                    </div>
                  ) : (
                    getProjectMembers(selectedProject.id).map(member => {
                      const role = getRoleInProject(member, selectedProject.id);
                      return (
                        <div
                          key={member.id}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border-2 border-gray-100 hover:border-indigo-200 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{member.name}</div>
                              <span className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(role as Role)}`}>
                                {role}
                              </span>
                            </div>
                          </div>
                          {role !== Role.ADMIN && (
                            <button
                              onClick={() => handleRemoveUserFromProject(member.id)}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="text-4xl mb-4">👈</div>
                <p className="text-lg font-medium">Select a project to manage its members</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagement;

