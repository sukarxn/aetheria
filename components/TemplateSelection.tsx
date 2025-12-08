import React, { useState, useEffect } from 'react';
import { ResearchTemplate } from '../types';
import { FileText, Activity, FlaskConical, RefreshCw, BookOpen, ArrowRight, Sparkles, Plus, Trash2, LogOut, User } from 'lucide-react';
import { getUserProjects, deleteProject } from '../utils/projectService';

interface TemplateSelectionProps {
  onSelect: (template: ResearchTemplate) => void;
  userId?: string;
  onSelectProject?: (projectId: string) => void;
  onCreateNew?: () => Promise<void>;
}

interface Project {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
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

const TemplateSelection: React.FC<TemplateSelectionProps> = ({ onSelect, userId, onSelectProject, onCreateNew }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProjects, setShowProjects] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProjects();
      setShowProjects(true);
    }
  }, [userId]);

  const loadProjects = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getUserProjects(userId);
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewProject = async () => {
    setIsCreatingProject(true);
    try {
      if (onCreateNew) {
        await onCreateNew();
      }
      // Reload projects list after creation
      await loadProjects();
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError('Failed to create new project');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleSelectProject = (projectId: string) => {
    if (onSelectProject) {
      onSelectProject(projectId);
    }
  };
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 mb-1">
              {showProjects ? 'Research Projects' : 'New Research Session'}
            </h1>
            <p className="text-sm text-slate-500">
              {showProjects ? 'Manage and access your saved projects' : 'Select a research workflow to get started'}
            </p>
          </div>
          
          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-md border border-slate-200 hover:bg-white 
                         transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-semibold">
                SG
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">Sukaran Gulati</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </button>
            
            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-50">
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">Sukaran Gulati</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 
                             transition-colors duration-150 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 
                             transition-colors duration-150 flex items-center gap-2 border-t border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {showProjects ? (
            <>
              {/* Create New Project Button */}
              <div className="mb-8">
                <button
                  onClick={handleCreateNewProject}
                  disabled={isCreatingProject}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium 
                             transition-colors duration-200 flex items-center gap-2"
                >
                  {isCreatingProject ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      New Project
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Projects Table */}
              {loading ? (
                <div className="text-center text-slate-500 py-12">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="text-center text-slate-500 py-12 border border-slate-200 rounded-md bg-slate-50">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-sm">No projects yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {projects.map((project) => (
                        <tr
                          key={project.id}
                          onClick={() => handleSelectProject(project.id)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-slate-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{project.title}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600">
                              {new Date(project.created_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600">
                              {new Date(project.updated_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => handleDelete(e, project.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 
                                       transition-colors duration-150"
                              title="Delete project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className="text-left p-6 border border-slate-200 rounded-md hover:border-slate-300 
                               hover:bg-slate-50 transition-all duration-200 flex flex-col h-48"
                  >
                    <div className="mb-4 w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                      <t.icon className="w-5 h-5" />
                    </div>
                    
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-auto">
                      {t.description}
                    </p>
                    
                    <div className="mt-4 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      Select <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelection;