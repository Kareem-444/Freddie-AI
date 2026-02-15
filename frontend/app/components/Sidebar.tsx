'use client';
//Sidebar-Updated.tsx
import { useState } from 'react';
import Image from 'next/image';
import { 
  HiPlus, 
  HiChatAlt2, 
  HiCog,
  HiX,
  HiSparkles,
  HiLightningBolt,
  HiChevronRight,
  HiPhotograph
} from 'react-icons/hi';
import { BsImages, BsFolderPlus } from 'react-icons/bs';
import { MdWorkspaces } from 'react-icons/md';

interface Chat {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: any[];
}

interface AIModule {
  id: string;
  display_name: string;
  description: string;
  installed: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: Chat[];
  activeChat: Chat | null;
  onNewChat: () => void;
  onSelectChat: (chat: Chat) => void;
  modules: AIModule[];
  selectedModule: AIModule | null;
  onSelectModule: (module: AIModule) => void;
  onOpenImages?: () => void;
  onOpenProjects?: () => void;
  onOpenSettings?: () => void; // NEW: Added settings handler
}

export default function Sidebar({ 
  isOpen, 
  onToggle, 
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  modules,
  selectedModule,
  onSelectModule,
  onOpenImages,
  onOpenProjects,
  onOpenSettings // NEW
}: SidebarProps) {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) return 'Today';
    if (hours < 48) return 'Yesterday';
    if (hours < 168) return `${Math.floor(hours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <aside className={`
      h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-r border-slate-700/50
      flex flex-col shadow-2xl
      transition-all duration-500 ease-in-out
      ${isOpen ? 'w-[300px]' : 'w-0'}
      overflow-hidden
    `}>
      
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 animate-gradient">
            <Image 
              src="/images/freddie.png" 
              alt="Freddie Logo" 
              width={40} 
              height={40}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-lg tracking-tight">Freddie AI</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <HiSparkles size={12} className="text-blue-400" />
              AI Assistant
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-slate-800/50 rounded-lg transition-all duration-200 hover:rotate-90 text-slate-300"
          title="Close sidebar"
        >
          <HiX size={18} />
        </button>
      </div>

      {/* Quick Actions Section */}
      <div className="px-3 py-4 space-y-2 border-b border-slate-700/50 flex-shrink-0">
        {/* New Chat Button */}
        <button 
          onClick={onNewChat}
          onMouseEnter={() => setHoveredSection('newchat')}
          onMouseLeave={() => setHoveredSection(null)}
          className="
            w-full flex items-center gap-3 
            px-4 py-3
            bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-500 hover:to-indigo-500
            text-white rounded-xl
            transition-all duration-300
            font-medium text-sm
            shadow-lg hover:shadow-xl hover:scale-[1.02]
            group relative overflow-hidden
          "
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-shimmer"></div>
          <HiPlus size={20} className={`transition-transform duration-300 ${hoveredSection === 'newchat' ? 'rotate-90' : ''}`} />
          <span>New Chat</span>
          <HiLightningBolt size={16} className="ml-auto text-blue-200 animate-pulse" />
        </button>

        {/* Images Button */}
        <button 
          onClick={onOpenImages}
          onMouseEnter={() => setHoveredSection('images')}
          onMouseLeave={() => setHoveredSection(null)}
          className="
            w-full flex items-center gap-3 
            px-4 py-3
            bg-gradient-to-r from-violet-600 to-purple-600
            hover:from-violet-500 hover:to-purple-500
            text-white rounded-xl
            transition-all duration-300
            font-medium text-sm
            shadow-lg hover:shadow-xl hover:scale-[1.02]
            group relative overflow-hidden
          "
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-shimmer"></div>
          <BsImages size={18} className={`transition-transform duration-300 ${hoveredSection === 'images' ? 'scale-110' : ''}`} />
          <span>Images</span>
          <HiPhotograph size={16} className="ml-auto animate-bounce-slow" />
        </button>

        {/* Projects Button */}
        <button 
          onClick={onOpenProjects}
          onMouseEnter={() => setHoveredSection('projects')}
          onMouseLeave={() => setHoveredSection(null)}
          className="
            w-full flex items-center gap-3 
            px-4 py-3
            bg-gradient-to-r from-cyan-600 to-teal-600
            hover:from-cyan-500 hover:to-teal-500
            text-white rounded-xl
            transition-all duration-300
            font-medium text-sm
            shadow-lg hover:shadow-xl hover:scale-[1.02]
            group relative overflow-hidden
          "
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-shimmer"></div>
          <MdWorkspaces size={20} className={`transition-transform duration-300 ${hoveredSection === 'projects' ? 'rotate-12' : ''}`} />
          <span>Projects</span>
          <BsFolderPlus size={16} className="ml-auto animate-pulse" />
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <HiChatAlt2 size={16} className="text-blue-400 animate-pulse-slow" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Recent Chats
          </span>
          <div className="ml-auto w-6 h-6 rounded-full bg-slate-800/50 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-300">{chats.length}</span>
          </div>
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="relative">
              <HiChatAlt2 size={48} className="mx-auto text-slate-700/50 mb-3 animate-float" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-700/30 rounded-full blur-xl opacity-50 animate-pulse"></div>
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">No conversations yet</p>
            <p className="text-xs text-slate-500">Click "New Chat" to begin</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Today's Chats */}
            {chats.some(c => formatTime(c.timestamp) === 'Today') && (
              <div className="mb-3">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
                  <p className="text-xs font-semibold text-slate-400">Today</p>
                </div>
                {chats.filter(c => formatTime(c.timestamp) === 'Today').map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat)}
                    onMouseEnter={() => setHoveredChat(chat.id)}
                    onMouseLeave={() => setHoveredChat(null)}
                    className={`
                      w-full text-left px-3 py-3 rounded-xl
                      transition-all duration-200
                      group
                      ${activeChat?.id === chat.id 
                        ? 'bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-2 border-blue-600 shadow-lg shadow-blue-900/50' 
                        : hoveredChat === chat.id 
                          ? 'bg-slate-800/40 shadow-sm scale-[1.02]' 
                          : 'hover:bg-slate-800/20'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <HiChatAlt2 size={16} className={`mt-0.5 flex-shrink-0 transition-colors duration-200 ${activeChat?.id === chat.id ? 'text-blue-400' : 'text-slate-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {chat.title}
                        </p>
                        {chat.preview && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {chat.preview}
                          </p>
                        )}
                      </div>
                      {hoveredChat === chat.id && (
                        <HiChevronRight size={16} className="text-blue-400 animate-slide-right" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Previous Chats */}
            {chats.some(c => formatTime(c.timestamp) !== 'Today') && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                  <p className="text-xs font-semibold text-slate-400">Previous</p>
                </div>
                {chats.filter(c => formatTime(c.timestamp) !== 'Today').map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat)}
                    onMouseEnter={() => setHoveredChat(chat.id)}
                    onMouseLeave={() => setHoveredChat(null)}
                    className={`
                      w-full text-left px-3 py-3 rounded-xl
                      transition-all duration-200
                      ${activeChat?.id === chat.id 
                        ? 'bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-2 border-blue-600 shadow-lg shadow-blue-900/50' 
                        : hoveredChat === chat.id 
                          ? 'bg-slate-800/40 shadow-sm' 
                          : 'hover:bg-slate-800/20'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <HiChatAlt2 size={16} className={`mt-0.5 flex-shrink-0 transition-colors duration-200 ${activeChat?.id === chat.id ? 'text-blue-400' : 'text-slate-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {chat.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatTime(chat.timestamp)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Profile Footer - UPDATED with Settings functionality */}
      <div className="border-t border-slate-700/50 p-3 flex-shrink-0 bg-slate-900/80">
        <button 
          onClick={onOpenSettings}
          className="
            w-full flex items-center gap-3 
            px-3 py-3 rounded-xl 
            hover:bg-slate-800/50
            transition-all duration-300
            group
            border-2 border-transparent hover:border-slate-700/50
          "
        >
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <span className="text-white text-sm font-bold">U</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse"></div>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">User</p>
            <p className="text-xs text-slate-400 truncate">Settings</p>
          </div>
          <HiCog 
            size={20} 
            className="text-slate-400 group-hover:text-slate-300 group-hover:rotate-90 transition-all duration-500 flex-shrink-0" 
          />
        </button>
      </div>
    </aside>
  );
}