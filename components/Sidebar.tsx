import React, { useRef, useState, useEffect } from 'react';
import { ResearchTemplate, DataSource, AgentRole, ResearchConfig } from '../types';
import { FlaskConical, Database, Users, FileText, Upload, Sparkles, X, FileUp, Layers, ArrowRight, ChevronLeft, Send, MessageCircle } from 'lucide-react';
import { chatWithDocument } from '../services/geminiService';

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
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onGeneratePlan, onReset, isGenerating, step, onCollapsedChange, documentContent = '', onChatMessage, initialChatHistory = [] }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'ask' | 'research' | 'diagram'>('ask');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    const userMessageContent = inputValue;
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
    
    setInputValue('');
    setIsLoading(true);

    try {
      // Call geminiService with document context
      const assistantResponse = await chatWithDocument(userMessageContent, documentContent);

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };
      console.log('📥 Adding assistant message to local state:', assistantMessage);
      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        console.log('📥 Local messages state updated - total:', updated.length);
        return updated;
      });
      
      // Call onChatMessage callback for assistant response
      if (onChatMessage) {
        console.log('🔴 CALLBACK FIRED: Sending ASSISTANT message to parent (App.tsx)', {
          role: 'assistant',
          contentPreview: assistantResponse.substring(0, 50),
          timestamp: new Date().toISOString()
        });
        onChatMessage({
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date()
        });
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
        const file = event.target.files[0]
        pdfToText(file)
            .then(text => console.log(text))
            .catch(error => console.error("Failed to extract text from pdf"))
    }


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file reading/parsing
      const mockContent = `\n\n--- [Attached File: ${file.name}] ---\n(Simulated extraction of internal document content...)\n[CONFIDENTIAL STRATEGY DATA]\n- Market Segment: Oncology\n- Target Growth: +15% YoY\n- Key Competitor: Compound Y\n-----------------------------------\n`;
      
      setConfig(prev => ({
        ...prev,
        customData: prev.customData ? prev.customData + mockContent : mockContent
      }));
    }
  };

  return (
    <div className={`bg-white border-r border-slate-200 h-screen overflow-y-auto flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] fixed left-0 top-0 z-30 font-sans transition-all duration-300 ease-out ${
      isCollapsed ? 'w-20' : 'w-[420px]'
    }`}>
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20 min-h-[80px]">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-2.5 rounded-xl text-white shadow-lg shadow-teal-500/20">
               <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-800 leading-none mb-1">BioMed Nexus</h1>
              <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold">Research OS v2.0</p>
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

      <div className={`p-6 space-y-8 flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {step === 'results' ? (
          // Chat Interface
          <div className="flex flex-col h-full -mx-6 -my-6">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-800 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Mode Selector */}
            <div className="border-t border-slate-100 px-6 py-3 bg-white space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chat Mode</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setChatMode('ask')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    chatMode === 'ask'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Ask questions about the document"
                >
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Ask Question
                </button>
                <button
                  onClick={() => setChatMode('research')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    chatMode === 'research'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Perform further research"
                >
                  <FlaskConical className="w-3 h-3 inline mr-1" />
                  Research
                </button>
                <button
                  onClick={() => setChatMode('diagram')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    chatMode === 'diagram'
                      ? 'bg-teal-600 text-white shadow-md'
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
            <div className="border-t border-slate-100 px-6 py-4 bg-white">
              <form onSubmit={handleChatSubmit} className="space-y-2">
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
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <span className="text-xs text-slate-400 px-1.5 py-1 bg-slate-50 rounded flex items-center">
                    {chatMode === 'ask' && '❓ Q&A Mode'}
                    {chatMode === 'research' && '🔬 Research Mode'}
                    {chatMode === 'diagram' && '📊 Diagram Mode'}
                  </span>
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="ml-auto p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
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
            className="w-full h-32 p-4 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none shadow-sm transition-all duration-200 ease-out placeholder:text-slate-300 group-hover:border-slate-300"
            placeholder="Describe your research objective (e.g., 'Evaluate the therapeutic potential of compound X on target Y in the context of Z disease')..."
            value={config.topic}
            onChange={(e) => setConfig({...config, topic: e.target.value})}
            disabled={step === 'results'}
          />
        </div>

        {/* Custom Data / File Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-slate-800 font-bold text-sm">
            <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-600" />
                <h3>Upload Internal Data Sources</h3>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">Optional</span>
          </div>
          
          <div className="relative group">
            <textarea 
                className="w-full h-24 p-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none font-mono text-slate-600 transition-all placeholder:text-slate-400"
                placeholder="Paste raw experimental data or notes..."
                value={config.customData}
                onChange={(e) => setConfig({...config, customData: e.target.value})}
                disabled={step === 'results'}
            />
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf"
                onChange={extractPDFText} 
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 right-3 p-2 bg-white border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-slate-400 transition-all shadow-sm active:scale-95"
                title="Upload Mock PDF"
                disabled={step === 'results'}
            >
                <FileUp className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">Injection Point:</span>
            <select 
                value={config.customDataSection}
                onChange={(e) => setConfig({...config, customDataSection: e.target.value})}
                className="bg-transparent font-bold text-slate-700 border-none p-0 focus:ring-0 cursor-pointer hover:text-teal-600 outline-none"
                disabled={step === 'results'}
            >
                <option value="Methods">Methods Section</option>
                <option value="Results">Results Section</option>
                <option value="Discussion">Discussion Section</option>
            </select>
          </div>
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
        <div className="space-y-4">
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
        </div>
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