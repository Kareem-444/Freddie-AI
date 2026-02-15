'use client';
// ModelsManagementPage.tsx
import { useState, useEffect } from 'react';
import { 
  HiDownload, 
  HiCheckCircle, 
  HiX, 
  HiChevronLeft,
  HiClock,
  HiLightningBolt,
  HiStar,
  HiChip
} from 'react-icons/hi';
import { BiChip } from 'react-icons/bi';
import { BsCloudDownload } from 'react-icons/bs';
import axios from 'axios';

interface AIModule {
  id: string;
  display_name: string;
  description: string;
  category: string;
  size: string;
  size_bytes: number;
  parameters: string;
  speed: string;
  quality: string;
  downloaded?: boolean;
  download_status?: {
    status: string;
    progress: number;
    error: string | null;
  };
  recommended?: boolean;
  requires_ram?: string;
}

interface ModelsManagementPageProps {
  onClose: () => void;
  onSelectModel?: (model: AIModule) => void;
}

export default function ModelsManagementPage({ onClose, onSelectModel }: ModelsManagementPageProps) {
  const [models, setModels] = useState<AIModule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = [
    { id: 'all', name: 'All Models', icon: '🤖' },
    { id: 'coding', name: 'Coding', icon: '💻' },
    { id: 'general', name: 'General', icon: '🌟' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'multilingual', name: 'Multilingual', icon: '🌍' }
  ];

  useEffect(() => {
    loadModels();
    const interval = setInterval(checkDownloadProgress, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const loadModels = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/modules/');
      setModels(response.data.modules);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const checkDownloadProgress = async () => {
    if (downloadingModels.size === 0) return;
    
    try {
      const updatedModels = [...models];
      for (const modelId of downloadingModels) {
        const response = await axios.get(`http://localhost:8000/api/modules/download-status/${modelId}/`);
        const modelIndex = updatedModels.findIndex(m => m.id === modelId);
        
        if (modelIndex >= 0) {
          updatedModels[modelIndex].download_status = response.data;
          
          // If download completed, refresh models and remove from downloading set
          if (response.data.status === 'completed') {
            setDownloadingModels(prev => {
              const newSet = new Set(prev);
              newSet.delete(modelId);
              return newSet;
            });
            loadModels(); // Refresh to get updated downloaded status
          }
        }
      }
      setModels(updatedModels);
    } catch (error) {
      console.error('Error checking download progress:', error);
    }
  };

  const handleDownload = async (model: AIModule) => {
    try {
      const response = await axios.post('http://localhost:8000/api/modules/download/', {
        module_id: model.id
      });
      
      if (response.data.status === 'downloading') {
        setDownloadingModels(prev => new Set(prev).add(model.id));
      }
    } catch (error: any) {
      console.error('Error downloading model:', error);
      alert(error.response?.data?.error || 'Failed to start download');
    }
  };

  const handleDelete = async (model: AIModule) => {
    if (!confirm(`Delete ${model.display_name}? This will remove ${model.size} from your disk.`)) {
      return;
    }
    
    try {
      await axios.post('http://localhost:8000/api/modules/delete/', {
        module_id: model.id
      });
      loadModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Failed to delete model');
    }
  };

  const filteredModels = models.filter(model => {
    const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
    const matchesSearch = model.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDownloadStatus = (model: AIModule) => {
    if (model.downloaded) {
      return { status: 'downloaded', color: 'green', text: 'Downloaded' };
    }
    if (model.download_status?.status === 'downloading') {
      return { status: 'downloading', color: 'blue', text: 'Downloading...' };
    }
    if (model.download_status?.status === 'failed') {
      return { status: 'failed', color: 'red', text: 'Failed' };
    }
    return { status: 'available', color: 'gray', text: 'Download' };
  };

  const formatDownloadProgress = (status: any) => {
    if (!status || status.progress === 0) return 'Initializing...';
    return `${status.progress}%`;
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <BiChip size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-50">AI Models</h1>
                  <p className="text-sm text-slate-300">Download and manage your AI models</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Category Filter */}
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all text-sm
                    ${selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                    }
                  `}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredModels.map(model => {
              const status = getDownloadStatus(model);
              const isDownloading = model.download_status?.status === 'downloading';
              
              return (
                <div
                  key={model.id}
                  className={`
                    relative bg-slate-800/40 backdrop-blur-sm rounded-xl p-6
                    border-2 transition-all
                    ${status.status === 'downloaded' 
                      ? 'border-green-600/50 hover:border-green-500' 
                      : 'border-slate-700/50 hover:border-blue-600/50'
                    }
                    hover:shadow-xl hover:shadow-blue-900/20
                  `}
                >
                  {/* Recommended Badge */}
                  {model.recommended && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                        <HiStar size={12} />
                        RECOMMENDED
                      </span>
                    </div>
                  )}

                  {/* Model Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`
                      w-16 h-16 rounded-xl flex items-center justify-center shadow-lg
                      ${status.status === 'downloaded'
                        ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                      }
                    `}>
                      <HiChip size={32} className="text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-50 mb-1">
                        {model.display_name}
                      </h3>
                      <p className="text-sm text-slate-300 mb-2">
                        {model.description}
                      </p>
                      
                      {/* Specs */}
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <BiChip size={14} />
                          {model.parameters}
                        </span>
                        <span>•</span>
                        <span>{model.size}</span>
                        <span>•</span>
                        <span title="Speed">{model.speed}</span>
                        <span title="Quality">{model.quality}</span>
                      </div>
                    </div>
                  </div>

                  {/* Download Progress */}
                  {isDownloading && model.download_status && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-300">
                          Downloading... {formatDownloadProgress(model.download_status)}
                        </span>
                        <BsCloudDownload size={16} className="text-blue-400 animate-bounce" />
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 relative overflow-hidden"
                          style={{ width: `${model.download_status.progress || 0}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Requirements Warning */}
                  {model.requires_ram && !model.downloaded && (
                    <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                      <p className="text-xs text-amber-300 flex items-center gap-2">
                        <HiLightningBolt size={14} />
                        Requires {model.requires_ram} RAM
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {status.status === 'downloaded' ? (
                      <>
                        <button
                          onClick={() => onSelectModel?.(model)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                          <HiCheckCircle size={20} />
                          Use Model
                        </button>
                        <button
                          onClick={() => handleDelete(model)}
                          className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors"
                          title="Delete model"
                        >
                          <HiX size={20} />
                        </button>
                      </>
                    ) : isDownloading ? (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-900/50 text-blue-300 rounded-lg font-semibold cursor-not-allowed"
                      >
                        <BsCloudDownload size={20} className="animate-bounce" />
                        Downloading...
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownload(model)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        <HiDownload size={20} />
                        Download ({model.size})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredModels.length === 0 && (
            <div className="text-center py-20">
              <BiChip size={64} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-50 mb-2">No models found</h3>
              <p className="text-slate-400">Try a different category or search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6 text-slate-400">
              <span>
                <strong className="text-slate-100">{models.filter(m => m.downloaded).length}</strong> downloaded
              </span>
              <span>
                <strong className="text-slate-100">{models.length}</strong> total models
              </span>
              <span>
                <strong className="text-slate-100">{downloadingModels.size}</strong> downloading
              </span>
            </div>
            <div className="text-slate-400">
              <HiClock size={16} className="inline mr-2" />
              Updates every 2 seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}