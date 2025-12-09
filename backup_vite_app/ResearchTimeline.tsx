import React, { useMemo } from 'react';
import { GitBranch, BookOpen } from 'lucide-react';

export interface TimelineNode {
  id: string;
  query: string;
  timestamp: Date;
  parentId?: string;
  depth: number;
  isMainBranch: boolean;
}

interface ResearchTimelineProps {
  chatHistory: any[];
  onBranchClick: (query: string, index: number) => void;
  selectedIndex?: number;
}

export const ResearchTimeline: React.FC<ResearchTimelineProps> = ({
  chatHistory,
  onBranchClick,
  selectedIndex
}) => {
  // Build timeline tree structure from chat history
  const timelineNodes = useMemo(() => {
    const nodes: TimelineNode[] = [];
    let mainBranchId = '';
    let userMessageCount = 0;

    chatHistory.forEach((message, index) => {
      if (message.role === 'user') {
        const nodeId = `node-${index}`;
        
        // First user message is the main branch
        if (userMessageCount === 0) {
          mainBranchId = nodeId;
          nodes.push({
            id: nodeId,
            query: message.message,
            timestamp: new Date(message.timestamp),
            depth: 0,
            isMainBranch: true,
          });
        } else {
          // Subsequent queries are branches
          nodes.push({
            id: nodeId,
            query: message.message,
            timestamp: new Date(message.timestamp),
            parentId: mainBranchId,
            depth: 1,
            isMainBranch: false,
          });
        }
        userMessageCount++;
      }
    });

    return nodes;
  }, [chatHistory]);

  if (timelineNodes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <BookOpen className="mx-auto mb-2 opacity-50" size={20} />
        <p className="text-sm">No research queries yet</p>
      </div>
    );
  }

  // Main branch node (root)
  const mainNode = timelineNodes.find(n => n.isMainBranch);
  const branches = timelineNodes.filter(n => !n.isMainBranch);

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 sticky top-0 bg-white pb-2">
        <GitBranch size={16} />
        Research Timeline
      </h3>

      <div className="space-y-4">
        {/* Main Branch */}
        {mainNode && (
          <div className="flex flex-col items-center">
            <button
              onClick={() => onBranchClick(mainNode.query, 0)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                selectedIndex === 0
                  ? 'border-slate-800 bg-slate-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-2">
                <BookOpen size={16} className="text-slate-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-600">Main Research</p>
                  <p className="text-sm text-slate-800 line-clamp-2 break-words">
                    {mainNode.query}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {mainNode.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            </button>

            {/* Vertical Line to Branches */}
            {branches.length > 0 && (
              <div className="w-0.5 h-6 bg-gradient-to-b from-slate-600 to-slate-300 my-2"></div>
            )}
          </div>
        )}

        {/* Branches */}
        {branches.length > 0 && (
          <div className="relative pl-4 border-l-2 border-dashed border-slate-300">
            <div className="space-y-3">
              {branches.map((branch, idx) => {
                const chatIndex = chatHistory.findIndex(
                  msg => msg.message === branch.query && msg.role === 'user'
                );
                
                return (
                  <div key={branch.id} className="relative">
                    {/* Branch connector */}
                    <div className="absolute -left-6 top-4 w-4 h-0.5 bg-slate-400"></div>
                    
                    <button
                      onClick={() => onBranchClick(branch.query, chatIndex)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedIndex === chatIndex
                          ? 'border-slate-800 bg-slate-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GitBranch size={16} className="text-slate-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-600">
                            Query {idx + 1}
                          </p>
                          <p className="text-sm text-slate-800 line-clamp-2 break-words">
                            {branch.query}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {branch.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
