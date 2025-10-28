import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BeakerIcon,
  ChartBarIcon,
  ChartPieIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { chatService, ChatMessage } from '../services/chatService';
import TypingIndicator from './TypingIndicator';
import LoadingSpinner from './ui/LoadingSpinner';
import MessageContent from './MessageContent';
import { useToast } from './ui/ToastProvider';
import HelpModal from './HelpModal';

interface EnhancedChatMessage extends ChatMessage {
  status?: 'sending' | 'sent' | 'error';
  id: string;
}

interface VisibleMessagesMap {
  [key: string]: string;
}

const MAX_MESSAGE_LENGTH = 4096;
const WARNING_LENGTH = 3500;

const TYPING_ANIMATION_SPEED = 25; // ms per character

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content: 'Welcome to GeneSysX! I\'m your AI assistant powered by Gemini Pro. I can help you with:\n\n• Bioinformatics Analysis\n• Machine Learning Tasks\n• Synthetic Biology Design\n• General Scientific Questions',
    timestamp: new Date(),
  },
  {
    role: 'assistant',
    content: 'Feel free to ask me anything or use the toolbox above for specialized tasks. How can I assist you today?',
    timestamp: new Date(),
  },
];

const QUICK_ACTIONS = [
  {
    label: 'DNA Analysis',
    icon: <BeakerIcon className="h-3 w-3" />,
    prompt: 'I need help analyzing a DNA sequence. Can you help me with sequence analysis?',
  },
  {
    label: 'ML Model',
    icon: <ChartBarIcon className="h-3 w-3" />,
    prompt: 'Help me build a machine learning model for biological data analysis.',
  },
  {
    label: 'Genetic Circuit',
    icon: <CpuChipIcon className="h-3 w-3" />,
    prompt: 'I want to design a genetic circuit. Can you guide me through the process?',
  },
  {
    label: 'Protein Structure',
    icon: <DocumentMagnifyingGlassIcon className="h-3 w-3" />,
    prompt: 'Can you help me analyze a protein structure and its functions?',
  },
  {
    label: 'Phylogenetics',
    icon: <ChartPieIcon className="h-3 w-3" />,
    prompt: 'I need help with phylogenetic analysis and evolutionary relationships.',
  },
];

