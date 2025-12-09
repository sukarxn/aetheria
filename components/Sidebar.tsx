import React, { useRef, useState, useEffect } from 'react';
import { ResearchTemplate, DataSource, AgentRole, ResearchConfig } from '../types';
import { FlaskConical, Database, Users, FileText, Upload, Sparkles, X, FileUp, Layers, ArrowRight, ChevronLeft, Send as SendIcon, MessageCircle, Loader2 } from 'lucide-react';
import { chatWithDocument } from '../services/geminiService';
import { executeResearchQuery } from '../services/apiService';

import pdfToText from 'react-pdftotext'


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SidebarProps {
  config: ResearchConfig;
  setConfig: React.Dispatch<React.SetStateAction<ResearchConfig>>;
  onGeneratePlan: () => void;
  onReset: () => void;
  isGenerating: boolean;
  step: 'setup' | 'planning' | 'results';
  onCollapsedChange?: (collapsed: boolean) => void;
  documentContent?: string;
  onChatMessage?: (message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => void;
  initialChatHistory?: any[];
  onAppendResearchResult?: (content: string) => void;
  selectedDocumentText?: string;
  onClearSelectedText?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onGeneratePlan, onReset, isGenerating, step, onCollapsedChange, documentContent = '', onChatMessage, initialChatHistory = [], onAppendResearchResult, selectedDocumentText = '', onClearSelectedText }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'ask' | 'research' | 'diagram'>('ask');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [thinkingStep, setThinkingStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  // Auto-scroll to bottom when messages update or thinking steps change
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
    return () => clearTimeout(timer);
  }, [messages, thinkingStep, isLoading]);

  // Initialize chat with welcome message or restore from history
  useEffect(() => {
    console.log('🟡 Sidebar useEffect: step changed to:', step, 'with initialChatHistory length:', initialChatHistory.length);
    if (step === 'results') {
      console.log('📊 Sidebar useEffect: Processing results step');
      // If we have initial chat history, restore it
      if (initialChatHistory.length > 0) {
        console.log('📚 Sidebar: Attempting to restore chat history from database:', JSON.stringify(initialChatHistory, null, 2));
        const restoredMessages: Message[] = initialChatHistory.map((msg, idx) => {
          console.log(`📝 Sidebar: Restoring message ${idx}:`, { role: msg.role, contentPreview: (msg.message || msg.content)?.substring(0, 40), timestamp: msg.timestamp });
          return {
            id: `msg-${idx}`,
            role: msg.role as 'user' | 'assistant',
            content: msg.message || msg.content,
            timestamp: new Date(msg.timestamp || new Date())
          };
        });
        console.log('✅ Sidebar: Restored messages count:', restoredMessages.length, 'Full restored messages:', JSON.stringify(restoredMessages, null, 2));
        setMessages(restoredMessages);
        console.log('Chat history restored from database:', restoredMessages.length, 'messages');
      } else if (messages.length === 0) {
        console.log('💬 Sidebar: No chat history - creating welcome message');
        // Otherwise, add welcome message
        const welcomeMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Hi! I\'m your research assistant. I can answer questions about the document, provide insights, clarify concepts, or help you explore the findings in more detail. What would you like to know?',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        console.log('✨ Sidebar: Welcome message added');
        
        // Notify parent about welcome message
        onChatMessage?.({
          role: 'assistant',
          content: welcomeMessage.content,
          timestamp: welcomeMessage.timestamp
        });
      } else {
        console.log('⚠️ Sidebar: Messages already exist (length:', messages.length, '), skipping initialization');
      }
    }
  }, [step]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Append selected document text to the user message
    let userMessageContent = inputValue;
    if (selectedDocumentText) {
      userMessageContent = `${inputValue}\n\n[Reference from document: "${selectedDocumentText.substring(0, 150)}${selectedDocumentText.length > 150 ? '...' : ''}"]`;
    }
    
    const userMessageTimestamp = new Date();

    console.log('🟢 USER MESSAGE SUBMITTED:', { contentPreview: userMessageContent.substring(0, 50), timestamp: userMessageTimestamp.toISOString() });

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: userMessageTimestamp
    };
    console.log('📤 Adding user message to local state:', userMessage);
    setMessages(prev => {
      const updated = [...prev, userMessage];
      console.log('📤 Local messages state updated - total:', updated.length);
      return updated;
    });
    
    // Call onChatMessage callback for user message - IMPORTANT: send immediately
    if (onChatMessage) {
      console.log('🟢 CALLBACK FIRED: Sending USER message to parent (App.tsx)', {
        role: 'user',
        contentPreview: userMessageContent.substring(0, 50),
        timestamp: userMessageTimestamp.toISOString()
      });
      onChatMessage({
        role: 'user',
        content: userMessageContent,
        timestamp: userMessageTimestamp
      });
    } else {
      console.warn('⛔ Sidebar: onChatMessage callback NOT PROVIDED!');
    }
    
    // Clear input and selected text
    setInputValue('');
    if (onClearSelectedText) {
      onClearSelectedText();
    }
    setIsLoading(true);
    setThinkingStep(0);

    try {
      let assistantResponse: string;

      // Simulate thinking steps
      setThinkingStep(1); // Analyzing
      await new Promise(resolve => setTimeout(resolve, 1200));
      setThinkingStep(2); // Processing
      await new Promise(resolve => setTimeout(resolve, 1200));
      setThinkingStep(3); // Generating

      // Check the chat mode
      if (chatMode === 'ask') {
        console.log('❓ ASK QUESTION MODE: Calling executeResearchQuery and displaying in chatbox only');
        assistantResponse = await executeResearchQuery(inputValue);
        
        // Display full response in chatbox only (not in document)
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date()
        };
        console.log('📥 Adding assistant message to chatbox:', assistantMessage);
        setMessages(prev => {
          const updated = [...prev, assistantMessage];
          console.log('📥 Chatbox messages updated - total:', updated.length);
          return updated;
        });
        
        // Notify parent about chatbox message
        if (onChatMessage) {
          console.log('🟢 CALLBACK FIRED: Sending ASK QUESTION response to parent');
          onChatMessage({
            role: 'assistant',
            content: assistantResponse,
            timestamp: new Date()
          });
        }
      } else if (chatMode === 'research') {
        console.log('🔬 RESEARCH MODE: Calling executeResearchQuery and appending to document');
        assistantResponse = await executeResearchQuery(inputValue);
        
        // Append full response to document
        if (onAppendResearchResult) {
          console.log('📎 Appending full research result to document');
          onAppendResearchResult(assistantResponse);
        }
        
        // Extract first 100 words for chatbox preview
        const words = assistantResponse.split(/\s+/);
        const preview = words.slice(0, 100).join(' ') + (words.length > 100 ? '...' : '');
        
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `📄 Research result appended to document.\n\nPreview:\n${preview}`,
          timestamp: new Date()
        };
        console.log('📥 Adding research preview to chatbox');
        setMessages(prev => {
          const updated = [...prev, assistantMessage];
          console.log('📥 Chatbox messages updated - total:', updated.length);
          return updated;
        });
        
        // Notify parent about research message
        if (onChatMessage) {
          console.log('🔬 CALLBACK FIRED: Sending RESEARCH response to parent');
          onChatMessage({
            role: 'assistant',
            content: assistantMessage.content,
            timestamp: new Date()
          });
        }
      } else {
        // Diagram mode: Call geminiService with document context
        console.log('📊 DIAGRAM MODE: Calling chatWithDocument');
        assistantResponse = await chatWithDocument(userMessageContent, documentContent);
        
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date()
        };
        console.log('📥 Adding diagram response to chatbox');
        setMessages(prev => {
          const updated = [...prev, assistantMessage];
          console.log('📥 Chatbox messages updated - total:', updated.length);
          return updated;
        });
        
        // Notify parent about diagram message
        if (onChatMessage) {
          console.log('📊 CALLBACK FIRED: Sending DIAGRAM response to parent');
          onChatMessage({
            role: 'assistant',
            content: assistantResponse,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('❌ Error calling chat API:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
      console.log('❌ Adding error message to local state');
      setMessages(prev => [...prev, errorMessage]);
      
      // Call onChatMessage callback for error message
      if (onChatMessage) {
        console.log('❌ CALLBACK FIRED: Sending ERROR message to parent');
        onChatMessage({
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          timestamp: new Date()
        });
      }
    } finally {
      setIsLoading(false);
      setThinkingStep(0);
    }
  };

  const toggleAgent = (agent: AgentRole) => {
    setConfig(prev => {
      const exists = prev.selectedAgents.includes(agent);
      return {
        ...prev,
        selectedAgents: exists 
          ? prev.selectedAgents.filter(a => a !== agent)
          : [...prev.selectedAgents, agent]
      };
    });
  };

  const toggleResource = (res: DataSource) => {
    setConfig(prev => {
      const exists = prev.selectedResources.includes(res);
      return {
        ...prev,
        selectedResources: exists 
          ? prev.selectedResources.filter(r => r !== res)
          : [...prev.selectedResources, res]
      };
    });
  };

// Source - https://stackoverflow.com/a
// Posted by Pythoner, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-06, License - CC BY-SA 4.0

  const extractPDFText = (event) => {
        const files = event.target.files;
        if (files) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadedFiles(prev => {
              if (prev.includes(file.name)) {
                return prev;
              }
              return [...prev, file.name];
            });
            pdfToText(file)
                .then(text => {
                  console.log('PDF extracted:', text);
                  console.log('File name:', file.name);
                })
                .catch(error => console.error("Failed to extract text from pdf:", file.name, error))
          }
        }
    }

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(name => name !== fileName));
  };

  const parseInlineMarkdown = (text: string, baseKey: string) => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let key = 0;

    const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1] !== undefined) {
        parts.push(<strong key={`${baseKey}-bold-${key}`} className="font-bold text-slate-900">{match[1]}</strong>);
      } else if (match[2] !== undefined) {
        parts.push(<em key={`${baseKey}-italic-${key}`} className="italic text-slate-700">{match[2]}</em>);
      } else if (match[3] !== undefined) {
        parts.push(<code key={`${baseKey}-code-${key}`} className="bg-teal-100 px-1.5 py-0.5 rounded text-teal-700 font-mono text-xs">{match[3]}</code>);
      }
      key++;
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const parseTable = (lines: string[], startIndex: number): { table: JSX.Element; endIndex: number } | null => {
    const currentLine = lines[startIndex].trim();
    
    // Check if this is a table header (has pipes)
    if (!currentLine.includes('|')) return null;

    // Look ahead for separator line
    let idx = startIndex + 1;
    while (idx < lines.length && lines[idx].trim() === '') {
      idx++; // Skip empty lines
    }

    // Check for separator line
    if (idx >= lines.length || !lines[idx].includes('|') || !lines[idx].includes('-')) {
      return null;
    }

    const headerRow = currentLine.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
    
    idx++; // Move past separator
    const bodyRows: string[][] = [];

    // Collect table rows until we hit an empty line or end
    while (idx < lines.length) {
      const rowLine = lines[idx].trim();
      if (rowLine === '' || !rowLine.includes('|')) {
        break;
      }
      const cells = rowLine.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
      if (cells.length === headerRow.length) {
        bodyRows.push(cells);
      }
      idx++;
    }

    if (bodyRows.length === 0) {
      return null;
    }

    const table = (
      <div key={`table-${startIndex}`} className="overflow-x-auto my-3 rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-teal-50">
              {headerRow.map((header, i) => (
                <th key={`th-${i}`} className="border border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-800">
                  {parseInlineMarkdown(header, `th-${i}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIdx) => (
              <tr key={`tr-${rowIdx}`} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {row.map((cell, cellIdx) => (
                  <td key={`td-${rowIdx}-${cellIdx}`} className="border border-slate-200 px-3 py-2 text-xs text-slate-700">
                    {parseInlineMarkdown(cell, `td-${rowIdx}-${cellIdx}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return { table, endIndex: idx };
  };

  const formatChatMarkdown = (text: string) => {
    if (!text) return null;

    // Remove leading and trailing quotes
    let contentText = text.replace(/^["']|["']$/g, '');

    // Unescape JSON-encoded strings
    contentText = contentText
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');

    const lines = (contentText || '').split('\n');
    const result: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        result.push(<div key={`space-${i}`} className="h-2"></div>);
        i++;
        continue;
      }

      // Try to parse table - check if this line has pipes
      if (trimmedLine.includes('|')) {
        const tableResult = parseTable(lines, i);
        if (tableResult) {
          result.push(tableResult.table);
          i = tableResult.endIndex;
          continue;
        }
      }

      // Headings
      if (line.startsWith('# ')) {
        result.push(
          <h1 key={`h1-${i}`} className="text-xl font-bold text-slate-900 mt-3 mb-2">
            {parseInlineMarkdown(line.replace('# ', ''), `h1-${i}`)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        result.push(
          <h2 key={`h2-${i}`} className="text-lg font-bold text-slate-800 mt-3 mb-2 pb-2 border-b border-teal-200">
            {parseInlineMarkdown(line.replace('## ', ''), `h2-${i}`)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        result.push(
          <h3 key={`h3-${i}`} className="text-base font-bold text-teal-700 mt-2 mb-1 flex items-center gap-2">
            <span className="w-0.5 h-4 bg-teal-500 rounded-full"></span>
            {parseInlineMarkdown(line.replace('### ', ''), `h3-${i}`)}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        result.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-slate-700 mb-1 pl-2 marker:text-teal-500 text-sm">
            {parseInlineMarkdown(line.replace('- ', ''), `li-${i}`)}
          </li>
        );
      } else if (line.startsWith('> ')) {
        result.push(
          <blockquote key={`quote-${i}`} className="border-l-3 border-teal-500 pl-3 italic text-slate-700 my-2 bg-teal-50/50 py-2 rounded-r text-sm">
            {parseInlineMarkdown(line.replace('> ', ''), `quote-${i}`)}
          </blockquote>
        );
      } else {
        result.push(
          <p key={`p-${i}`} className="text-slate-700 leading-relaxed mb-2 text-sm font-light">
            {parseInlineMarkdown(line, `p-${i}`)}
          </p>
        );
      }
      i++;
    }

    return result;
  };

  return (
    <div className={`bg-white border-r border-slate-200 h-screen overflow-y-auto flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] fixed left-0 top-0 z-30 font-sans transition-all duration-300 ease-out ${
      isCollapsed ? 'w-20' : 'w-[420px]'
    }`}>
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20 min-h-[80px]">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2.5 rounded-xl text-white shadow-lg">
               <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-none mb-1">BioMed Nexus</h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Research OS v2.0</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button 
              onClick={() => handleCollapse(!isCollapsed)} 
              className="group p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" 
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
              <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
          {!isCollapsed && (
            <button 
                onClick={onReset} 
                className="group p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-colors" 
                title="Reset & Back"
            >
                <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
            </button>
          )}
        </div>
      </div>

      <div className={`p-6 space-y-8 flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {step === 'results' ? (
          // Chat Interface
          <div className="flex flex-col h-full -mx-6 -my-6">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mr-3 text-white text-xs font-bold">
                      AI
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-lg p-4 text-sm ${
                    msg.role === 'user'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="space-y-1">
                        {formatChatMarkdown(msg.content)}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 animate-in fade-in">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                    AI
                  </div>
                  <div className="space-y-2 flex-1">
                    {thinkingStep >= 1 && (
                      <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg animate-pulse">
                        <Database size={13} /> Searching knowledge bases...
                      </div>
                    )}
                    {thinkingStep >= 2 && (
                      <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg animate-pulse">
                        <Loader2 size={13} className="animate-spin" /> Analyzing & cross-referencing...
                      </div>
                    )}
                    {thinkingStep >= 3 && (
                      <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg animate-pulse">
                        <FileText size={13} /> Synthesizing response...
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Mode Selector */}
            <div className="border-t border-slate-100 px-6 py-3 bg-white space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mode</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setChatMode('ask')}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    chatMode === 'ask'
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Ask questions about the document"
                >
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Ask
                </button>
                <button
                  onClick={() => setChatMode('research')}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    chatMode === 'research'
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Perform further research"
                >
                  <FlaskConical className="w-3 h-3 inline mr-1" />
                  Research
                </button>
                <button
                  onClick={() => setChatMode('diagram')}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    chatMode === 'diagram'
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Create diagrams and visualizations"
                >
                  <Layers className="w-3 h-3 inline mr-1" />
                  Diagram
                </button>
              </div>
            </div>

            {/* Chat Input */}
            <div className="border-t border-slate-100 px-6 py-4 bg-white space-y-2">
              {/* Selected Text Tag */}
              {selectedDocumentText && (
                <div className="px-3 py-2 flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg">
                  <span className="text-xs font-medium text-teal-700">Reference:</span>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-teal-200 flex-1 min-w-0">
                    <span className="text-xs text-slate-600 truncate">
                      {selectedDocumentText.substring(0, 50)}...
                    </span>
                    <button
                      onClick={onClearSelectedText}
                      className="text-teal-600 hover:text-teal-700 ml-1 flex-shrink-0"
                      title="Remove reference"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <form onSubmit={handleChatSubmit} className="flex gap-2 items-end">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    chatMode === 'ask' 
                      ? 'Ask about the document...'
                      : chatMode === 'research'
                      ? 'What would you like to research?'
                      : 'Describe the diagram you want...'
                  }
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-800 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="p-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  title="Send message"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          // Original Config Interface
          <>
        {/* Active Template Indicator */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-100 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
            <div className="mt-1 text-teal-600 bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                <Layers className="w-4 h-4" />
            </div>
            <div className="relative z-10">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Selected Workflow</p>
                <p className="text-sm font-bold text-slate-800">{config.template}</p>
            </div>
        </div>

        {/* Input Topic */}
        <div className="space-y-3 group">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <FileText className="w-4 h-4 text-teal-600" />
            <h3>Research Topic / Target</h3>
          </div>
          <textarea 
            className="w-full h-32 p-4 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400/20 focus:border-slate-800 outline-none resize-none shadow-sm transition-all duration-200 ease-out placeholder:text-slate-300 group-hover:border-slate-300"
            placeholder="Describe your research objective (e.g., 'Evaluate the therapeutic potential of compound X on target Y in the context of Z disease')..."
            value={config.topic}
            onChange={(e) => setConfig({...config, topic: e.target.value})}
            disabled={step === 'results'}
          />
          
          {/* Chat Mode Selector - Integrated */}
          <div className="pt-2 border-slate-100 space-y-2">
            {/* <p className="text-xs font-semibold text-slate-600">Chat Mode for this Research</p> */}
            <div className="flex gap-2">
              <button
                onClick={() => setChatMode('ask')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  chatMode === 'ask'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-700'
                }`}
                title="Ask questions in chat"
              >
                <MessageCircle className="w-3 h-3 inline mr-1" />
                Ask Question
              </button>
              <button
                onClick={() => setChatMode('research')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  chatMode === 'research'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-700'
                }`}
                title="Research and append to document"
              >
                <FlaskConical className="w-3 h-3 inline mr-1" />
                Research
              </button>
            </div>
            <p className="text-[10px] text-slate-400 px-1">
              {chatMode === 'ask' 
                ? '📌 Questions will be answered in chat' 
                : '📌 Research results will be added to document'}
            </p>
          </div>
        </div>

        {/* Custom Data / File Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-slate-800 font-bold text-sm">
            <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-600" />
                <h3>Upload Additional Docuements</h3>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">Optional</span>
          </div>
          
          <div className="w-full p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-center cursor-pointer transition-all hover:border-slate-400 hover:bg-slate-100/30 group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-teal-400', 'bg-teal-50');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50');
              const files = e.dataTransfer.files;
              if (files?.length) {
                extractPDFText({ target: { files } });
              }
            }}
          >
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf"
                multiple
                onChange={extractPDFText} 
            />
            <FileUp className="w-6 h-6 text-slate-300 mx-auto mb-2 group-hover:text-slate-600 transition-colors" />
            <p className="text-xs font-semibold text-slate-600 group-hover:text-teal-600 transition-colors">
              Drop PDFs here or click to upload
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Multiple PDF files allowed</p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">Uploaded Documents ({uploadedFiles.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadedFiles.map((fileName, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg p-2.5 hover:bg-teal-100 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileUp className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-teal-900 truncate">{fileName}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileName);
                      }}
                      className="p-1 hover:bg-teal-200 rounded transition-colors text-teal-600 flex-shrink-0"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

           {/* <div className="flex items-center gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">Injection Point:</span>
            <select 
                value={config.customDataSection}
                onChange={(e) => setConfig({...config, customDataSection: e.target.value})}
                className="bg-white font-semibold text-slate-700 border border-slate-200 px-2 py-1 rounded focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer hover:border-slate-300 outline-none transition-all"
                disabled={step === 'results'}
            >
                <option value="Methods">Methods Section</option>
                <option value="Results">Results Section</option>
                <option value="Discussion">Discussion Section</option>
            </select>
          </div> */}
        </div> 

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

        {/* Agents */}
        <div className="space-y-4">
           <div className="flex items-center justify-between text-slate-800 font-bold text-sm">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <h3>Active Agents</h3>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {Object.values(AgentRole).map(agent => (
              <label 
                key={agent} 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden ${
                    config.selectedAgents.includes(agent) 
                    ? 'bg-teal-50 border-teal-200 shadow-sm' 
                    : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                } ${step === 'results' ? 'opacity-70 pointer-events-none' : ''}`}
              >
                {/* Selection Indicator Bar */}
                {config.selectedAgents.includes(agent) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
                )}
                
                <input 
                  type="checkbox" 
                  checked={config.selectedAgents.includes(agent)}
                  onChange={() => toggleAgent(agent)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600"
                  disabled={step === 'results'}
                />
                <span className={`text-xs font-semibold ${config.selectedAgents.includes(agent) ? 'text-teal-900' : 'text-slate-600'}`}>
                    {agent}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Resources */}
        {/* <div className="space-y-4">
           <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Database className="w-4 h-4 text-teal-600" />
            <h3>Data Sources</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(DataSource).map(src => (
              <label 
                key={src} 
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                     config.selectedResources.includes(src) 
                    ? 'bg-slate-800 border-slate-800 text-white' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                } ${step === 'results' ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <input 
                  type="checkbox" 
                  checked={config.selectedResources.includes(src)}
                  onChange={() => toggleResource(src)}
                  className="hidden" // Hiding default checkbox for custom styling
                  disabled={step === 'results'}
                />
                <div className={`w-2 h-2 rounded-full ${config.selectedResources.includes(src) ? 'bg-teal-400' : 'bg-slate-300'}`}></div>
                <span className="text-[11px] font-medium truncate" title={src}>{src}</span>
              </label>
            ))}
          </div>
        </div> */}
          </>
        )}

      </div>

      <div className={`p-6 border-t border-slate-100 bg-white sticky bottom-0 z-20 transition-all duration-300 ${isCollapsed ? 'p-3' : ''} ${step === 'results' ? 'hidden' : ''}`}>
        <button 
          onClick={onGeneratePlan}
          disabled={isGenerating || !config.topic || step === 'results'}
          className={`w-full py-4 px-4 rounded-xl text-white font-bold text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group
            ${isGenerating || !config.topic || step === 'results'
              ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' 
              : 'shimmer-btn hover:scale-[1.02] hover:shadow-teal-500/25 active:scale-[0.98]'}`}
          title={isCollapsed ? "Initialize Research Session" : ""}
        >
          {isGenerating ? <Sparkles className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:animate-pulse" />}
          
          {!isCollapsed && (
            <>
              <span className="relative z-10">
                  {step === 'results' ? 'Analysis Complete' : isGenerating ? 'Orchestrating Agents...' : 'Initialize Research Session'}
              </span>
              
              {!isGenerating && step !== 'results' && (
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;