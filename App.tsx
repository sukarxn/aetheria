import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TaskPlanner from './components/TaskPlanner';
import DocumentViewer from './components/DocumentViewer';
import TemplateSelection from './components/TemplateSelection';
import { ResearchConfig, ResearchTemplate, AgentRole, DataSource, Task, ResearchResult } from './types';
import { generateResearchPlan, executeResearchDraft, generateKnowledgeGraph, reviewContent, refineSection } from './services/geminiService';

const App = () => {
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
    setStep('setup');
  };

  const handleReset = () => {
    setHasSelectedTemplate(false);
    setStep('setup');
    setTasks([]);
    setResult(null);
    setConfig(prev => ({ ...prev, topic: '', customData: '' }));
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
      // 1. Generate Draft
      const draftMarkdown = await executeResearchDraft(config, tasks);
      
      // 2. Parallel: Generate Graph & Review
      // We do this to provide a complete "Result" state.
      const [graphData, reviewData] = await Promise.all([
        generateKnowledgeGraph(draftMarkdown),
        reviewContent(draftMarkdown)
      ]);

      setResult({
        markdown: draftMarkdown,
        graph: graphData,
        review: reviewData
      });

      setStep('results');
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
    } catch (e) {
      console.error(e);
      alert("Error regenerating knowledge graph. Please try again.");
    }
  };

  // RENDER FLOW
  if (!hasSelectedTemplate) {
    return <TemplateSelection onSelect={handleTemplateSelect} />;
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
      />
      
      <main className={`flex-1 h-screen overflow-hidden flex flex-col relative transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-[420px]'}`}>
        
        {step === 'setup' && (
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
                />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;