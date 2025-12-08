import React, { useState, useRef } from 'react';
import { ReviewMetrics, GraphData } from '../types';
import { Sparkles, BarChart2, Share2, Download, Network, X, Printer, ThumbsUp, ChevronRight, RotateCcw, GitBranch, Copy, MessageSquare, Bell, AlertCircle, Zap } from 'lucide-react';
import KnowledgeGraph from './KnowledgeGraph';
import { ResearchTimeline } from './ResearchTimeline';
import ChartsViewer from './ChartsViewer';
import MoleculeViewer from './MoleculeViewer';
import { extractChartData } from '../services/geminiService';

interface DocumentViewerProps {
  content: string;
  metrics: ReviewMetrics | null;
  graphData: GraphData | null;
  onRefine: (instruction: string) => Promise<void>;
  onRegenerateGraph?: () => Promise<void>;
  onBackToProjects?: () => void;
  onChatUpdate?: (message: { role: string; message: string }) => void;
  chatHistory?: any[];
  onTimelineBranchClick?: (query: string, index: number) => Promise<void>;
  onTextSelected?: (selectedText: string) => void;
  onNodeExpand?: (nodeId: string, nodeName: string) => Promise<void>;
  onAddToChat?: (content: string) => void;
  onDeleteNode?: (nodeId: string) => Promise<void>;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ content, metrics, graphData, onRefine, onRegenerateGraph, onBackToProjects, onChatUpdate, chatHistory = [], onTimelineBranchClick, onTextSelected, onNodeExpand, onAddToChat, onDeleteNode }) => {
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isRegeneratingGraph, setIsRegeneratingGraph] = useState(false);
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number | undefined>();
  const [selectedText, setSelectedText] = useState('');
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showAlerts, setShowAlerts] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [showMolecule, setShowMolecule] = useState(false);
  const selectionMenuRef = useRef<HTMLDivElement>(null);

  // Sample alerts data
  const sampleAlerts = [
    {
      id: 1,
      title: 'Minocycline Shows Promising Results in Neuropathic Pain',
      source: 'PubMed',
      date: '7 Dec 2025',
      description: 'New clinical trial demonstrates minocycline efficacy in reducing neuropathic pain symptoms with minimal side effects in a cohort of 200 patients.',
      link: 'https://pubmed.ncbi.nlm.nih.gov'
    },
    {
      id: 2,
      title: 'Novel Minocycline Derivatives Identified for Neuroinflammation',
      source: 'Nature Neuroscience',
      date: '7 Dec 2025',
      description: 'Researchers identify novel minocycline derivatives that show enhanced blood-brain barrier penetration and reduced neuroinflammatory markers.',
      link: 'https://nature.com'
    },
    {
      id: 3,
      title: 'Minocycline in Combination Therapy for Parkinson\'s Disease',
      source: 'Journal of Neurology',
      date: '6 Dec 2025',
      description: 'Preliminary findings suggest minocycline combined with L-DOPA shows synergistic effects in slowing disease progression in Parkinson\'s patients.',
      link: 'https://journals.springer.com'
    },
    {
      id: 4,
      title: 'Minocycline Bioavailability Enhancement Study',
      source: 'Pharmaceutical Research',
      date: '6 Dec 2025',
      description: 'Study on enhanced formulations of minocycline demonstrates improved oral bioavailability and sustained plasma levels with new delivery systems.',
      link: 'https://www.springer.com'
    }
  ];

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

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      
      // Get selection position for menu placement
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setMenuPosition({
          x: rect.left,
          y: rect.top - 10
        });
        setShowSelectionMenu(true);
      }
    }
  };

  const handleAddToChat = () => {
    if (selectedText && onTextSelected) {
      onTextSelected(selectedText);
      setShowSelectionMenu(false);
    }
  };

  const handleSaveToNotes = () => {
    // Copy to clipboard and show confirmation
    navigator.clipboard.writeText(selectedText);
    setShowSelectionMenu(false);
    alert('Text copied to clipboard!');
  };

  const handleGenerateCharts = async () => {
    setIsLoadingCharts(true);
    try {
      const charts = await extractChartData(content);
      setChartData(charts);
      setShowCharts(true);
    } catch (error) {
      console.error('Error generating charts:', error);
      alert('Failed to generate charts. Please try again.');
    } finally {
      setIsLoadingCharts(false);
    }
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

  const parseInlineMarkdown = (text: string, baseKey: string) => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let key = 0;

    // Match bold, italic, and inline code - order matters: bold before italic
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add formatted match - check groups in order
      if (match[1] !== undefined) {
        // Bold: **text**
        parts.push(<strong key={`${baseKey}-bold-${key}`} className="font-bold text-slate-900">{match[1]}</strong>);
      } else if (match[2] !== undefined) {
        // Italic: *text*
        parts.push(<em key={`${baseKey}-italic-${key}`} className="italic text-slate-800">{match[2]}</em>);
      } else if (match[3] !== undefined) {
        // Inline code: `text`
        parts.push(<code key={`${baseKey}-code-${key}`} className="bg-slate-100 px-2 py-1 rounded text-teal-700 font-mono text-sm">{match[3]}</code>);
      }
      key++;
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
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
      <div key={`table-${startIndex}`} className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-teal-50">
              {headerRow.map((header, i) => (
                <th key={`th-${i}`} className="border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-800">
                  {parseInlineMarkdown(header, `th-${i}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIdx) => (
              <tr key={`tr-${rowIdx}`} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {row.map((cell, cellIdx) => (
                  <td key={`td-${rowIdx}-${cellIdx}`} className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
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

  const formatMarkdown = (text: string | any) => {
    // Handle case where text is an object instead of string
    let contentText = text;
    if (typeof text === 'object' && text !== null) {
      contentText = text.content || text.markdown || JSON.stringify(text);
    }
    
    // Ensure we have a string
    if (typeof contentText !== 'string') {
      contentText = String(contentText || '');
    }

    // Remove leading and trailing quote characters
    contentText = contentText.replace(/^["']|["']$/g, '');

    // Unescape JSON-encoded strings (handles \n, \", \\, etc.)
    contentText = contentText
      .replace(/\\n/g, '\n')           // Unescape newlines
      .replace(/\\"/g, '"')            // Unescape quotes
      .replace(/\\\\/g, '\\');         // Unescape backslashes

    const lines = (contentText || '').split('\n');
    const result: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
          codeContent = '';
          i++;
          continue;
        } else {
          inCodeBlock = false;
          result.push(
            <pre key={`code-${i}`} className="bg-slate-900 text-slate-100 p-6 rounded-xl mb-6 overflow-x-auto font-mono text-sm leading-relaxed border border-slate-700 shadow-lg">
              <code>{codeContent}</code>
            </pre>
          );
          i++;
          continue;
        }
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        i++;
        continue;
      }

      // Skip empty lines at the start (but track them for table detection)
      if (trimmedLine === '') {
        result.push(<div key={`space-${i}`} className="h-4"></div>);
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
          <h1 key={`h1-${i}`} className="text-5xl font-black text-slate-900 mt-16 mb-8 tracking-tight leading-tight">
            {parseInlineMarkdown(line.replace('# ', ''), `h1-${i}`)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        result.push(
          <h2 key={`h2-${i}`} className="text-3xl font-bold text-slate-800 mt-12 mb-6 pb-3 border-b-2 border-teal-500">
            {parseInlineMarkdown(line.replace('## ', ''), `h2-${i}`)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        result.push(
          <h3 key={`h3-${i}`} className="text-xl font-bold text-teal-700 mt-8 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
            {parseInlineMarkdown(line.replace('### ', ''), `h3-${i}`)}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        result.push(
          <h4 key={`h4-${i}`} className="text-lg font-bold text-slate-800 mt-6 mb-3">
            {parseInlineMarkdown(line.replace('#### ', ''), `h4-${i}`)}
          </h4>
        );
      } else if (line.startsWith('##### ')) {
        result.push(
          <h5 key={`h5-${i}`} className="text-base font-bold text-slate-700 mt-4 mb-2">
            {parseInlineMarkdown(line.replace('##### ', ''), `h5-${i}`)}
          </h5>
        );
      } else if (line.startsWith('###### ')) {
        result.push(
          <h6 key={`h6-${i}`} className="text-sm font-bold text-slate-600 mt-3 mb-2">
            {parseInlineMarkdown(line.replace('###### ', ''), `h6-${i}`)}
          </h6>
        );
      }
      // Lists
      else if (line.startsWith('- ')) {
        result.push(
          <li key={`li-${i}`} className="ml-6 list-disc text-slate-700 mb-3 pl-3 marker:text-teal-500 leading-relaxed text-base">
            {parseInlineMarkdown(line.replace('- ', ''), `li-${i}`)}
          </li>
        );
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        result.push(
          <blockquote key={`quote-${i}`} className="border-l-4 border-teal-500 pl-6 italic text-slate-700 my-8 bg-gradient-to-r from-teal-50 to-transparent py-4 rounded-r-lg shadow-sm">
            {parseInlineMarkdown(line.replace('> ', ''), `quote-${i}`)}
          </blockquote>
        );
      }
      // Paragraphs with inline formatting
      else {
        result.push(
          <p key={`p-${i}`} className="text-slate-700 leading-8 mb-6 text-base font-light">
            {parseInlineMarkdown(line, `p-${i}`)}
          </p>
        );
      }
      i++;
    }

    return result;
  };

  return (
    <div className="h-full flex flex-col relative bg-[#f8fafc]">
      
      {/* Floating Toolbar with Glassmorphism */}
      <div className="h-20 px-8 flex items-center justify-end sticky top-0 z-20 glass border-b border-white/50 shadow-sm transition-all duration-300">
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {onBackToProjects && (
            <button 
              onClick={onBackToProjects}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-teal-700 hover:bg-white rounded-full transition-all text-xs font-bold border border-transparent hover:border-slate-200 hover:shadow-sm"
            >
              <X className="w-4 h-4" />
              Back to Projects
            </button>
          )}
          
          <button 
            onClick={() => setShowGraph(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-teal-700 hover:bg-white rounded-full transition-all text-xs font-bold border border-transparent hover:border-slate-200 hover:shadow-sm"
          >
            <Network className="w-4 h-4" />
            Visual Graph
          </button>

          <button 
            onClick={handleGenerateCharts}
            disabled={isLoadingCharts}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-amber-700 hover:bg-white rounded-full transition-all text-xs font-bold border border-transparent hover:border-slate-200 hover:shadow-sm disabled:opacity-50"
          >
            {isLoadingCharts ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <BarChart2 className="w-4 h-4" />
            )}
            {isLoadingCharts ? 'Generating...' : 'Generate Charts'}
          </button>

          <button 
            onClick={() => setShowMolecule(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-cyan-700 hover:bg-white rounded-full transition-all text-xs font-bold border border-transparent hover:border-slate-200 hover:shadow-sm"
          >
            <Zap className="w-4 h-4" />
            Molecular Structure
          </button>

          <button 
            onClick={() => setShowTimeline(!showTimeline)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-xs font-bold border ${showTimeline ? 'bg-purple-50 text-purple-700 border-purple-100 shadow-inner' : 'text-slate-600 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'}`}
          >
            <GitBranch className="w-4 h-4" />
            Research Timeline
          </button>
          
          <button 
            onClick={() => setShowMetrics(!showMetrics)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-xs font-bold border ${showMetrics ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-inner' : 'text-slate-600 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'}`}
          >
            <BarChart2 className="w-4 h-4" />
            Review Insights
          </button>
          
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          
          <div className="relative">
            <button 
              onClick={() => setShowAlerts(!showAlerts)} 
              className={`p-2.5 rounded-full transition-all relative ${showAlerts ? 'text-red-600 bg-red-50' : 'text-slate-500 hover:text-red-600 hover:bg-white'} hover:shadow-sm`}
              title="View recent alerts and discoveries"
            >
              <Bell className="w-4 h-4" />
              {sampleAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
            
            {/* Alerts Dropdown */}
            {showAlerts && (
              <div className="absolute right-0 top-12 w-96 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 max-h-[500px] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-red-50 to-orange-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-slate-800">Recent Discoveries</h3>
                  <span className="ml-auto text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">
                    {sampleAlerts.length} New
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {sampleAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => {
                        alert('Alert: ' + alert.title + '\n\n' + alert.description);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0 group-hover:bg-red-600"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                            {alert.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{alert.source}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-600">{alert.date}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {alert.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area (Paper) */}
      <div className="flex-1 overflow-y-auto scroll-smooth relative px-4 md:px-0">
        <div 
          className="max-w-[850px] mx-auto bg-white min-h-[1100px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] my-12 p-16 md:p-20 rounded-none md:rounded-xl border border-slate-100 animate-fade-up"
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
        >
           <div className="mb-12 border-b border-slate-100 pb-8 text-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">BioMed Nexus Generated Report</span>
           </div>
           {formatMarkdown(content)}
        </div>
        
        {/* Footer spacer */}
        <div className="h-20"></div>
      </div>

      {/* Text Selection Menu */}
      {showSelectionMenu && selectedText && (
        <div 
          ref={selectionMenuRef}
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex gap-2 animate-fade-in"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            transform: 'translateY(-120%)'
          }}
        >
          <button
            onClick={handleAddToChat}
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-600 rounded transition-colors flex items-center gap-1.5"
            title="Add to chat"
          >
            <MessageSquare className="w-4 h-4" />
            Add to Chat
          </button>
          <button
            onClick={handleSaveToNotes}
            className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-600 rounded transition-colors flex items-center gap-1.5"
            title="Copy to notes"
          >
            <Copy className="w-4 h-4" />
            Save to Notes
          </button>
          <button
            onClick={() => setShowSelectionMenu(false)}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                      <KnowledgeGraph 
                        data={graphData}
                        onNodeExpand={onNodeExpand}
                        onAddToChat={onAddToChat}
                        onDeleteNode={onDeleteNode}
                      />
                  </div>
              </div>
          </div>
      )}

      {/* Research Timeline Modal */}
      {showTimeline && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
              <div className="bg-white w-full h-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-up">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <GitBranch className="w-5 h-5 text-purple-600" />
                            Research Timeline
                        </h3>
                        <p className="text-xs text-slate-500">Track your research branches and queries over time</p>
                      </div>
                      <button onClick={() => setShowTimeline(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-500" />
                        </button>
                  </div>
                  <div className="flex-1 bg-slate-50 overflow-y-auto p-6">
                      {chatHistory && chatHistory.length > 0 ? (
                          <ResearchTimeline 
                              chatHistory={chatHistory} 
                              onBranchClick={async (query, index) => {
                                  setSelectedTimelineIndex(index);
                                  if (onTimelineBranchClick) {
                                      await onTimelineBranchClick(query, index);
                                  }
                              }}
                              selectedIndex={selectedTimelineIndex}
                          />
                      ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                              <p>No research queries yet</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Charts Viewer Modal */}
      {showCharts && (
        <ChartsViewer 
          charts={chartData}
          onClose={() => setShowCharts(false)}
        />
      )}

      {/* Molecule Viewer Modal */}
      {showMolecule && (
        <MoleculeViewer 
          onClose={() => setShowMolecule(false)}
        />
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