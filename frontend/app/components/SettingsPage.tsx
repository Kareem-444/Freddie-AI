'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  HiX, 
  HiChevronLeft, 
  HiCog, 
  HiUser, 
  HiBell, 
  HiShieldCheck,
  HiColorSwatch,
  HiDownload,
  HiTrash,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
  HiLightningBolt,
  HiChip,
  HiDatabase,
  HiRefresh,
  HiX as HiCancel
} from 'react-icons/hi';
import { BiChip } from 'react-icons/bi';
import { BsToggleOn, BsToggleOff, BsCloudDownload, BsSpeedometer2 } from 'react-icons/bs';
import axios from 'axios';

interface AIModule {
  id: string;
  display_name: string;
  description: string;
  category: string;
  size: string;
  size_bytes: number;
  parameters: string;
  context_length: number;
  speed: string;
  quality: string;
  recommended?: boolean;
  bundled?: boolean;
  requires_ram?: string;
  hf_repo: string;
  hf_filename: string;
  downloaded?: boolean;
  is_downloading?: boolean;
  download_status?: {
    status: 'idle' | 'downloading' | 'completed' | 'failed' | 'retrying' | 'cancelled';
    progress: number;
    downloaded_bytes?: number;
    total_bytes?: number;
    speed?: number;
    eta?: number;
    error?: string | null;
    retries?: number;
  };
}

interface SettingsPageProps {
  onClose: () => void;
  modules: AIModule[];
  onInstallModule?: (moduleId: string) => void;
  onUninstallModule?: (moduleId: string) => void;
  onModuleDownloaded?: (module: AIModule) => void;
}

