import React, { useRef, useState } from 'react';
import { ResearchTemplate, DataSource, AgentRole, ResearchConfig } from '../types';
import { FlaskConical, Database, Users, FileText, Upload, Sparkles, X, FileUp, Layers, ArrowRight, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  config: ResearchConfig;
  setConfig: React.Dispatch<React.SetStateAction<ResearchConfig>>;
  onGeneratePlan: () => void;
  onReset: () => void;
  isGenerating: boolean;
  step: 'setup' | 'planning' | 'results';
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onGeneratePlan, onReset, isGenerating, step, onCollapsedChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
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
                <h3>Internal Data</h3>
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
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload} 
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

      </div>

      <div className={`p-6 border-t border-slate-100 bg-white sticky bottom-0 z-20 transition-all duration-300 ${isCollapsed ? 'p-3' : ''}`}>
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