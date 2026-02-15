'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Chat from './Chat';
import ProjectsPage from './ProjectsPage';
import ImagesPage from './ImagesPage';
import SettingsPage from './SettingsPage';
import { ToastContainer, useToast } from './Toastnotification';
import axios from 'axios';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'projects' | 'images' | 'settings'>('chat');
  const { toasts, addToast, removeToast } = useToast();

  // Load modules from backend and chats from localStorage on startup
  useEffect(() => {
    loadModules();
    loadChatsFromStorage();
    
    // Check for downloaded models periodically
    const interval = setInterval(loadModules, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadModules = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/modules/');
      setModules(response.data.modules);
      
      // Auto-select first downloaded module if none selected
      if (!selectedModule) {
        const firstDownloaded = response.data.modules.find((m: any) => m.downloaded);
        if (firstDownloaded) {
          setSelectedModule(firstDownloaded);
          console.log('✅ Auto-selected first downloaded model:', firstDownloaded.display_name);
        }
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      addToast('Failed to load AI models. Please check your connection.', 'error');
      setModules([]);
    }
  };

  const loadChatsFromStorage = () => {
    try {
      const savedChats = localStorage.getItem('freddie_chats');
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        const chatsWithDates = parsedChats.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp)
        }));
        setChats(chatsWithDates);
      }
    } catch (error) {
      console.error('Error loading chats from storage:', error);
      addToast('Failed to load chat history.', 'warning');
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewChat = () => {
    setActiveChat(null);
    setCurrentView('chat');
  };

  const handleSelectChat = (chat: any) => {
    setActiveChat(chat);
    setCurrentView('chat');
  };

  const handleSelectModule = (module: any) => {
    if (!module.downloaded) {
      addToast(`${module.display_name} is not downloaded yet. Download it from Settings.`, 'warning');
      return;
    }
    setSelectedModule(module);
    addToast(`Switched to ${module.display_name}`, 'success', 2000);
  };

  const handleSaveChat = (chat: any) => {
    setChats(prevChats => {
      const existingIndex = prevChats.findIndex(c => c.id === chat.id);
      let updatedChats;
      
      if (existingIndex >= 0) {
        updatedChats = [...prevChats];
        updatedChats[existingIndex] = chat;
      } else {
        updatedChats = [chat, ...prevChats];
      }
      
      return updatedChats;
    });
    setActiveChat(chat);
  };

  const handleOpenImages = () => {
    setCurrentView('images');
  };

  const handleOpenProjects = () => {
    setCurrentView('projects');
  };

  const handleOpenSettings = () => {
    setCurrentView('settings');
  };

  const handleCloseSpecialView = () => {
    setCurrentView('chat');
  };

  const handleInstallModule = async (moduleId: string) => {
    try {
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;

      addToast(`Starting download of ${module.display_name}...`, 'info');
      
      const response = await axios.post('http://localhost:8000/api/modules/download/', {
        module_id: moduleId
      });
      
      if (response.data.status === 'downloading') {
        addToast(`Downloading ${module.display_name}. Check Settings for progress.`, 'info', 4000);
      }
      
      // Reload modules after a delay
      setTimeout(() => loadModules(), 2000);
    } catch (error: any) {
      console.error('Error installing module:', error);
      addToast(error.response?.data?.error || 'Failed to start download', 'error');
    }
  };

  const handleUninstallModule = async (moduleId: string) => {
    try {
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;

      const response = await axios.post('http://localhost:8000/api/modules/delete/', {
        module_id: moduleId
      });
      
      addToast(`${module.display_name} uninstalled successfully!`, 'success');
      
      // If currently selected module was deleted, clear selection
      if (selectedModule?.id === moduleId) {
        const remainingDownloaded = modules.find(m => m.downloaded && m.id !== moduleId);
        setSelectedModule(remainingDownloaded || null);
      }
      
      loadModules();
    } catch (error) {
      console.error('Error uninstalling module:', error);
      addToast('Failed to uninstall module', 'error');
    }
  };

  // NEW: Handle module download completion
  const handleModuleDownloaded = (module: any) => {
    console.log('🎉 Module downloaded:', module.display_name);
    
    // Auto-select the downloaded model
    setSelectedModule(module);
    
    // Show success message
    addToast(`${module.display_name} ready! You can now start chatting.`, 'success', 5000);
    
    // Switch to chat view
    setCurrentView('chat');
    
    // Start a new chat with the downloaded model
    setActiveChat(null);
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-slate-950">
        {/* Show sidebar only in chat view */}
        {currentView === 'chat' && (
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={handleToggleSidebar}
            chats={chats}
            activeChat={activeChat}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            modules={modules}
            selectedModule={selectedModule}
            onSelectModule={handleSelectModule}
            onOpenImages={handleOpenImages}
            onOpenProjects={handleOpenProjects}
            onOpenSettings={handleOpenSettings}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'chat' && (
            <Chat
              toggleComponentVisibility={handleToggleSidebar}
              selectedModule={selectedModule}
              onSelectModule={handleSelectModule}
              modules={modules}
              activeChat={activeChat}
              onSaveChat={handleSaveChat}
              onOpenSettings={handleOpenSettings}
            />
          )}
          
          {currentView === 'projects' && (
            <ProjectsPage onClose={handleCloseSpecialView} />
          )}
          
          {currentView === 'images' && (
            <ImagesPage onClose={handleCloseSpecialView} />
          )}
          
          {currentView === 'settings' && (
            <SettingsPage 
              onClose={handleCloseSpecialView}
              modules={modules}
              onInstallModule={handleInstallModule}
              onUninstallModule={handleUninstallModule}
              onModuleDownloaded={handleModuleDownloaded} // NEW: Pass callback
            />
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}