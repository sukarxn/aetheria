export enum ResearchTemplate {
  ORIGINAL_RESEARCH = 'Original Research Paper',
  TARGET_FEASIBILITY = 'Target Feasibility Report',
  PK_ANALYSIS = 'Pharmacokinetics Analysis',
  DRUG_REPURPOSING = 'Drug Repurposing Expert Report',
  LITERATURE_REVIEW = 'Literature Review',
}

export enum AgentRole {
  IQVIA_AGENT = 'IQVIA Insights Agent',
  EXIM_AGENT = 'EXIM Trends Agent',
  PATENT_AGENT = 'Patent Landscape Agent',
  TRIALS_AGENT = 'Clinical Trials Agent',
  INTERNAL_AGENT = 'Internal Knowledge Agent',
  WEB_AGENT = 'Web Intelligence Agent',
  REPORT_AGENT = 'Report Generator Agent',
}

export enum DataSource {
  IQVIA_API = 'IQVIA Mock API',
  EXIM_SERVER = 'EXIM Mock Server',
  USPTO_API = 'USPTO API Clone',
  TRIALS_API = 'Clinical Trials API Stub',
  INTERNAL_REPO = 'Internal Documents Repository',
  WEB_PROXY = 'Web Search Proxy',
}

export interface ResearchConfig {
  topic: string;
  template: ResearchTemplate;
  customData: string;
  customDataSection: string;
  selectedAgents: AgentRole[];
  selectedResources: DataSource[];
}

export interface Task {
  id: string;
  name?: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  agent: AgentRole;
}

export interface ReviewMetrics {
  overallScore: number;
  readability: number;
  accuracy: number;
  coherence: number;
  languageQuality: number;
  suggestions: string[];
}

export interface GraphNode {
  id: string;
  group: number;
  label: string;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ResearchResult {
  markdown: string;
  graph: GraphData;
  review: ReviewMetrics;
}