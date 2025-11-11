
import React, { useState } from 'react';
import { Project, User, Role } from '../types';

interface AdminDashboardProps {
  projects: Project[];
  users: User[];
  onAddProject: (name: string) => void;
  onUpdateUserMemberships: (userId: string, memberships: { projectId: string; role: Role }[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ projects, users, onAddProject, onUpdateUserMemberships }) => {
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
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Create New Project</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project Name"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={handleProjectCreate} className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">
            Create
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Manage Projects & Users</h3>
        <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
                <h4 className="font-semibold mb-2">Projects</h4>
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {projects.map(p => (
                        <li key={p.id} onClick={() => setSelectedProject(p)} className={`p-3 rounded-md cursor-pointer transition-colors ${selectedProject?.id === p.id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                           {p.name}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="md:w-2/3">
                {selectedProject ? (
                    <div className="space-y-6">
                        <h4 className="text-lg font-semibold mb-2">Members of {selectedProject.name}</h4>
                        <div className="p-4 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50">
                            <h5 className="font-semibold mb-3">Add Member</h5>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <select value={userToAdd} onChange={e => setUserToAdd(e.target.value)} className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 w-full">
                                    <option value="">-- Select User --</option>
                                    {users.filter(u => !getProjectMembers(selectedProject.id).some(pm => pm.id === u.id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                                <select value={roleToAssign} onChange={e => setRoleToAssign(e.target.value as Role)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 w-full sm:w-auto">
                                    {Object.values(Role).filter(r => r !== Role.ADMIN).map(r => (
                                       <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                                <button onClick={handleAddUserToProject} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 w-full sm:w-auto">Add</button>
                            </div>
                        </div>
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                           {getProjectMembers(selectedProject.id).map(member => (
                               <li key={member.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                   <div>
                                       <span className="font-medium">{member.name}</span>
                                       <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({getRoleInProject(member, selectedProject.id)})</span>
                                   </div>
                                   {getRoleInProject(member, selectedProject.id) !== Role.ADMIN && (
                                     <button onClick={() => handleRemoveUserFromProject(member.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                                   )}
                               </li>
                           ))}
                        </ul>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 pt-16 h-full flex items-center justify-center">
                        <p>Select a project to manage its members.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;