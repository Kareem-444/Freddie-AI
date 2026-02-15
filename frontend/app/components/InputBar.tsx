'use client';
// InputBar.tsx
import { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import { BsPaperclip, BsImage, BsFileEarmark } from 'react-icons/bs';
import { HiX, HiPhotograph } from 'react-icons/hi';
import Image from 'next/image';

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Message Freddie AI..."
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{[key: string]: string}>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // Generate image previews
  useEffect(() => {
    const newPreviews: {[key: string]: string} = {};
    attachedFiles.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews[`file-${index}`] = reader.result as string;
          setImagePreviews(prev => ({...prev, ...newPreviews}));
        };
        reader.readAsDataURL(file);
      }
    });
    
    return () => {
      // Cleanup old previews
      Object.values(imagePreviews).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [attachedFiles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !disabled) {
      onSendMessage(input.trim(), attachedFiles);
      setInput('');
      setAttachedFiles([]);
      setImagePreviews({});
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = {...prev};
      delete newPreviews[`file-${index}`];
      return newPreviews;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <HiPhotograph size={20} className="text-violet-400" />;
    }
    return <BsFileEarmark size={18} className="text-blue-400" />;
  };

  const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith('image/')) {
      return 'Image';
    }
    const extension = file.name.split('.').pop()?.toUpperCase();
    return extension || 'File';
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Attached Files Display - ENHANCED with Image Previews */}
      {attachedFiles.length > 0 && (
        <div className={`
          mb-3 p-3 rounded-xl border-2
          bg-slate-800/40 border-slate-700/50
          ${attachedFiles.some(isImage) ? 'space-y-3' : 'flex flex-wrap gap-2'}
        `}>
          {/* Image Previews - Large Display */}
          {attachedFiles.filter(isImage).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <HiPhotograph size={14} className="text-violet-400" />
                Images ({attachedFiles.filter(isImage).length})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {attachedFiles.map((file, index) => {
                  if (!isImage(file)) return null;
                  return (
                    <div
                      key={index}
                      className="relative group bg-slate-900/50 rounded-lg overflow-hidden border-2 border-violet-600/30 hover:border-violet-500 transition-all"
                    >
                      {/* Image Preview */}
                      <div className="aspect-square relative">
                        {imagePreviews[`file-${index}`] && (
                          <img
                            src={imagePreviews[`file-${index}`]}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      {/* File Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-xs font-medium text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-300">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove image"
                      >
                        <HiX size={14} className="text-white" />
                      </button>

                      {/* Image Badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-violet-900/90 rounded-md">
                        <span className="text-xs font-bold text-violet-200">IMAGE</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* File Attachments - Compact Display */}
          {attachedFiles.filter(f => !isImage(f)).length > 0 && (
            <div className="space-y-2">
              {attachedFiles.some(isImage) && (
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <BsFileEarmark size={14} className="text-blue-400" />
                  Files ({attachedFiles.filter(f => !isImage(f)).length})
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => {
                  if (isImage(file)) return null;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 border-2 border-blue-600/50 rounded-xl text-sm group hover:scale-[1.02] transition-all shadow-lg"
                    >
                      <div className="flex-shrink-0">
                        {getFileIcon(file)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-900/50 text-blue-200">
                            {getFileTypeLabel(file)}
                          </span>
                          <p className="text-slate-100 font-medium truncate max-w-[150px]">
                            {file.name}
                          </p>
                        </div>
                        <p className="text-slate-300 text-xs">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        title="Remove file"
                      >
                        <HiX size={16} className="text-slate-200 hover:text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Box */}
      <div className={`
        flex items-end gap-2 p-2
        border-2 rounded-xl
        bg-slate-800/30
        transition-all duration-200
        ${isFocused 
          ? 'border-blue-500 shadow-lg shadow-blue-900/30' 
          : 'border-slate-700/50 hover:border-slate-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="*/*"
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*"
        />

        {/* Left Actions */}
        <div className="flex items-center gap-1 pb-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <BsPaperclip size={18} />
          </button>
          
          <button
            type="button"
            disabled={disabled}
            onClick={() => imageInputRef.current?.click()}
            className="p-2 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add image"
          >
            <BsImage size={18} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 py-2 px-2 resize-none bg-transparent border-none outline-none focus:ring-0 text-slate-100 placeholder-slate-600 text-base disabled:cursor-not-allowed"
          rows={1}
          style={{
            minHeight: '24px',
            maxHeight: '200px',
            overflowY: input.length > 100 ? 'auto' : 'hidden'
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!input.trim() && attachedFiles.length === 0) || disabled}
          className={`
            p-2 mb-1 rounded-lg transition-all duration-300 flex-shrink-0
            ${(input.trim() || attachedFiles.length > 0) && !disabled
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg' 
              : 'bg-slate-800/50 text-slate-700 cursor-not-allowed opacity-50'
            }
          `}
          title="Send message"
        >
          <FiSend size={18} />
        </button>
      </div>
    </form>
  );
}