const SUGGESTED_PROMPTS = [
  {
    title: "Sequence Analysis",
    prompts: [
      "How do I analyze this DNA sequence: ATCGATCG...",
      "What are the key features to look for in a protein sequence?",
      "Help me find open reading frames in a DNA sequence",
    ]
  },
  {
    title: "Machine Learning",
    prompts: [
      "How to preprocess biological sequence data for ML?",
      "What ML model is best for protein structure prediction?",
      "Help me with feature selection for genomic data",
    ]
  },
  {
    title: "Synthetic Biology",
    prompts: [
      "How to design a genetic toggle switch?",
      "Optimize this genetic circuit for better expression",
      "What are the best promoters for my construct?",
    ]
  },
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<EnhancedChatMessage[]>(
    INITIAL_MESSAGES.map(msg => ({ ...msg, id: Math.random().toString() }))
  );
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [showHistoryHint, setShowHistoryHint] = useState(false);
  const [showLengthWarning, setShowLengthWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [visibleMessages, setVisibleMessages] = useState<VisibleMessagesMap>({});
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);

  // Streaming state
  const streamingControllerRef = useRef<AbortController | null>(null);
  const [streamingTps, setStreamingTps] = useState(0);
  const streamingStartRef = useRef<number | null>(null);
  const streamingTokenCountRef = useRef<number>(0);

  // Animate new assistant messages
  useEffect(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    if (currentTypingIndex < assistantMessages.length - 1) {
      const message = assistantMessages[currentTypingIndex + 1];
      let charIndex = 0;
      
      const interval = setInterval(() => {
        if (charIndex <= message.content.length) {
          setVisibleMessages(prev => ({
            ...prev,
            [message.id]: message.content.slice(0, charIndex)
          }));
          charIndex++;
        } else {
          clearInterval(interval);
          setCurrentTypingIndex(prev => prev + 1);
        }
      }, TYPING_ANIMATION_SPEED);

      return () => clearInterval(interval);
    }
  }, [messages, currentTypingIndex]);

  // Reset typing animation when component unmounts
  useEffect(() => {
    return () => {
      setVisibleMessages({});
      setCurrentTypingIndex(-1);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Disable typing effect after initial render
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus input with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Toggle help modal with Cmd/Ctrl + /
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsHelpModalOpen(prev => !prev);
      }

      // Send message with Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (input.trim()) {
          handleSubmit();
        }
      }

      // Handle message history navigation
      if (document.activeElement === inputRef.current) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyIndex < messageHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInput(messageHistory[newIndex]);
            setShowHistoryHint(true);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInput(messageHistory[newIndex]);
            setShowHistoryHint(true);
          } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setInput('');
            setShowHistoryHint(false);
          }
        }
      }

      // Clear input or close modal with Escape
      if (e.key === 'Escape') {
        if (isHelpModalOpen) {
          setIsHelpModalOpen(false);
        } else if (input) {
          setInput('');
          setHistoryIndex(-1);
          setShowHistoryHint(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, messageHistory, historyIndex, isHelpModalOpen]);

  const handleRetry = async (messageId: string) => {
    const messageToRetry = messages.find(msg => msg.id === messageId);
    if (!messageToRetry || messageToRetry.role !== 'user') return;

    showToast({
      type: 'info',
      message: 'Retrying message...',
      duration: 3000,
    });

    // Remove the failed message and its response
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    // Resend the message
    await handleSubmit(undefined, messageToRetry.content);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showToast({
        type: 'success',
        message: 'Message copied to clipboard',
        duration: 2000,
      });
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to copy message',
        duration: 3000,
      });
    }
  };

  const handleRegenerate = async () => {
    if (isProcessing) return;
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) {
      showToast({ type: 'error', message: 'No user message to regenerate', duration: 3000 });
      return;
    }
    const messageContent = lastUser.content;

    const assistantId = Math.random().toString();
    setIsProcessing(true);
    setIsTyping(true);
    streamingTokenCountRef.current = 0;
    setStreamingTps(0);
    streamingStartRef.current = Date.now();
    const controller = new AbortController();
    streamingControllerRef.current = controller;

    // Insert placeholder assistant message
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), status: 'sent' }
    ]);

    try {
      await chatService.sendMessageStream(
        messageContent.trim(),
        (delta) => {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: (m.content || '') + delta } : m));
          const next = streamingTokenCountRef.current + delta.length;
          streamingTokenCountRef.current = next;
          const start = streamingStartRef.current ?? Date.now();
          const dt = Math.max(0.1, (Date.now() - start) / 1000);
          setStreamingTps(Number((next / dt).toFixed(1)));
        },
        { signal: controller.signal }
      );
      showToast({ type: 'success', message: 'Regenerated', duration: 2000 });
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, status: 'error' } : m));
      showToast({ type: 'error', message: 'Regenerate failed', duration: 3000 });
    } finally {
      setIsProcessing(false);
      setIsTyping(false);
      streamingControllerRef.current = null;
      streamingStartRef.current = null;
    }
  };

  const handleSubmit = async (e?: React.FormEvent, retryContent?: string) => {
    if (e) e.preventDefault();
    const messageContent = retryContent || input;
    if (!messageContent.trim() || isProcessing) return;

    if (!retryContent) {
      setMessageHistory(prev => [messageContent, ...prev]);
      setHistoryIndex(-1);
    }

    const messageId = Math.random().toString();
    const userMessage: EnhancedChatMessage = {
      id: messageId,
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setIsTyping(true);

    try {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'sent' } : msg
        )
      );

      // Create placeholder assistant message
      const assistantId = Math.random().toString();
      // Prepare streaming trackers
      streamingTokenCountRef.current = 0;
      setStreamingTps(0);
      streamingStartRef.current = Date.now();
      // Create controller to allow cancel
      const controller = new AbortController();
      streamingControllerRef.current = controller;
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          status: 'sent',
        },
      ]);

      // Stream tokens and update assistant message content incrementally
      await chatService.sendMessageStream(
        messageContent.trim(),
        (delta) => {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: (m.content || '') + delta } : m));
          {
            const next = streamingTokenCountRef.current + delta.length;
            streamingTokenCountRef.current = next;
            const start = streamingStartRef.current ?? Date.now();
            const dt = Math.max(0.1, (Date.now() - start) / 1000);
            setStreamingTps(Number((next / dt).toFixed(1)));
          }
        },
        { signal: controller.signal }
      );

      showToast({
        type: 'success',
        message: 'Response received successfully',
        duration: 3000,
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'error' } : msg
        )
      );

      showToast({
        type: 'error',
        message: 'Failed to get response. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
      setIsTyping(false);
      streamingControllerRef.current = null;
      streamingStartRef.current = null;
    }
  };

  const MessageStatus: React.FC<{ status?: string }> = ({ status }) => {
    if (!status || status === 'sent') return null;

    const statusConfig = {
      sending: {
        icon: <ArrowPathIcon className="h-3 w-3 animate-spin" />,
        text: 'Sending...',
        className: 'message-status-sending'
      },
      error: {
        icon: <ExclamationCircleIcon className="h-3 w-3" />,
        text: 'Failed to send',
        className: 'message-status-error'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <div className={`message-status ${config.className}`}>
        {config.icon}
        <span>{config.text}</span>
      </div>
    );
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_MESSAGE_LENGTH) {
      setInput(newValue);
      setShowLengthWarning(newValue.length > WARNING_LENGTH);
    }
    setShowHistoryHint(false);
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
    }
  };

  // Calculate remaining characters
  const remainingChars = MAX_MESSAGE_LENGTH - input.length;
  const isNearLimit = remainingChars < (MAX_MESSAGE_LENGTH - WARNING_LENGTH);

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const MessageBubble: React.FC<{ message: EnhancedChatMessage }> = ({ message }) => {
    const isAssistant = message.role === 'assistant';
    const visibleContent = visibleMessages[message.id] || message.content;
    
    return (
      <div
        className={`
          flex ${isAssistant ? 'justify-start' : 'justify-end'}
          animate-fade-in
        `}
      >
        <div
          className={`
            max-w-[85%] rounded-lg px-4 py-2
            ${message.role === 'user'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-600 shadow-md'
            }
          `}
        >
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <MessageContent 
                content={isAssistant ? visibleContent : message.content} 
              />
              <button
                onClick={() => handleCopyMessage(message.content)}
                className="ml-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Copy message"
              >
                Copy
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] opacity-70">
              <span>{message.timestamp.toLocaleTimeString()}</span>
              <MessageStatus status={message.status} />
            </div>
            {message.status === 'error' && (
              <button
                onClick={() => handleRetry(message.id)}
                className="text-xs text-red-300 hover:text-red-200 underline mt-1
                  transition-colors duration-200"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">AI Assistant</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by Gemini Pro • Specialized in Bioinformatics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isProcessing && (
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
                <span>Streaming… {streamingTps ? `${streamingTps} tok/s` : ''}</span>
              </div>
              <button
                onClick={() => {
                  streamingControllerRef.current?.abort();
                  setIsProcessing(false);
                  setIsTyping(false);
                }}
                className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                title="Stop streaming"
              >
                <span className="inline-flex items-center gap-1"><StopIcon className="h-4 w-4" /> Stop</span>
              </button>
            </div>
          )}
          <button
            onClick={handleRegenerate}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
            title="Regenerate last response"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Show Help (⌘/Ctrl + /)"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-800/50"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg">
              <TypingIndicator />
            </div>
          </div>
        )}
        
        {/* Show suggested prompts when chat is empty */}
        {messages.length <= 2 && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {SUGGESTED_PROMPTS.map((category, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {category.title}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {category.prompts.map((prompt, promptIdx) => (
                    <button
                      key={promptIdx}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="text-left text-sm p-2 rounded-lg
                        bg-slate-50 dark:bg-slate-700/50
                        text-slate-700 dark:text-slate-300
                        hover:bg-slate-100 dark:hover:bg-slate-700
                        transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {isProcessing && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-2">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {QUICK_ACTIONS.map((action, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedPrompt(action.prompt)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full
                bg-slate-100 dark:bg-slate-700 
                text-slate-700 dark:text-slate-300
                hover:bg-slate-200 dark:hover:bg-slate-600
                transition-colors whitespace-nowrap
                ring-1 ring-slate-200 dark:ring-slate-600"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2">
          {showHistoryHint && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 animate-fade-in">
              <div className="flex items-center gap-1">
                <ArrowUpIcon className="h-3 w-3" />
                <ArrowDownIcon className="h-3 w-3" />
              </div>
              <span>
                Navigate message history ({historyIndex + 1}/{messageHistory.length})
              </span>
            </div>
          )}
          
          <div className="relative">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={`Type your message... ${
                  messageHistory.length > 0 ? '(↑↓ for history)' : ''
                }`}
                className={`
              flex-1 rounded-lg 
              border border-gray-200 dark:border-slate-600 
              bg-gray-50 dark:bg-slate-700
              px-4 py-2 text-sm 
              text-gray-900 dark:text-white 
              placeholder-gray-400 dark:placeholder-slate-500 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400
              shadow-sm
                `}
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="inline-flex items-center justify-center rounded-lg 
                  bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 
                  focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
                title="Send message (⌘/Ctrl + Enter)"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Character counter and warnings */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {showLengthWarning && (
                <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400 animate-fade-in">
                  <InformationCircleIcon className="h-4 w-4" />
                  <span className="text-xs">Approaching limit</span>
                </div>
              )}
              <span className={`
                text-xs transition-colors
                ${isNearLimit 
                  ? 'text-yellow-500 dark:text-yellow-400' 
                  : 'text-slate-400 dark:text-slate-500'
                }
              `}>
                {remainingChars}
              </span>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setInput('');
                  setShowLengthWarning(false);
                  inputRef.current?.focus();
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Clear (Esc)
              </button>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Help (⌘/Ctrl + /)
              </button>
            </div>
            <div className="text-slate-400 dark:text-slate-500">
              ⌘/Ctrl + Enter to send
            </div>
          </div>
        </div>
      </form>

      {/* Single HelpModal Instance */}
      <HelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};

export default ChatInterface;
