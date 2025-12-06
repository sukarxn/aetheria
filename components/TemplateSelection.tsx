import React from 'react';
import { ResearchTemplate } from '../types';
import { FileText, Activity, FlaskConical, RefreshCw, BookOpen, ArrowRight, Sparkles } from 'lucide-react';

interface TemplateSelectionProps {
  onSelect: (template: ResearchTemplate) => void;
}

const templates = [
  {
    id: ResearchTemplate.ORIGINAL_RESEARCH,
    icon: FileText,
    title: 'Original Research',
    description: 'Draft a full scientific paper including Abstract, Intro, Methods, Results, and Discussion.'
  },
  {
    id: ResearchTemplate.TARGET_FEASIBILITY,
    icon: Activity,
    title: 'Target Feasibility Report',
    description: 'Assess biological target druggability, tissue specificity, and disease association.'
  },
  {
    id: ResearchTemplate.PK_ANALYSIS,
    icon: FlaskConical,
    title: 'Pharmacokinetics Analysis',
    description: 'Predict and analyze ADME properties for a specific drug candidate.'
  },
  {
    id: ResearchTemplate.DRUG_REPURPOSING,
    icon: RefreshCw,
    title: 'Drug Repurposing',
    description: 'Identify existing FDA-approved drugs for novel indications based on mechanisms.'
  },
  {
    id: ResearchTemplate.LITERATURE_REVIEW,
    icon: BookOpen,
    title: 'Literature Review',
    description: 'Synthesize state-of-the-art research on a specified therapeutic topic.'
  }
];

const TemplateSelection: React.FC<TemplateSelectionProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-6xl w-full z-10">
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-500 mb-4 animate-fade-in delay-100">
            <Sparkles className="w-3 h-3 text-teal-500" />
            AI-Powered Research Assistant
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight leading-tight">
            What would you like to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">research</span> today?
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">Select a specialized workflow to launch your multi-agent research session.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              style={{ animationDelay: `${idx * 100}ms` }}
              className="group text-left bg-white p-8 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-200 
                         hover:border-teal-400 hover:shadow-[0_12px_24px_rgba(13,148,136,0.1)] hover:-translate-y-1
                         transition-all duration-300 ease-out flex flex-col h-64 relative overflow-hidden animate-fade-up"
            >
              {/* Decorative huge icon */}
              <div className="absolute -top-6 -right-6 p-4 opacity-0 group-hover:opacity-5 transition-opacity duration-500 transform group-hover:rotate-12">
                <t.icon className="w-32 h-32 text-teal-600" />
              </div>
              
              <div className="mb-6 bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center text-slate-400 
                              group-hover:bg-gradient-to-br group-hover:from-teal-500 group-hover:to-teal-600 group-hover:text-white 
                              group-hover:shadow-lg group-hover:shadow-teal-500/30
                              transition-all duration-300">
                <t.icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-teal-700 transition-colors">
                {t.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-auto group-hover:text-slate-600">
                {t.description}
              </p>
              
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-teal-600 opacity-0 transform translate-y-4
                              group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                Start Project <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
              
              {/* Bottom active line */}
              <div className="absolute bottom-0 left-0 h-1 bg-teal-500 w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelection;