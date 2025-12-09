# BioMed Nexus AI

An advanced AI-powered research platform that generates scientific papers, feasibility reports, and pharmacological analyses using specialized multi-agent systems. Built with React, TypeScript, and Google's Gemini API.

## Features

### Multi-Agent Research System
- IQVIA Insights Agent: Market analysis and pharmaceutical data
- Clinical Trials Agent: Clinical trial information and research
- Patent Landscape Agent: Patent and intellectual property analysis
- Web Intelligence Agent: Web-based research and data collection
- Report Generator Agent: Automated document generation
- Internal Knowledge Agent: Access to internal knowledge repositories

### Research Templates
- Original Research Paper: Comprehensive scientific research documentation
- Target Feasibility Report: Drug target and development feasibility analysis
- Pharmacokinetics Analysis: Drug metabolism and kinetic studies
- Drug Repurposing Expert Report: Identification of new therapeutic uses
- Literature Review: Systematic review of scientific literature

### Advanced Features
- Knowledge graph visualization and exploration
- Interactive charts and data analysis with Recharts
- Document viewing with PDF support
- 3D molecule visualization
- Real-time document generation (DOCX, PDF)
- Secure authentication with Supabase
- Task planning and progress tracking
- Conversational AI interface with chat history

## Tech Stack

**Frontend:**
- React 19.2.1
- TypeScript 5.8
- Vite 6.2 (build tool)
- Three.js & React Three Fiber (3D visualization)
- D3.js & Recharts (data visualization)
- Lucide React (icons)

**AI & APIs:**
- Google Gemini API (@google/genai)
- Supabase (authentication & database)

**Document Processing:**
- DOCX (Word document generation)
- PDF.js (PDF viewing)
- HTML2Canvas (screenshot capture)
- jsPDF (PDF generation)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

## Installation & Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd aetheria-full-application
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   
   Create a `.env.local` file in the root directory:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_key
   ```

4. Run the development server
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173` (or the next available port)

## Build & Deployment

Build for production:
```bash
npm build
```

Preview production build:
```bash
npm run preview
```

Deploy to Docker:
A `Dockerfile` is included for containerized deployment:
```bash
docker build -t biomed-nexus-ai .
docker run -p 5173:5173 biomed-nexus-ai
```

## Project Structure

```
├── components/              # React components
│   ├── LoginPage.tsx       # Authentication UI
│   ├── TemplateSelection.tsx # Research template selection
│   ├── TaskPlanner.tsx     # Task planning interface
│   ├── DocumentViewer.tsx  # Document viewing & editing
│   ├── KnowledgeGraph.tsx  # Knowledge graph visualization
│   ├── ChartsViewer.tsx    # Data visualization
│   ├── ResearchTimeline.tsx # Research progress timeline
│   ├── MoleculeViewer.tsx  # 3D molecule visualization
│   ├── AnimatedGraph.tsx   # Animated data graphs
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── SupabaseTest.tsx    # Supabase integration test
│
├── services/               # Business logic & API calls
│   ├── geminiService.ts    # Gemini AI integration
│   ├── apiService.ts       # Research query execution
│   └── chatQueueService.ts # Chat message queue management
│
├── utils/                  # Utility functions
│   ├── projectService.ts   # Project CRUD operations
│   ├── fileExtractor.ts    # Document parsing
│   └── supabaseClient.ts   # Supabase initialization
│
├── App.tsx                 # Main application component
├── types.ts                # TypeScript type definitions
├── index.tsx               # Entry point
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies & scripts
```

## How to Use

1. Login: Authenticate using the login page
2. Select Research Template: Choose from available research templates
3. Configure Research: 
   - Enter your research topic
   - Select AI agents for the research
   - Choose data sources
4. Generate Research Plan: AI generates a structured research plan
5. Execute Research: Agents execute queries and gather information
6. Review & Refine: Review results and refine specific sections
7. Export Document: Download as DOCX or PDF

## Core Concepts

### Research Config
Defines the research parameters including topic, template, selected agents, and data sources.

### Multi-Agent Execution
Specialized agents work in parallel to gather information from different domains and perspectives.

### Knowledge Graph
Visual representation of research concepts and their relationships.

### Chat History
Maintains conversational context for multi-turn research interactions.

## Documentation

- See `CONSOLE_LOGS_GUIDE.md` for debugging information
- See `metadata.json` for application metadata

## Troubleshooting

**API Key Issues:**
- Ensure `GEMINI_API_KEY` is correctly set in `.env.local`
- Verify the API key is active in Google AI Studio

**Build Errors:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version is compatible

**Supabase Connection:**
- Verify Supabase URL and key are correctly configured
- Check browser console for connection errors

## Performance Tips

- The application streams large responses to prevent UI blocking
- Knowledge graphs are generated incrementally
- Documents are cached locally when possible
- Use Chrome DevTools for performance profiling

## License

[Add your license information here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the repository.
