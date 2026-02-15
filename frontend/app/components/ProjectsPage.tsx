'use client';
//ProjectsPage.tsx
import { useState } from 'react';
import { HiPlus, HiFolder, HiDotsVertical, HiX, HiPencil, HiTrash, HiChevronLeft } from 'react-icons/hi';
import { MdWorkspaces } from 'react-icons/md';
import { BsFolderPlus } from 'react-icons/bs';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  chatCount: number;
}

interface ProjectsPageProps {
  onClose: () => void;
}

export default function ProjectsPage({ onClose }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Web Development Project',
      description: 'Building a modern web application with React and Node.js',
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(Date.now() - 86400000),
      chatCount: 12
    },
    {
      id: '2',
      name: 'AI Research',
      description: 'Exploring machine learning algorithms and implementations',
      createdAt: new Date(Date.now() - 86400000 * 10),
      updatedAt: new Date(Date.now() - 86400000 * 2),
      chatCount: 8
    }
  ]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: newProjectName,
        description: newProjectDescription,
        createdAt: new Date(),
        updatedAt: new Date(),
        chatCount: 0
      };
      setProjects([newProject, ...projects]);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowNewProject(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    setActiveMenu(null);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all text-slate-100 group"
                title="Back to chat"
              >
                <HiChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center shadow-lg">
                  <MdWorkspaces size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-50">Projects</h1>
                  <p className="text-sm text-slate-300">Organize and manage your work</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <HiPlus size={20} />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Total Projects</p>
                  <p className="text-3xl font-bold text-slate-50 mt-1">{projects.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                  <HiFolder size={24} className="text-cyan-400" />
                </div>
              </div>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Active Chats</p>
                  <p className="text-3xl font-bold text-slate-50 mt-1">
                    {projects.reduce((acc, p) => acc + p.chatCount, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-teal-600/20 flex items-center justify-center">
                  <MdWorkspaces size={24} className="text-teal-400" />
                </div>
              </div>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">This Week</p>
                  <p className="text-3xl font-bold text-slate-50 mt-1">
                    {projects.filter(p => {
                      const diff = Date.now() - p.updatedAt.getTime();
                      return diff < 7 * 24 * 60 * 60 * 1000;
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                  <BsFolderPlus size={24} className="text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-slate-800/40 backdrop-blur-sm border-2 border-slate-700/50 hover:border-cyan-600 rounded-xl p-6 transition-all hover:shadow-xl hover:shadow-cyan-900/50 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center shadow-lg">
                    <HiFolder size={24} className="text-white" />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                      className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300"
                    >
                      <HiDotsVertical size={18} />
                    </button>
                    {activeMenu === project.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                        <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-slate-100 text-sm">
                          <HiPencil size={16} />
                          <span>Edit Project</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-600 transition-colors text-slate-100 text-sm"
                        >
                          <HiTrash size={16} />
                          <span>Delete Project</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-50 mb-2 group-hover:text-cyan-300 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{project.chatCount} chats</span>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {projects.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                <BsFolderPlus size={48} className="text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-50 mb-2">No projects yet</h3>
              <p className="text-slate-300 mb-6">Create your first project to get started</p>
              <button
                onClick={() => setShowNewProject(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl font-medium shadow-lg transition-all"
              >
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-cyan-600 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-50">Create New Project</h2>
              <button
                onClick={() => {
                  setShowNewProject(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                }}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
              >
                <HiX size={24} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-xl text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Description
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="What is this project about?..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-xl text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
                <button
                  onClick={() => {
                    setShowNewProject(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                  }}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}