import React, { useState } from 'react';
import { ReviewMetrics, GraphData } from '../types';
import { Sparkles, BarChart2, Share2, Download, Network, X, Printer, ThumbsUp, ChevronRight, RotateCcw } from 'lucide-react';
import KnowledgeGraph from './KnowledgeGraph';

interface DocumentViewerProps {
  content: string;
  metrics: ReviewMetrics | null;
  graphData: GraphData | null;
  onRefine: (instruction: string) => Promise<void>;
  onRegenerateGraph?: () => Promise<void>;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ content, metrics, graphData, onRefine, onRegenerateGraph }) => {
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isRegeneratingGraph, setIsRegeneratingGraph] = useState(false);

  const handleRefine = async () => {
    if (!refineInput) return;
    setIsRefining(true);
    await onRefine(refineInput);
    setIsRefining(false);
    setRefineInput('');
  };

  const generateSuggestedQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2-5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: {
            parts: [{
              text: `Based on this document content, generate exactly 5 thought-provoking questions that encourage deeper analysis and exploration of the topic. The questions should be open-ended and specific to the content provided.

Document Content (first 2000 chars):
${content.substring(0, 2000)}

Return ONLY a JSON array of 5 questions strings, like: ["Question 1?", "Question 2?", ...]`
            }]
          }
        })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const questions = JSON.parse(text);
      setSuggestedQuestions(Array.isArray(questions) ? questions.slice(0, 5) : []);
    } catch (error) {
      console.error('Error generating questions:', error);
      setSuggestedQuestions([
        'What are the key findings discussed in this document?',
        'How do the insights apply to current market trends?',
        'What are the implications for future strategy?',
        'Which data points require further investigation?',
        'How does this relate to competitive landscape?'
      ]);
    }
    setIsGeneratingQuestions(false);
  };

  const handleInputFocus = async () => {
    if (!showSuggestedQuestions && suggestedQuestions.length === 0) {
      setShowSuggestedQuestions(true);
      await generateSuggestedQuestions();
    } else {
      setShowSuggestedQuestions(!showSuggestedQuestions);
    }
  };

  const handleQuestionClick = (question: string) => {
    setRefineInput(question);
    setShowSuggestedQuestions(false);
  };

  const handleRegenerateGraph = async () => {
    if (!onRegenerateGraph) return;
    setIsRegeneratingGraph(true);
    try {
      await onRegenerateGraph();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegeneratingGraph(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatMarkdown = (text: string) => {
    return (text || '').split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-12 mb-8 tracking-tight leading-tight">{line.replace('# ', '')}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl md:text-3xl font-bold text-slate-800 mt-10 mb-6 pb-2 border-b border-slate-100 flex items-center gap-3">{line.replace('## ', '')}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-teal-900 mt-8 mb-4">{line.replace('### ', '')}</h3>;
        if (line.startsWith('- ')) return <li key={i} className="ml-6 list-disc text-slate-700 mb-2 pl-2 marker:text-teal-500 leading-relaxed">{line.replace('- ', '')}</li>;
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-teal-500 pl-6 italic text-slate-700 my-8 bg-slate-50 py-4 rounded-r-lg shadow-sm">{line.replace('> ', '')}</blockquote>;
        if (line.trim() === '') return <div key={i} className="h-6"></div>;
        return <p key={i} className="text-slate-700 leading-8 mb-5 text-[1.1rem] font-light">{line}</p>;
    });
  };

  return (
    <div className="h-full flex flex-col relative bg-[#f8fafc]">
      
      {/* Floating Toolbar with Glassmorphism */}
      <div className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 glass border-b border-white/50 shadow-sm transition-all duration-300">
        
        {/* Ask More Questions */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1 group">
            <input 
              type="text" 
              placeholder="Ask more questions to dive deeper..."
              className="w-full pl-11 pr-24 py-3 bg-white/80 border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all shadow-sm group-hover:shadow-md group-hover:bg-white"
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
            />
            <Sparkles className="w-4 h-4 text-teal-600 absolute left-4 top-3.5 animate-pulse" />
            
            <button 
                onClick={handleRefine}
                disabled={isRefining || !refineInput}
                className="absolute right-2 top-2 px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-teal-600 disabled:opacity-0 disabled:transform disabled:translate-x-4 transition-all duration-300 shadow-md"
            >
                {isRefining ? 'Thinking...' : 'Ask'}
            </button>

            {/* Suggested Questions Dropdown */}
            {showSuggestedQuestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-3 space-y-2 max-h-96 overflow-y-auto animate-fade-up">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Suggested Questions</p>
                  {isGeneratingQuestions && <div className="w-4 h-4 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin"></div>}
                </div>
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuestionClick(question)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-slate-50 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all text-sm text-slate-700 hover:text-teal-700 font-medium leading-relaxed hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-teal-500 font-bold mt-0.5">✓</span>
                      <span>{question}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowGraph(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-teal-700 hover:bg-white rounded-full transition-all text-xs font-bold border border-transparent hover:border-slate-200 hover:shadow-sm"
          >
            <Network className="w-4 h-4" />
            Visual Graph
          </button>
          
          <button 
            onClick={() => setShowMetrics(!showMetrics)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-xs font-bold border ${showMetrics ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-inner' : 'text-slate-600 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'}`}
          >
            <BarChart2 className="w-4 h-4" />
            Review Insights
          </button>
          
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          
          <button onClick={handlePrint} className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-full transition-all hover:shadow-sm" title="Print / Save PDF">
             <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area (Paper) */}
      <div className="flex-1 overflow-y-auto scroll-smooth relative px-4 md:px-0">
        <div className="max-w-[850px] mx-auto bg-white min-h-[1100px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] my-12 p-16 md:p-20 rounded-none md:rounded-xl border border-slate-100 animate-fade-up">
           <div className="mb-12 border-b border-slate-100 pb-8 text-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">BioMed Nexus Generated Report</span>
           </div>
           {formatMarkdown(content)}
        </div>
        
        {/* Footer spacer */}
        <div className="h-20"></div>
      </div>

      {/* Review Metrics Slide-over */}
      {showMetrics && metrics && (
        <div className="absolute right-0 top-20 bottom-0 w-[400px] bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl p-8 overflow-y-auto z-30 animate-slide-in-right">
             <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="font-bold text-xl text-slate-800">Quality Assurance</h3>
                    <p className="text-xs text-slate-500">AI-driven content analysis</p>
                 </div>
                 <button onClick={() => setShowMetrics(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>

             <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100 relative overflow-hidden">
                 <div className="flex items-center justify-between mb-2 relative z-10">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overall Score</span>
                    <span className="text-4xl font-black text-teal-600">{metrics.overallScore}</span>
                 </div>
                 <div className="w-full bg-slate-200 rounded-full h-3 relative z-10">
                    <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${metrics.overallScore}%` }}></div>
                 </div>
                 
                 {/* Decorative blob */}
                 <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-teal-100 rounded-full blur-2xl opacity-50"></div>
             </div>

             <div className="space-y-6 mb-10">
                <MetricRow label="Scientific Accuracy" score={metrics.accuracy} />
                <MetricRow label="Logical Coherence" score={metrics.coherence} />
                <MetricRow label="Readability Index" score={metrics.readability} />
                <MetricRow label="Language Precision" score={metrics.languageQuality} />
             </div>

             <div className="pt-8 border-t border-slate-100">
                 <h4 className="font-bold text-sm text-slate-800 mb-5 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Improvement Suggestions
                 </h4>
                 <ul className="space-y-3">
                     {metrics.suggestions?.map((s, i) => (
                         <li key={i} className="text-sm text-slate-600 bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 leading-relaxed shadow-sm">
                             <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-amber-400"></div>
                             {s}
                         </li>
                     ))}
                 </ul>
             </div>
        </div>
      )}

      {/* Knowledge Graph Modal */}
      {showGraph && graphData && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
              <div className="bg-white w-full h-full max-w-7xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-up">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Network className="w-5 h-5 text-teal-600" />
                            Knowledge Graph
                        </h3>
                        <p className="text-xs text-slate-500">Visualizing entity relationships extracted from the text</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleRegenerateGraph}
                          disabled={isRegeneratingGraph}
                          title="Regenerate knowledge graph"
                          className="p-2 hover:bg-teal-50 text-slate-500 hover:text-teal-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw className={`w-5 h-5 ${isRegeneratingGraph ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setShowGraph(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-500" />
                        </button>
                      </div>
                  </div>
                  <div className="flex-1 bg-slate-50 relative">
                      <KnowledgeGraph data={graphData} />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const MetricRow = ({ label, score }: { label: string, score: number }) => (
    <div className="group">
        <div className="flex justify-between text-xs mb-2">
            <span className="font-bold text-slate-600 group-hover:text-teal-700 transition-colors">{label}</span>
            <span className="text-slate-400 font-mono">{score}/100</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 rounded-full transition-all duration-700 ease-out group-hover:bg-teal-600" style={{ width: `${score}%` }}></div>
        </div>
    </div>
);

export default DocumentViewer;