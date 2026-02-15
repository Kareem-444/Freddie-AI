'use client';
// Message.tsx
import { HiUser, HiClipboardCopy, HiRefresh, HiThumbUp, HiThumbDown, HiPhotograph } from 'react-icons/hi';
import { RiRobot2Fill } from 'react-icons/ri';
import { BsStars, BsFileEarmark } from 'react-icons/bs';
import { useState } from 'react';
import Image from 'next/image';

interface MessageProps {
  message: {
    content: string | null;
    role: 'user' | 'assistant' | 'system';
    files?: Array<{
      name: string;
      type: string;
      preview?: string; // Base64 or URL for images
    }>;
  };
}

export default function Message({ message }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant' || message.role === 'system';

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = () => {
    setIsLiked(isLiked === true ? null : true);
  };

  const handleDislike = () => {
    setIsLiked(isLiked === false ? null : false);
  };

  const isImage = (file: {name: string; type: string}) => {
    return file.type.startsWith('image/') || 
           /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
  };

  return (
    <>
      <div className={`
        w-full border-b border-slate-800/50
        ${isUser ? 'bg-slate-900/50' : 'bg-gradient-to-r from-slate-900/80 via-slate-950/80 to-slate-900/80'}
        transition-all duration-300
      `}>
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex gap-4 group">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {isUser ? (
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <HiUser size={18} className="text-white" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-950"></div>
                </div>
              ) : (
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 animate-gradient">
                  <RiRobot2Fill size={18} className="text-white" />
                  <BsStars size={10} className="absolute -top-1 -right-1 text-blue-400 animate-spin-slow" />
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              {/* Name with badge */}
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-bold text-slate-100">
                  {isUser ? 'You' : 'Freddie AI'}
                </p>
                {isAssistant && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-blue-900/60 to-indigo-900/60 text-blue-300 rounded-full border border-blue-700/50">
                    AI
                  </span>
                )}
              </div>
              
              {/* Attached Files Display */}
              {message.files && message.files.length > 0 && (
                <div className="mb-4 space-y-3">
                  {/* Images Grid */}
                  {message.files.filter(isImage).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                        <HiPhotograph size={14} className="text-violet-400" />
                        Attached Images
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {message.files.filter(isImage).map((file, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-violet-600/30 hover:border-violet-500 transition-all hover:scale-[1.02]"
                            onClick={() => file.preview && setSelectedImage(file.preview)}
                          >
                            <div className="aspect-square bg-slate-800/50">
                              {file.preview && (
                                <img
                                  src={file.preview}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-xs font-medium text-white truncate">
                                  {file.name}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files List */}
                  {message.files.filter(f => !isImage(f)).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                        <BsFileEarmark size={14} className="text-blue-400" />
                        Attached Files
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.files.filter(f => !isImage(f)).map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm hover:border-blue-600/50 transition-all"
                          >
                            <BsFileEarmark size={16} className="text-blue-400" />
                            <span className="text-slate-200 font-medium">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Message Text */}
              <div className="prose prose-sm max-w-none prose-invert">
                {message.content === null ? (
                  // Loading state
                  <div className="flex items-center gap-3 text-blue-400">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm font-medium">Generating response...</span>
                  </div>
                ) : (
                  <p className="text-slate-100 whitespace-pre-wrap leading-relaxed m-0">
                    {message.content}
                  </p>
                )}
              </div>

              {/* Action Buttons (for assistant messages) */}
              {isAssistant && message.content !== null && (
                <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${copied ? 'bg-green-900/50 text-green-300 border border-green-700/50' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700/50'}`}
                    title="Copy message"
                    onClick={handleCopy}
                  >
                    <HiClipboardCopy size={14} />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all text-xs text-slate-400 hover:text-slate-200 font-medium border border-transparent hover:border-slate-700/50"
                    title="Regenerate response"
                  >
                    <HiRefresh size={14} />
                    <span>Regenerate</span>
                  </button>

                  <div className="h-4 w-px bg-slate-700/50 mx-1"></div>

                  <button 
                    onClick={handleLike}
                    className={`p-1.5 rounded-lg transition-all ${isLiked === true ? 'bg-green-900/50 text-green-400' : 'hover:bg-slate-800/50 text-slate-500 hover:text-green-400'}`}
                    title="Good response"
                  >
                    <HiThumbUp size={14} />
                  </button>

                  <button 
                    onClick={handleDislike}
                    className={`p-1.5 rounded-lg transition-all ${isLiked === false ? 'bg-red-900/50 text-red-400' : 'hover:bg-slate-800/50 text-slate-500 hover:text-red-400'}`}
                    title="Bad response"
                  >
                    <HiThumbDown size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/90 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <HiX size={24} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}