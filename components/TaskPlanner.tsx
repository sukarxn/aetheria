import React, { useEffect, useState } from 'react';
    import { Task } from '../types';
    import { Loader2, GitBranch, ArrowRight, CheckCircle2, Clock, Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
    import { generateTaskName } from '../services/geminiService';
    
    interface TaskPlannerProps {
      tasks: Task[];
      onExecute: () => void;
      isExecuting: boolean;
    }
    
    const TaskPlanner: React.FC<TaskPlannerProps> = ({ tasks, onExecute, isExecuting }) => {
      const [visibleTasks, setVisibleTasks] = useState<Task[]>([]);
      const [editingId, setEditingId] = useState<string | null>(null);
      const [editingTask, setEditingTask] = useState<Task | null>(null);
      const [editedDescription, setEditedDescription] = useState('');
      const [editedAgent, setEditedAgent] = useState('');
      const [editedName, setEditedName] = useState('');
      const [localTasks, setLocalTasks] = useState<Task[]>([]);
      const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
      const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    
      useEffect(() => {
        setLocalTasks(tasks);
      }, [tasks]);

      const handleEditClick = (task: Task) => {
        setEditingId(task.id);
        setEditingTask(task);
        setEditedName(task.name || '');
        setEditedDescription(task.description);
        setEditedAgent(task.agent);
      };

      const handleSaveEdit = () => {
        if (!editingTask) return;
        const updatedTasks = localTasks.map(t => 
          t.id === editingTask.id 
            ? { ...t, name: editedName, description: editedDescription, agent: editedAgent }
            : t
        );
        setLocalTasks(updatedTasks);
        setEditingId(null);
        setEditingTask(null);
      };

      const handleCancelEdit = () => {
        setEditingId(null);
        setEditingTask(null);
      };

      const handleDeleteTask = (taskId: string) => {
        setLocalTasks(localTasks.filter(t => t.id !== taskId));
      };

      const handleAddTask = () => {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          name: 'New Workflow Task',
          description: 'New task description',
          agent: 'Agent Name',
          status: 'pending'
        };
        setLocalTasks([...localTasks, newTask]);
        
        // Generate a name asynchronously
        generateTaskName(newTask.description, newTask.agent).then(name => {
          setLocalTasks(prev => 
            prev.map(t => t.id === newTask.id ? { ...t, name } : t)
          );
        });
      };

      const handleDragStart = (taskId: string) => {
        setDraggedTaskId(taskId);
      };

      const handleDragOver = (index: number, e: React.DragEvent) => {
        e.preventDefault();
        setDragOverIndex(index);
      };

      const handleDragLeave = () => {
        setDragOverIndex(null);
      };

      const handleDrop = (dropIndex: number) => {
        if (!draggedTaskId) return;
        
        const draggedIndex = localTasks.findIndex(t => t.id === draggedTaskId);
        if (draggedIndex === -1) return;

        const newTasks = [...localTasks];
        const [draggedTask] = newTasks.splice(draggedIndex, 1);
        newTasks.splice(dropIndex, 0, draggedTask);

        setLocalTasks(newTasks);
        setDraggedTaskId(null);
        setDragOverIndex(null);
      };
    
      useEffect(() => {
        setVisibleTasks([]);
        if (!localTasks) return;
        
        // Staggered appearance
        localTasks.forEach((task, index) => {
          setTimeout(() => {
            setVisibleTasks(prev => [...prev, task]);
          }, index * 200);
        });
      }, [localTasks]);
    
      if (!localTasks || localTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
                <Loader2 className="w-8 h-8 mb-4 animate-spin text-teal-500" />
                <p>Analyzing request parameters...</p>
            </div>
        );
      }

      return (
        <div className="max-w-4xl mx-auto mt-20 px-6 pb-20">
            <div className="text-center mb-16 animate-fade-up">
                 <div className="inline-flex items-center justify-center p-4 bg-white border border-slate-100 shadow-sm rounded-2xl text-teal-600 mb-6 relative group">
                    <div className="absolute inset-0 bg-teal-50 rounded-2xl scale-0 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
                    <GitBranch className="w-8 h-8 relative z-10" />
                 </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Proposed Research Strategy</h2>
                <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
                    The Multi-Agent System has devised a {tasks.length}-step execution plan. Review the workflow below before proceeding.
                </p>
            </div>
    
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200 overflow-hidden mb-12 animate-fade-up delay-200">
             <div className="bg-slate-50/80 backdrop-blur px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Workflow Sequence</span>
                <span className="text-xs font-mono bg-slate-200 text-slate-600 px-3 py-1 rounded-full">{localTasks.length} OPS</span>
             </div>
             
             <div className="divide-y divide-slate-100">
                {visibleTasks.map((task, idx) => (
                  <div 
                    key={task.id}
                    onDragOver={(e) => handleDragOver(idx, e)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(idx)}
                    className={`flex items-start gap-6 p-8 transition-all group animate-slide-in-right ${
                      dragOverIndex === idx ? 'bg-teal-100/40 border-t-2 border-teal-400' : ''
                    } ${
                      draggedTaskId === task.id ? 'opacity-50 bg-slate-100' : ''
                    } ${editingId === task.id ? 'bg-teal-50/40 border-l-4 border-teal-500' : 'hover:bg-slate-50'}`}
                  >
                    <div className="mt-1 flex-shrink-0 relative flex items-start gap-2">
                        <button
                          draggable
                          onDragStart={() => handleDragStart(task.id)}
                          className="p-1 text-slate-300 hover:text-teal-600 cursor-grab active:cursor-grabbing hover:bg-teal-50 rounded transition-colors"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                        {isExecuting ? (
                             <div className="relative">
                                <div className="w-8 h-8 rounded-full border-2 border-slate-100"></div>
                                <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                             </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-teal-500 group-hover:text-teal-600 transition-colors shadow-sm">
                                {idx + 1}
                            </div>
                        )}
                        {/* Connector Line */}
                        {idx !== visibleTasks.length - 1 && (
                            <div className="absolute top-9 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>
                        )}
                    </div>

                    <div className="flex-1">
                        {editingId === task.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Task Name</label>
                              <input 
                                type="text" 
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                placeholder="Task Name"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Agent</label>
                              <input 
                                type="text" 
                                value={editedAgent}
                                onChange={(e) => setEditedAgent(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                placeholder="Agent Name"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Description</label>
                              <textarea 
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white min-h-[80px] resize-none"
                                placeholder="Task description"
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button 
                                onClick={handleSaveEdit}
                                className="flex items-center gap-1 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors"
                              >
                                <Check className="w-4 h-4" /> Save
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                              >
                                <X className="w-4 h-4" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-slate-900">{task.name || 'Generating task name...'}</h4>
                                {!task.name && <div className="w-3 h-3 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin"></div>}
                              </div>
                              <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:border-teal-200 transition-colors mt-2">
                                {task.agent}
                              </span>
                            </div>
                            {isExecuting && (
                                <span className="flex items-center gap-1 text-[10px] text-teal-600 font-medium animate-pulse mt-2">
                                    <Clock className="w-3 h-3" /> Processing
                                </span>
                            )}
                            <p className="text-slate-700 font-medium leading-relaxed text-sm group-hover:text-slate-900 transition-colors mt-3">{task.description}</p>
                          </>
                        )}
                    </div>

                    {editingId !== task.id && (
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => handleEditClick(task)}
                          disabled={isExecuting}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={isExecuting || localTasks.length === 1}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
             </div>

             <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
               <button
                 onClick={handleAddTask}
                 disabled={isExecuting}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-all disabled:opacity-50"
               >
                 <Plus className="w-4 h-4" /> Add Workflow
               </button>
             </div>
          </div>
    
          <div className="flex justify-center pb-8 animate-fade-up delay-300">
             <button 
              onClick={onExecute}
              disabled={isExecuting}
              className={`group relative py-4 px-12 rounded-full font-bold shadow-2xl transition-all duration-300 flex items-center gap-3 text-lg overflow-hidden
                ${isExecuting 
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-slate-900 text-white hover:bg-teal-600 hover:shadow-teal-500/40 hover:-translate-y-1'}`}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="animate-pulse">Synthesizing Research...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Execute Research Plan</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  
                  {/* Button background effect */}
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </>
              )}
            </button>
          </div>
        </div>
      );
    };
    
    export default TaskPlanner;