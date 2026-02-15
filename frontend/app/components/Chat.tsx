'use client';
import { useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { HiMenu, HiPlus, HiChevronDown, HiSparkles, HiCheckCircle, HiDownload } from "react-icons/hi";
import { RiRobot2Fill } from "react-icons/ri";
import { BsPaperclip, BsImage, BsCloudDownload } from "react-icons/bs";
import { BiChip } from "react-icons/bi";
import Message from "./Message";
import InputBar from "./InputBar";
import axios from "axios";
import Image from "next/image";

interface ChatProps {
  toggleComponentVisibility: () => void;
  selectedModule: any;
  onSelectModule: (module: any) => void;
  modules: any[];
  activeChat: any | null;
  onSaveChat: (chat: any) => void;
  onOpenSettings: () => void; // NEW: To open settings for model management
}

const Chat = ({ 
  toggleComponentVisibility, 
  selectedModule, 
  onSelectModule, 
  modules,
  activeChat,
  onSaveChat,
  onOpenSettings
}: ChatProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showEmptyChat, setShowEmptyChat] = useState(true);
  const [conversation, setConversation] = useState<any[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const bottomOfChatRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  // Load active chat when selected
  useEffect(() => {
    if (activeChat) {
      setConversation(activeChat.messages || []);
      setShowEmptyChat(false);
    } else {
      setConversation([]);
      setShowEmptyChat(true);
    }
  }, [activeChat]);

  useEffect(() => {
    if (bottomOfChatRef.current) {
      bottomOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  // Close model selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filesToSerializable = async (files: File[]) => {
    const serializable = [];
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      let preview = undefined;
      
      if (isImage) {
        preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      
      serializable.push({
        name: file.name,
        type: file.type,
        preview: preview
      });
    }
    return serializable;
  };

  const sendMessage = async (messageText: string, files?: File[]) => {
    if (messageText.length < 1 && (!files || files.length === 0)) {
      setErrorMessage("Please enter a message or attach a file.");
      return;
    } else {
      setErrorMessage("");
    }

    if (!selectedModule) {
      setErrorMessage("Please select an AI module first.");
      return;
    }

    if (!selectedModule.downloaded) {
      setErrorMessage("This model is not downloaded. Please download it first from Settings.");
      return;
    }

    setIsLoading(true);

    const serializedFiles = files ? await filesToSerializable(files) : [];

    const userMessage = {
      content: messageText,
      role: "user" as const,
      files: serializedFiles
    };

    const newConversation = [
      ...conversation,
      userMessage,
      { content: null, role: "assistant" as const },
    ];
    setConversation(newConversation);
    setShowEmptyChat(false);

    try {
      const response = await axios.post('http://localhost:8000/api/chat/', {
        module_id: selectedModule.id,
        message: messageText,
        files: serializedFiles.map(f => f.name)
      });

      if (response.data) {
        const assistantMessage = { content: response.data.response, role: "assistant" as const };
        const updatedConversation = [
          ...conversation,
          userMessage,
          assistantMessage,
        ];
        setConversation(updatedConversation);

        const chatTitle = conversation.length === 0 
          ? messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '')
          : (activeChat?.title || messageText.substring(0, 50));
        
        const chatToSave = {
          id: activeChat?.id || Date.now().toString(),
          title: chatTitle,
          preview: messageText.substring(0, 100),
          timestamp: new Date(),
          messages: updatedConversation
        };

        saveConversationToStorage(chatToSave);
        onSaveChat(chatToSave);
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.response?.data?.error || error.message || "An error occurred");
      
      setConversation([
        ...conversation,
        userMessage,
      ]);

      setIsLoading(false);
    }
  };

  const saveConversationToStorage = (chat: any) => {
    try {
      const existingChats = JSON.parse(localStorage.getItem('freddie_chats') || '[]');
      const index = existingChats.findIndex((c: any) => c.id === chat.id);
      
      if (index >= 0) {
        existingChats[index] = chat;
      } else {
        existingChats.unshift(chat);
      }
      
      const chatsToSave = existingChats.slice(0, 50);
      localStorage.setItem('freddie_chats', JSON.stringify(chatsToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const handleDownloadModel = async (module: any) => {
    try {
      await axios.post('http://localhost:8000/api/modules/download/', {
        module_id: module.id
      });
      // Close selector and navigate to settings
      setShowModelSelector(false);
      onOpenSettings();
    } catch (error) {
      console.error('Error starting download:', error);
      setErrorMessage('Failed to start download. Please try again.');
    }
  };

  const examplePrompts = [
    "Help me write code",
    "Explain a concept",
    "Solve a problem",
    "Creative writing"
  ];

  // Group models by download status
  const downloadedModels = modules.filter(m => m.downloaded);
  const availableModels = modules.filter(m => !m.downloaded);

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm px-4 py-3 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200 group"
            onClick={toggleComponentVisibility}
            title="Toggle sidebar"
          >
            <HiMenu size={20} className="text-slate-300 group-hover:text-slate-100 transition-colors" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <RiRobot2Fill size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm">Freddie AI</span>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <HiSparkles size={10} className="text-blue-400" />
                Intelligent Assistant
              </p>
            </div>
          </div>
        </div>
        <button 
          type="button" 
          className="p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200 group"
          onClick={() => window.location.reload()}
          title="New chat"
        >
          <HiPlus size={20} className="text-slate-300 group-hover:text-slate-100 group-hover:rotate-90 transition-all duration-300" />
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto">
        {!showEmptyChat && conversation.length > 0 ? (
          <div className="flex flex-col">
            {conversation.map((message, index) => (
              <Message key={index} message={message} />
            ))}
            
            <div className="h-4"></div>
            <div ref={bottomOfChatRef}></div>
          </div>
        ) : null}

        {/* Empty State */}
        {showEmptyChat ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-2xl opacity-40 animate-pulse"></div>
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                <Image 
                  src="/images/freddie.png" 
                  alt="Freddie AI Logo" 
                  width={96} 
                  height={96}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>

            <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent mb-3 animate-gradient">
              Welcome to Freddie AI
            </h1>
            <p className="text-lg text-slate-300 text-center max-w-md mb-12 font-medium">
              Your intelligent AI assistant for coding, creativity & more
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-2xl w-full mb-8">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(prompt)}
                  className="p-4 rounded-xl bg-slate-800/40 border-2 border-slate-700/50 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-900/50 transition-all duration-300 text-left group hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-2">
                    <HiSparkles size={18} className="text-blue-500 group-hover:text-blue-400 transition-colors" />
                    <span className="text-sm font-medium text-slate-200 group-hover:text-slate-100 transition-colors">
                      {prompt}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Real-time responses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span>Multiple AI models</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                <span>Context aware</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Input Area with Enhanced Model Selector */}
      <div className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm px-4 py-4 flex-shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-3 px-2 py-2 bg-red-900/40 border border-red-700/50 rounded-lg">
              <span className="text-red-300 text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                {errorMessage}
              </span>
            </div>
          )}

          {/* Enhanced Model Selector */}
          <div className="mb-3 relative" ref={modelSelectorRef}>
            <button
              type="button"
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600 transition-all group w-full"
            >
              <BiChip size={18} className="text-blue-400 group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-semibold text-slate-200 flex-1 text-left">
                {selectedModule?.display_name || 'Select AI Model'}
              </span>
              {selectedModule?.downloaded && (
                <span className="px-2 py-0.5 text-xs font-bold bg-green-900/50 text-green-300 rounded-full border border-green-700/50 flex items-center gap-1">
                  <HiCheckCircle size={10} />
                  READY
                </span>
              )}
              <HiChevronDown size={16} className={`text-slate-400 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
            </button>

            {showModelSelector && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-800 border-2 border-slate-700 rounded-xl shadow-2xl p-2 z-50 max-h-[500px] overflow-y-auto">
                {/* Downloaded Models Section */}
                {downloadedModels.length > 0 && (
                  <>
                    <div className="px-3 py-2 border-b border-slate-700 mb-2">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                        <HiCheckCircle size={14} className="text-green-400" />
                        Downloaded Models ({downloadedModels.length})
                      </p>
                    </div>
                    <div className="space-y-1 mb-3">
                      {downloadedModels.map(module => (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => {
                            onSelectModule(module);
                            setShowModelSelector(false);
                          }}
                          className={`
                            w-full text-left px-3 py-3 rounded-lg transition-all group
                            ${selectedModule?.id === module.id 
                              ? 'bg-gradient-to-r from-blue-700 to-indigo-700 border-2 border-blue-500 text-slate-100 shadow-lg' 
                              : 'hover:bg-slate-700/50 text-slate-200 border-2 border-transparent hover:border-slate-600/50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <RiRobot2Fill size={20} className={selectedModule?.id === module.id ? 'text-blue-300 animate-pulse' : 'text-blue-500 group-hover:text-blue-400'} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold truncate">{module.display_name}</span>
                                {selectedModule?.id === module.id && (
                                  <HiSparkles size={12} className="text-blue-400 animate-spin-slow" />
                                )}
                              </div>
                              <div className="text-xs opacity-75 truncate">{module.description}</div>
                              <div className="flex items-center gap-2 text-xs opacity-60 mt-1">
                                <span>{module.parameters}</span>
                                <span>•</span>
                                <span>{module.speed}</span>
                                <span>{module.quality}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Available Models Section */}
                {availableModels.length > 0 && (
                  <>
                    <div className="px-3 py-2 border-b border-slate-700 mb-2">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                        <BsCloudDownload size={14} className="text-blue-400" />
                        Available to Download ({availableModels.length})
                      </p>
                    </div>
                    <div className="space-y-1">
                      {availableModels.slice(0, 5).map(module => (
                        <div
                          key={module.id}
                          className="px-3 py-3 rounded-lg border-2 border-slate-700/50 hover:border-blue-600/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <BiChip size={20} className="text-slate-500" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-slate-300 truncate text-sm">{module.display_name}</span>
                                {module.recommended && (
                                  <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-900/50 text-amber-300 rounded-full">
                                    ⭐
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 truncate">{module.description}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{module.size}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadModel(module)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
                            >
                              <HiDownload size={14} />
                              Get
                            </button>
                          </div>
                        </div>
                      ))}
                      {availableModels.length > 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowModelSelector(false);
                            onOpenSettings();
                          }}
                          className="w-full px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 rounded-lg transition-colors text-sm font-medium"
                        >
                          View all {availableModels.length} models in Settings →
                        </button>
                      )}
                    </div>
                  </>
                )}

                {modules.length === 0 && (
                  <div className="text-center py-6">
                    <BiChip size={32} className="mx-auto text-slate-700 mb-2" />
                    <p className="text-sm text-slate-400">No models available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <InputBar
            onSendMessage={sendMessage}
            disabled={isLoading || !selectedModule?.downloaded}
            placeholder={
              !selectedModule 
                ? "Select a model first..." 
                : !selectedModule.downloaded 
                ? "Download this model to start chatting..." 
                : "Message Freddie AI..."
            }
          />

          {/* Footer Text */}
          <div className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-2">
            <HiSparkles size={12} className="text-blue-400" />
            <span>Freddie AI may produce inaccurate information. Always verify important facts.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;