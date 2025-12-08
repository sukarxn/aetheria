import React, { useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TaskPlanner from './components/TaskPlanner';
import DocumentViewer from './components/DocumentViewer';
import TemplateSelection from './components/TemplateSelection';
import LoginPage from './components/LoginPage';
import { ResearchConfig, ResearchTemplate, AgentRole, DataSource, Task, ResearchResult } from './types';
import { generateResearchPlan, executeResearchDraft, generateKnowledgeGraph, reviewContent, refineSection } from './services/geminiService';
import { executeResearchQuery } from './services/apiService';
import { getProject, saveProject, updateProject, generateThreadId } from './utils/projectService';
import { SupabaseTest } from './components/SupabaseTest';

const App = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userId] = useState('550e8400-e29b-41d4-a716-446655440000'); // Hardcoded user ID

  // Config State
  const [config, setConfig] = useState<ResearchConfig>({
    topic: '',
    template: ResearchTemplate.ORIGINAL_RESEARCH, // Default, will be set by selection
    customData: '',
    customDataSection: 'Methods',
    // Default to a balanced set of the new agents
    selectedAgents: [
      AgentRole.IQVIA_AGENT, 
      AgentRole.TRIALS_AGENT, // Kept generic fallback if needed, but primarily using new ones
      AgentRole.PATENT_AGENT, 
      AgentRole.WEB_AGENT,
      AgentRole.REPORT_AGENT
    ].filter(a => Object.values(AgentRole).includes(a as AgentRole)) as AgentRole[], 
    selectedResources: [DataSource.TRIALS_API, DataSource.WEB_PROXY]
  });

  // Flow State
  const [hasSelectedTemplate, setHasSelectedTemplate] = useState(false);
  const [step, setStep] = useState<'setup' | 'planning' | 'results'>('setup');
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number | undefined>();
  
  // CRITICAL FIX: Track current chat history with useRef to avoid stale closures
  const chatHistoryRef = useRef<any[]>([]);
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);

  // 1. Template Selection
  const handleTemplateSelect = (template: ResearchTemplate) => {
    setConfig(prev => ({ 
      ...prev, 
      template,
      selectedAgents: [
        AgentRole.IQVIA_AGENT,
        AgentRole.PATENT_AGENT,
        AgentRole.TRIALS_AGENT,
        AgentRole.WEB_AGENT,
        AgentRole.REPORT_AGENT
      ]
    }));
    setHasSelectedTemplate(true);
    setSelectedProjectId(null);
    setStep('setup');
  };

  const handleSelectProject = async (projectId: string) => {
    console.log('\n🚀 LOADING PROJECT:');
    console.log('  - Project ID:', projectId);
    try {
      const project = await getProject(projectId);
      if (project) {
        console.log('\n✅ Project loaded successfully');
        console.log('  - Title:', project.title);
        console.log('  - Thread ID:', project.thread_id);
        console.log('  - Has generated_document:', !!project.generated_document);
        console.log('  - Has knowledge_graph:', !!project.knowledge_graph);
        console.log('  - Chat history length:', project.chat_history?.length || 0);
        
        if (project.chat_history && project.chat_history.length > 0) {
          console.log('\n📋 CHAT HISTORY BEING RESTORED:');
          console.log('  - Total messages:', project.chat_history.length);
          console.log('  - Breakdown:');
          project.chat_history.forEach((msg, idx) => {
            console.log(`    [${idx}] ${msg.role.toUpperCase()}: ${msg.message?.substring(0, 40) || msg.content?.substring(0, 40)}...`);
          });
        } else {
          console.log('⚠️ No chat history in loaded project');
        }
        
        setSelectedProjectId(projectId);
        setThreadId(project.thread_id || generateThreadId());
        setConfig(prev => ({
          ...prev,
          topic: project.title || '',
          template: ResearchTemplate.ORIGINAL_RESEARCH
        }));
        
        // Extract markdown content properly
        let markdownContent = '';
        if (project.generated_document) {
          if (typeof project.generated_document === 'string') {
            markdownContent = project.generated_document;
          } else if (project.generated_document.markdown) {
            markdownContent = project.generated_document.markdown;
          } else if (project.generated_document.content) {
            markdownContent = project.generated_document.content;
          }
        }
        
        setResult({
          markdown: markdownContent,
          graph: project.knowledge_graph || {},
          review: {}
        });
        console.log('\n📥 Setting chat history state with', project.chat_history?.length || 0, 'messages');
        setChatHistory(project.chat_history || []);
        chatHistoryRef.current = project.chat_history || [];
        setHasSelectedTemplate(true);
        setStep('results');
      }
    } catch (error) {
      console.error('❌ Failed to load project:', error);
      alert('Failed to load project');
    }
  };

  const handleCreateNew = () => {
    setSelectedProjectId(null);
    setThreadId(generateThreadId());
    setResult(null);
    setChatHistory([]);
    setHasSelectedTemplate(true);
    setStep('setup');
  };

  const handleSaveProject = async (title: string) => {
    if (!result) return;
    try {
      await saveProject(userId, {
        title,
        generatedDocument: result,
        chatHistory,
        knowledgeGraph: result.graph,
        threadId,
      });
      alert('Project saved successfully!');
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project');
    }
  };

  const handleReset = () => {
    setHasSelectedTemplate(false);
    setStep('setup');
    setTasks([]);
    setResult(null);
    setSelectedProjectId(null);
    setThreadId(null);
    setChatHistory([]);
    chatHistoryRef.current = [];
    setConfig(prev => ({ ...prev, topic: '', customData: '' }));
  };

  // Handle new chat messages
  const handleChatMessage = async (message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔵 APP.TSX - handleChatMessage CALLBACK RECEIVED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Message type:', message.role.toUpperCase());
    console.log('Content preview:', message.content.substring(0, 80));
    console.log('Timestamp:', message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp);
    
    // Ensure we have a valid timestamp
    const messageTimestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);
    
    // Add to local chat history
    const newMessage = {
      role: message.role,
      message: message.content,
      timestamp: messageTimestamp.toISOString()
    };
    
    console.log('\n📝 Creating new message object:');
    console.log('  - Role:', newMessage.role);
    console.log('  - Content length:', newMessage.message.length);
    console.log('  - Timestamp:', newMessage.timestamp);
    
    // CRITICAL FIX: Use useRef to avoid stale closure
    const newChatHistory = [
      ...chatHistoryRef.current,
      newMessage
    ];
    
    console.log('\n📊 Chat History Update:');
    console.log('  - Previous total:', chatHistoryRef.current.length);
    console.log('  - New total:', newChatHistory.length);
    console.log('  - Summary:', newChatHistory.map((m, idx) => `[${idx}] ${m.role.toUpperCase()}: ${m.message.substring(0, 30)}...`).join(' | '));
    console.log('\n📋 FULL CHAT HISTORY BEFORE SETTING STATE:');
    console.log(JSON.stringify(newChatHistory, null, 2));
    
    // Update both state and ref
    setChatHistory(newChatHistory);
    chatHistoryRef.current = newChatHistory;
    console.log('✅ setChatHistory called with', newChatHistory.length, 'messages');
    console.log('🔗 chatHistoryRef.current updated to:', newChatHistory.length, 'messages');

    // Update database if this is a saved/loaded project
    if (selectedProjectId) {
      console.log('\n🔄 DATABASE UPDATE:');
      console.log('  - Updating project:', selectedProjectId);
      console.log('  - Chat history messages:', newChatHistory.length);
      try {
        // Use newChatHistory which is current
        await updateProject(selectedProjectId, {
          chat_history: newChatHistory
        });
        console.log('✅ Chat history successfully updated in database');
        console.log('   - Total messages saved:', newChatHistory.length);
      } catch (updateError) {
        console.error('❌ FAILED to update chat history in database:', updateError);
      }
    } else {
      console.log('⚠️ NO selectedProjectId - chat NOT being saved to database yet');
      console.log('   Project will save chat when created');
    }
    console.log('═══════════════════════════════════════════════════════\n');
  };

  const handleBackToProjects = () => {
    setHasSelectedTemplate(false);
    setSelectedProjectId(null);
    setThreadId(null);
    setResult(null);
    setChatHistory([]);
    chatHistoryRef.current = [];
    setStep('setup');
  };

  // Handle research result - append to document
  const handleAppendResearchResult = (researchContent: string) => {
    if (!result) return;
    
    const appendedContent = result.markdown + '\n\n---\n\n## Research Results\n\n' + researchContent;
    
    setResult(prev => prev ? ({ ...prev, markdown: appendedContent }) : null);
    
    // Update database if this is a saved project
    if (selectedProjectId) {
      try {
        updateProject(selectedProjectId, {
          generated_document: {
            markdown: appendedContent,
            content: appendedContent,
            review: result.review
          }
        });
        console.log('✅ Research result appended to document in database');
      } catch (updateError) {
        console.error('❌ Failed to update document with research result:', updateError);
      }
    }
  };

  // 2. Generate Plan
  const handleGeneratePlan = async () => {
    if (!config.topic) return;
    setLoading(true);
    try {
      const generatedTasks = await generateResearchPlan(config);
      setTasks(generatedTasks);
      setStep('planning');
    } catch (e) {
      console.error(e);
      alert("Error creating research plan. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Execute Research
  const handleExecuteResearch = async () => {
    setLoading(true);
    try {
      // 1. Generate Draft using external API instead of Gemini
      const draftMarkdown = await executeResearchQuery(config.topic, threadId || undefined);
      
      // 2. Parallel: Generate Graph & Review
      // We do this to provide a complete "Result" state.
      const [graphData, reviewData] = await Promise.all([
        generateKnowledgeGraph(draftMarkdown),
        reviewContent(draftMarkdown)
      ]);

      const newResult = {
        markdown: draftMarkdown,
        graph: graphData,
        review: reviewData
      };

      setResult(newResult);
      setStep('results');

      // 3. Automatically save project to Supabase
      try {
        await saveProject(userId, {
          title: config.topic || 'Untitled Research Project',
          generatedDocument: {
            markdown: draftMarkdown,
            content: draftMarkdown,
            review: reviewData
          },
          chatHistory: chatHistory.length > 0 ? chatHistory : [{ role: 'system', message: 'Project created' }],
          knowledgeGraph: graphData,
          threadId,
        });
        console.log('Project automatically saved to database', {
          title: config.topic,
          markdownLength: draftMarkdown.length,
          graphData: graphData,
          reviewData: reviewData
        });
      } catch (saveError) {
        console.error('Failed to auto-save project:', saveError);
        // Don't alert - this is a background operation
      }
    } catch (e) {
      console.error(e);
      alert("Error executing research.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Refinement
  const handleRefine = async (instruction: string) => {
      if (!result) return;
      try {
          const newMarkdown = await refineSection(result.markdown, instruction);
          // Re-reviewing is optional but good practice to see score changes
          const newReview = await reviewContent(newMarkdown); 
          setResult(prev => prev ? ({ ...prev, markdown: newMarkdown, review: newReview }) : null);
          
          // Update chat history with the refinement
          const updatedChatHistory = [
            ...chatHistory,
            { role: 'user', message: instruction },
            { role: 'assistant', message: 'Refinement completed' }
          ];
          setChatHistory(updatedChatHistory);
          
          // Update the document and chat history in the database if this is a saved project
          if (selectedProjectId) {
            try {
              await updateProject(selectedProjectId, {
                generated_document: {
                  markdown: newMarkdown,
                  content: newMarkdown,
                  review: newReview
                },
                chat_history: updatedChatHistory
              });
              console.log('Refined document and chat history updated in database');
            } catch (updateError) {
              console.error('Failed to update refined document in database:', updateError);
            }
          }
      } catch (e) {
          console.error(e);
      }
  };

  // 5. Regenerate Knowledge Graph
  const handleRegenerateGraph = async () => {
    if (!result) return;
    try {
      const newGraphData = await generateKnowledgeGraph(result.markdown);
      setResult(prev => prev ? ({ ...prev, graph: newGraphData }) : null);
      
      // Update the graph in the database if this is a saved project
      if (selectedProjectId) {
        try {
          await updateProject(selectedProjectId, {
            knowledge_graph: newGraphData
          });
          console.log('Knowledge graph updated in database');
        } catch (updateError) {
          console.error('Failed to update graph in database:', updateError);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error regenerating knowledge graph. Please try again.");
    }
  };

  // 6. Handle Timeline Branch Click
  const handleTimelineBranchClick = async (query: string, index: number) => {
    setSelectedTimelineIndex(index);
    setLoading(true);
    
    try {
      const branchResult = await executeResearchQuery(query, threadId || undefined);
      
      const [graphData, reviewData] = await Promise.all([
        generateKnowledgeGraph(branchResult),
        reviewContent(branchResult)
      ]);

      setResult({
        markdown: branchResult,
        graph: graphData,
        review: reviewData
      });
    } catch (error) {
      console.error('Error loading timeline branch:', error);
      alert('Failed to load research branch');
    } finally {
      setLoading(false);
    }
  };

  // RENDER FLOW
  if (!isLoggedIn) {
    return <LoginPage onLogin={(role) => {
      setUserRole(role);
      setIsLoggedIn(true);
    }} />;
  }

  if (!hasSelectedTemplate) {
    return (
      <TemplateSelection 
        onSelect={handleTemplateSelect}
        userId={userId}
        onSelectProject={handleSelectProject}
        onCreateNew={handleCreateNew}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
       <Sidebar 
        config={config} 
        setConfig={setConfig} 
        onGeneratePlan={handleGeneratePlan}
        onReset={handleReset}
        isGenerating={loading && step === 'setup'}
        step={step}
        onCollapsedChange={setSidebarCollapsed}
        documentContent={result?.markdown || ''}
        onChatMessage={handleChatMessage}
        initialChatHistory={chatHistory}
        onAppendResearchResult={handleAppendResearchResult}
      />
      
      <main className={`flex-1 h-screen overflow-hidden flex flex-col relative transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-[420px]'}`}>
        
        {step === 'setup' && !selectedProjectId && (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 animate-fade-in">
                 <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-float">
                    <span className="text-7xl grayscale opacity-30 select-none">🧬</span>
                 </div>
                 <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Ready to Initialize</h2>
                 <p className="max-w-md text-center text-lg leading-relaxed text-slate-500">
                     Configure your <span className="text-teal-600 font-semibold">{config.template}</span> parameters in the sidebar to begin the Multi-Agent analysis.
                 </p>
            </div>
        )}

        {step === 'planning' && (
           <div className="flex-1 overflow-y-auto bg-slate-50/50 scrollbar-hide animate-fade-in">
             <TaskPlanner 
                tasks={tasks} 
                onExecute={handleExecuteResearch}
                isExecuting={loading && step === 'planning'}
             />
           </div>
        )}

        {step === 'results' && result && (
            <div className="h-full animate-fade-up">
                <DocumentViewer 
                    content={result.markdown} 
                    metrics={result.review}
                    graphData={result.graph}
                    onRefine={handleRefine}
                    onRegenerateGraph={handleRegenerateGraph}
                    onBackToProjects={selectedProjectId ? handleBackToProjects : undefined}
                    chatHistory={chatHistory}
                    onTimelineBranchClick={handleTimelineBranchClick}
                />
            </div>
        )}

      </main>
      
    </div>

  );
};

export default App;