export default function SettingsPage({ 
  onClose, 
  modules: initialModules, 
  onInstallModule, 
  onUninstallModule,
  onModuleDownloaded 
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState('models');
  const [modules, setModules] = useState<AIModule[]>(initialModules);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [diskSpace, setDiskSpace] = useState({ total: 0, used: 0, available: 0 });
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: 'success' | 'error' | 'info'}>>([]);
  const toastIdRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    autoSave: true,
    darkMode: true,
    compactMode: false,
    showTimestamps: true,
    enableAnalytics: false,
  });

  useEffect(() => {
    loadModules();
    loadDiskSpace();
  }, []);

  // OPTIMIZED: Poll every 10 seconds (not 1!)
  useEffect(() => {
    const hasDownloads = modules.some(m => m.is_downloading);
    
    if (hasDownloads) {
      if (!pollingIntervalRef.current) {
        console.log('🔄 Starting optimized polling (10s interval)');
        pollingIntervalRef.current = setInterval(() => {
          loadModulesQuiet();
        }, 10000); // 10 SECONDS - much better!
      }
    } else {
      if (pollingIntervalRef.current) {
        console.log('⏸️ Stopping polling - no active downloads');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [modules]);

  const loadModules = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/modules/');
      console.log('📋 Loaded modules');
      
      const loadedModules = response.data.modules;
      setModules(loadedModules);
      
      loadedModules.forEach((module: AIModule) => {
        const prevModule = modules.find(m => m.id === module.id);
        
        if (prevModule?.is_downloading && module.downloaded && !module.is_downloading) {
          console.log(`✅ Download completed: ${module.display_name}`);
          showToast(`${module.display_name} downloaded successfully!`, 'success');
          
          if (onModuleDownloaded) {
            onModuleDownloaded(module);
          }
        }
        
        if (prevModule?.is_downloading && module.download_status?.status === 'failed') {
          console.error(`❌ Download failed: ${module.display_name}`);
          showToast(`Download failed: ${module.download_status.error || 'Unknown error'}`, 'error');
        }
      });
      
    } catch (error) {
      console.error('❌ Error loading modules:', error);
    }
  };

  const loadModulesQuiet = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/modules/');
      const loadedModules = response.data.modules;
      
      setModules(prevModules => {
        loadedModules.forEach((module: AIModule) => {
          const prevModule = prevModules.find(m => m.id === module.id);
          
          if (prevModule?.is_downloading && module.downloaded && !module.is_downloading) {
            showToast(`${module.display_name} downloaded successfully!`, 'success');
            if (onModuleDownloaded) {
              onModuleDownloaded(module);
            }
          }
          
          if (prevModule?.is_downloading && module.download_status?.status === 'failed') {
            showToast(`Download failed: ${module.download_status.error}`, 'error');
          }
        });
        
        return loadedModules;
      });
      
    } catch (error) {
      // Silent
    }
  };

  const loadDiskSpace = async () => {
    try {
      setDiskSpace({
        total: 512000000000,
        used: 256000000000,
        available: 256000000000
      });
    } catch (error) {
      console.error('Error loading disk space:', error);
    }
  };

  const handleDownload = async (model: AIModule) => {
    console.log('📥 Starting download for:', model.display_name);
    
    if (model.size_bytes > diskSpace.available) {
      showToast(`Insufficient disk space!`, 'error');
      return;
    }

    if (model.is_downloading) {
      showToast(`${model.display_name} is already downloading...`, 'info');
      return;
    }

    if (model.downloaded) {
      showToast(`${model.display_name} is already downloaded!`, 'info');
      return;
    }

    try {
      showToast(`Starting download of ${model.display_name}...`, 'info');
      
      const response = await axios.post('http://localhost:8000/api/modules/download/', {
        module_id: model.id
      });
      
      console.log('📥 Download response:', response.data);
      
      if (response.data.status === 'downloading') {
        showToast(`Downloading ${model.display_name} in background...`, 'info');
        await loadModules();
      } else if (response.data.status === 'already_downloaded') {
        showToast(`${model.display_name} is already downloaded!`, 'success');
        await loadModules();
      } else if (response.data.status === 'already_downloading') {
        showToast(`${model.display_name} is already downloading`, 'info');
        await loadModules();
      }
    } catch (error: any) {
      console.error('❌ Error downloading model:', error);
      showToast(error.response?.data?.error || 'Failed to start download', 'error');
    }
  };

  const handleCancelDownload = async (model: AIModule) => {
    if (!confirm(`Cancel download of ${model.display_name}?`)) {
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:8000/api/modules/cancel/', {
        module_id: model.id
      });
      
      console.log('🛑 Cancel response:', response.data);
      showToast(`Download cancelled for ${model.display_name}`, 'info');
      
      await loadModules();
    } catch (error: any) {
      console.error('❌ Error cancelling download:', error);
      showToast('Failed to cancel download', 'error');
    }
  };

  const handleDelete = async (model: AIModule) => {
    if (!confirm(`Delete ${model.display_name}? This will free up ${model.size}.`)) {
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:8000/api/modules/delete/', {
        module_id: model.id
      });
      
      console.log('🗑️ Delete response:', response.data);
      showToast(`${model.display_name} deleted successfully!`, 'success');
      
      await loadModules();
      loadDiskSpace();
    } catch (error: any) {
      console.error('❌ Error deleting model:', error);
      showToast('Failed to delete model', 'error');
    }
  };

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = toastIdRef.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => formatBytes(bytesPerSecond) + '/s';
  const formatETA = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const categories = [
    { id: 'all', name: 'All Models', icon: '🤖', count: modules.length },
    { id: 'coding', name: 'Coding', icon: '💻', count: modules.filter(m => m.category === 'coding').length },
    { id: 'general', name: 'General', icon: '🌟', count: modules.filter(m => m.category === 'general').length },
    { id: 'creative', name: 'Creative', icon: '🎨', count: modules.filter(m => m.category === 'creative').length },
    { id: 'multilingual', name: 'Multilingual', icon: '🌍', count: modules.filter(m => m.category === 'multilingual').length }
  ];

  const filteredModules = modules.filter(model => {
    const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
    const matchesSearch = model.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const downloadedCount = modules.filter(m => m.downloaded).length;
  const downloadingCount = modules.filter(m => m.is_downloading).length;

  const tabs = [
    { id: 'general', label: 'General', icon: HiCog },
    { id: 'models', label: 'AI Models', icon: BiChip, badge: downloadedCount },
    { id: 'account', label: 'Account', icon: HiUser },
    { id: 'appearance', label: 'Appearance', icon: HiColorSwatch },
    { id: 'notifications', label: 'Notifications', icon: HiBell },
    { id: 'privacy', label: 'Privacy', icon: HiShieldCheck },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border-2 
              animate-slide-in-right max-w-md
              ${toast.type === 'success' ? 'bg-green-900/90 border-green-600 text-green-100' : ''}
              ${toast.type === 'error' ? 'bg-red-900/90 border-red-600 text-red-100' : ''}
              ${toast.type === 'info' ? 'bg-blue-900/90 border-blue-600 text-blue-100' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <HiCheckCircle size={20} />}
              {toast.type === 'error' && <HiExclamationCircle size={20} />}
              {toast.type === 'info' && <HiInformationCircle size={20} />}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Polling Indicator */}
      {downloadingCount > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="px-3 py-2 bg-blue-900/90 border-2 border-blue-600 rounded-lg text-blue-100 text-xs flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            {downloadingCount} download{downloadingCount > 1 ? 's' : ''} in progress (checking every 10s)
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all text-slate-100 group"
              >
                <HiChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                  <HiCog size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-50">Settings</h1>
                  <p className="text-sm text-slate-300">Freddie AI - Background Downloads</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        <div className="max-w-7xl mx-auto w-full flex gap-6 p-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 sticky top-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left
                      ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="flex-1">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
              
              {activeTab === 'models' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-50 mb-2">AI Models Management</h2>
                    <p className="text-slate-300">Background downloads with auto-retry and resume</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                          <HiCheckCircle size={24} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-50">{downloadedCount}</p>
                          <p className="text-xs text-slate-400">Downloaded</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                          <BiChip size={24} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-50">{modules.length}</p>
                          <p className="text-xs text-slate-400">Available</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          downloadingCount > 0 ? 'bg-blue-600/20' : 'bg-violet-600/20'
                        }`}>
                          <BsCloudDownload size={24} className={
                            downloadingCount > 0 ? 'text-blue-400 animate-bounce' : 'text-violet-400'
                          } />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-50">{downloadingCount}</p>
                          <p className="text-xs text-slate-400">In Progress</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex gap-2 flex-wrap flex-1">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`
                            px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2
                            ${selectedCategory === cat.id
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                            }
                          `}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                          <span className="text-xs opacity-75">({cat.count})</span>
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none min-w-[200px]"
                    />
                    <button
                      onClick={loadModules}
                      className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-all"
                      title="Refresh"
                    >
                      <HiRefresh size={20} className="text-slate-300" />
                    </button>
                  </div>

                  {/* Models Grid */}
                  <div className="space-y-3">
                    {filteredModules.map(model => {
                      const isDownloading = model.is_downloading || false;
                      const downloadProgress = model.download_status?.progress || 0;
                      const isRetrying = model.download_status?.status === 'retrying';
                      
                      return (
                        <div
                          key={model.id}
                          className={`
                            bg-slate-900/50 rounded-xl p-5 border-2 transition-all hover:shadow-xl
                            ${model.downloaded 
                              ? 'border-green-600/50 hover:border-green-500' 
                              : isDownloading
                              ? 'border-blue-600/50 hover:border-blue-500'
                              : 'border-slate-700/50 hover:border-slate-600/50'
                            }
                          `}
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`
                              w-16 h-16 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0
                              ${model.downloaded
                                ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                                : isDownloading
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 animate-pulse'
                                : 'bg-gradient-to-br from-slate-600 to-slate-700'
                              }
                            `}>
                              <HiChip size={32} className="text-white" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-lg font-bold text-slate-50">{model.display_name}</h3>
                                    {model.recommended && (
                                      <span className="px-2 py-0.5 bg-amber-900/50 text-amber-300 text-xs font-bold rounded-full border border-amber-700/50">
                                        ⭐ RECOMMENDED
                                      </span>
                                    )}
                                    {model.downloaded && !isDownloading && (
                                      <span className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs font-bold rounded-full border border-green-700/50 flex items-center gap-1">
                                        <HiCheckCircle size={12} />
                                        INSTALLED
                                      </span>
                                    )}
                                    {isDownloading && (
                                      <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs font-bold rounded-full border border-blue-700/50 flex items-center gap-1 animate-pulse">
                                        <BsCloudDownload size={12} className="animate-bounce" />
                                        {isRetrying ? `RETRYING (${model.download_status?.retries}/3)` : `DOWNLOADING ${downloadProgress}%`}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-300 mb-2">{model.description}</p>
                                  
                                  {/* Specs */}
                                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <BiChip size={14} className="text-blue-400" />
                                      {model.parameters}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <HiDatabase size={14} className="text-indigo-400" />
                                      {model.size}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <BsSpeedometer2 size={14} className="text-violet-400" />
                                      {model.speed}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <HiLightningBolt size={14} className="text-amber-400" />
                                      {model.quality}
                                    </span>
                                  </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex items-start gap-2 ml-4 flex-shrink-0">
                                  {model.downloaded && !isDownloading ? (
                                    <>
                                      <button
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all shadow-lg text-sm flex items-center gap-2"
                                      >
                                        <HiCheckCircle size={18} />
                                        Ready
                                      </button>
                                      <button
                                        onClick={() => handleDelete(model)}
                                        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors"
                                      >
                                        <HiTrash size={18} />
                                      </button>
                                    </>
                                  ) : isDownloading ? (
                                    <>
                                      <button
                                        disabled
                                        className="px-4 py-2 bg-blue-900/50 text-blue-300 rounded-lg font-semibold cursor-not-allowed text-sm flex items-center gap-2"
                                      >
                                        <BsCloudDownload size={18} className="animate-bounce" />
                                        {downloadProgress}%
                                      </button>
                                      <button
                                        onClick={() => handleCancelDownload(model)}
                                        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors"
                                        title="Cancel"
                                      >
                                        <HiCancel size={18} />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleDownload(model)}
                                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold transition-all shadow-lg text-sm flex items-center gap-2"
                                    >
                                      <HiDownload size={18} />
                                      Download
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Progress Bar */}
                              {isDownloading && model.download_status && (
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-4 text-blue-300">
                                      <span className="font-semibold">
                                        {isRetrying ? 'Retrying...' : `Downloading... ${downloadProgress}%`}
                                      </span>
                                      {model.download_status.speed && (
                                        <span>{formatSpeed(model.download_status.speed)}</span>
                                      )}
                                      {model.download_status.eta && (
                                        <span>ETA: {formatETA(model.download_status.eta)}</span>
                                      )}
                                    </div>
                                    {model.download_status.downloaded_bytes && model.download_status.total_bytes && (
                                      <span className="text-slate-400">
                                        {formatBytes(model.download_status.downloaded_bytes)} / {formatBytes(model.download_status.total_bytes)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 relative overflow-hidden"
                                      style={{ width: `${downloadProgress}%` }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Warnings */}
                              {model.requires_ram && !model.downloaded && !isDownloading && (
                                <div className="mt-3 p-2 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                                  <p className="text-xs text-amber-300 flex items-center gap-2">
                                    <HiExclamationCircle size={14} />
                                    Requires {model.requires_ram} RAM
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredModules.length === 0 && (
                      <div className="text-center py-20">
                        <BiChip size={64} className="mx-auto text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-50 mb-2">No models found</h3>
                        <p className="text-slate-400">Try different filters</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other tabs remain the same... */}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-shimmer { animation: shimmer 2s infinite; }
      `}</style>
    </div>
  );
}

function SettingItem({ label, description, enabled, onToggle, disabled = false }: any) {
  return (
    <div className={`flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 ${disabled ? 'opacity-50' : 'hover:border-slate-600/50'} transition-all`}>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-100 mb-1">{label}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <button onClick={onToggle} disabled={disabled} className={disabled ? 'cursor-not-allowed' : ''}>
        {enabled ? <BsToggleOn size={48} className="text-blue-500" /> : <BsToggleOff size={48} className="text-slate-600" />}
      </button>
    </div>
  );
}