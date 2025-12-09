import { GoogleGenAI, Type } from "@google/genai";
import { ResearchConfig, Task, ResearchResult, GraphData, ReviewMetrics } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Helpers to format inputs
const formatConfigPrompt = (config: ResearchConfig) => `
Topic: ${config.topic}
Template: ${config.template}
Selected Agents: ${config.selectedAgents.join(', ')}
Resources: ${config.selectedResources.join(', ')}
Custom Data Context: ${config.customData ? config.customData.substring(0, 500) + '...' : 'None'}
`;

export const generateTaskName = async (description: string, agent: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Generate a short, concise task name (3-6 words) for this research task.
    
    Agent: ${agent}
    Description: ${description}
    
    Return ONLY the task name as a string, no quotes or additional text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const name = response.text?.trim() || 'Research Task';
    return name.replace(/^["']|["']$/g, ''); // Remove any quotes if present
  } catch (error) {
    console.error("Error generating task name:", error);
    return 'Research Task';
  }
};

export const chatWithDocument = async (userQuestion: string, documentContent: string): Promise<string> => {
  const model = "gemini-2.5-flash-lite";
  
  const prompt = `You are a helpful research assistant for a pharmaceutical research platform. The user is viewing a document and wants to discuss it with you.

Document Context (first 3000 characters):
${documentContent.substring(0, 3000)}

User's question: ${userQuestion}

Please provide a helpful, concise response (2-3 sentences max) that relates to the document context. If the question is not related to the document, politely redirect the conversation back to the document.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || 'I apologize, I encountered an error. Could you please rephrase your question?';
  } catch (error) {
    console.error("Error in chat with document:", error);
    return 'Sorry, I encountered an error processing your message. Please try again.';
  }
};

export const generateSubnodes = async (nodeName: string): Promise<string> => {
  const model = "gemini-2.5-flash-lite";
  
  const prompt = `You are a knowledge graph expert in biomedical research. Generate 3-4 related entities, concepts, or research areas related to: "${nodeName}".

Format each as a single line with the entity name and type in parentheses. Examples:
- Entity Name (Drug)
- Concept Name (Disease)
- Research Area (Trial)

Types can be: Drug, Company, Disease, Patent, Trial, Technology, Protein, Gene, Pathway, or Topic.

Return ONLY the list of entities, one per line, no numbering or additional text.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || '';
  } catch (error) {
    console.error("Error generating subnodes:", error);
    return '';
  }
};

export const extractChartData = async (documentContent: string): Promise<any[]> => {
  const model = "gemini-2.5-flash-lite";
  
  const prompt = `Analyze the pharmaceutical research document and extract data suitable for creating charts and visualizations.

Document Content (first 5000 characters):
${documentContent.substring(0, 5000)}

Extract numerical data that could be visualized as:
- Bar charts (comparisons, rankings)
- Line charts (trends over time)
- Pie charts (market share, percentages)
- Table data (structured comparisons)

For each chart, provide:
1. chartType: "bar" | "line" | "pie" | "table"
2. title: descriptive title
3. description: what the chart shows
4. data: array of data points with labels and values
5. labels: axis labels or legend labels

Return as JSON array of chart objects. Minimum 2-3 charts.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              chartType: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              data: { 
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  }
                }
              },
              labels: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const raw = JSON.parse(response.text || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    console.error("Error extracting chart data:", error);
    return [];
  }
};

export const generateResearchPlan = async (config: ResearchConfig): Promise<Task[]> => {
  const model = "gemini-2.5-flash-lite"; 
  
  const prompt = `
    You are a Lead Strategy Coordinator for a Pharmaceutical Market Intelligence Platform.
    
    Based on the following request, generate a list of 4-6 specific research sub-tasks.
    
    Agent Capabilities:
    - IQVIA Insights Agent: Queries mock IQVIA datasets for market size, sales trends, and therapy dynamics.
    - EXIM Trends Agent: Extracts mock import/export data, trade volumes, and sourcing.
    - Patent Landscape Agent: Searches USPTO API clone for patents, expiry, and FTO.
    - Clinical Trials Agent: Fetches pipeline data from ClinicalTrials.gov stub.
    - Internal Knowledge Agent: Retrieves internal strategy decks and field insights.
    - Web Intelligence Agent: Simulated web search for guidelines and news.
    - Report Generator Agent: Synthesizes final output into PDF-ready format.

    Request:
    ${formatConfigPrompt(config)}
    
    Return a JSON array of objects with 'description' and 'agent' properties. Assign the most appropriate selected agent to each task.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              agent: { type: Type.STRING },
            },
            required: ["description", "agent"],
          },
        },
      },
    });

    const rawTasks = JSON.parse(response.text || "[]");
    const tasksArray = Array.isArray(rawTasks) ? rawTasks : [];
    
    // Generate names for each task
    const tasksWithNames = await Promise.all(
      tasksArray.map(async (t: any, idx: number) => {
        const description = t.description || "Pending task description...";
        const agent = t.agent || "Pending Agent";
        const name = await generateTaskName(description, agent);
        
        return {
          id: `task-${idx}`,
          name,
          description,
          agent,
          status: 'pending'
        };
      })
    );
    
    return tasksWithNames;
  } catch (error) {
    console.error("Error generating research plan:", error);
    return [];
  }
};

export const executeResearchDraft = async (config: ResearchConfig, tasks: Task[]): Promise<string> => {
  // Using Pro for complex reasoning and writing quality
  const model = "gemini-2.5-flash-lite";

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const taskList = safeTasks.map(t => `- [${t.agent}] ${t.description}`).join('\n');

  const prompt = `
    Act as a collaborative team of Pharmaceutical Strategy & Market Intelligence experts (${config.selectedAgents.join(', ')}).
    
    Your goal is to write a ${config.template} on the topic: "${config.topic}".
    
    Execute the following research plan to build the content:
    ${taskList}
    
    AVAILABLE MOCK SOURCES (Simulate data from these if selected):
    - IQVIA Mock API: Generate realistic market share %, CAGR, and sales volume data.
    - EXIM Mock Server: Generate realistic import/export kg volumes and supplier names.
    - USPTO API Clone: Generate realistic patent numbers (US-XXXXXXX), expiry dates, and assignees.
    - Clinical Trials API Stub: Generate realistic NCT numbers (NCTXXXXXXX) and trial phases.
    - Internal Docs Repository: Incorporate insights from "Strategy Deck v4" or similar simulated internal docs.
    
    Include the user's custom data in the "${config.customDataSection}" section.
    Custom Data:
    ${config.customData}

    Structure the output strictly in Markdown format appropriate for a ${config.template}. 
    Ensure professional business/medical tone, use data tables where appropriate, and cite sources (e.g., "Source: IQVIA Mock API").
    Do NOT include the plan in the final output, only the final report content.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "# Error generating content.";
  } catch (error) {
    console.error("Error executing research draft:", error);
    return "# Error generating content. Please try again.";
  }
};

export const generateKnowledgeGraph = async (text: string): Promise<GraphData> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    Analyze the following pharmaceutical intelligence report and extract a Knowledge Graph representing key entities.
    
    Text snippet:
    ${text.substring(0, 8000)}... (truncated)

    Extract:
    - Drugs / Molecules / Products
    - Companies / Sponsors / Competitors
    - Diseases / Indications
    - Patents / Regulations / Trials

    Return a JSON object with 'nodes' (id, label, group) and 'links' (source, target, relation).
    Groups: 
    1 = Drug/Product
    2 = Company/Sponsor
    3 = Disease/Indication
    4 = Patent/Regulation/Trial
    
    Source and Target in links must match Node IDs.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  group: { type: Type.INTEGER },
                }
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  relation: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    }
    );

    const raw = JSON.parse(response.text || '{"nodes": [], "links": []}');
    return {
      nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
      links: Array.isArray(raw.links) ? raw.links : []
    };
  } catch (error) {
    console.error("Error generating knowledge graph:", error);
    return { nodes: [], links: [] };
  }
};

export const reviewContent = async (text: string): Promise<ReviewMetrics> => {
  const model = "gemini-2.5-flash-lite";

  const prompt = `
    Act as a Senior Pharmaceutical Consultant. Review the following report for strategic insight and accuracy.
    Score it from 0-100 on the following metrics: Overall, Readability, Accuracy (Market/Clinical validity), Coherence, Language Quality.
    Provide 3 brief suggestions for improvement.

    Text:
    ${text.substring(0, 10000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            readability: { type: Type.NUMBER },
            accuracy: { type: Type.NUMBER },
            coherence: { type: Type.NUMBER },
            languageQuality: { type: Type.NUMBER },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
  });

    const raw = JSON.parse(response.text || '{}');
    
    // Ensure safe return object with defaults
    return {
      overallScore: raw.overallScore || 0,
      readability: raw.readability || 0,
      accuracy: raw.accuracy || 0,
      coherence: raw.coherence || 0,
      languageQuality: raw.languageQuality || 0,
      suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : []
    };
  } catch (error) {
    console.error("Error reviewing content:", error);
    return {
      overallScore: 0,
      readability: 0,
      accuracy: 0,
      coherence: 0,
      languageQuality: 0,
      suggestions: ["Review generation failed. Please try again."]
    };
  }
};

export const refineSection = async (originalText: string, instruction: string): Promise<string> => {
    const model = "gemini-3-pro-preview";
    
    const prompt = `
    You are editing a pharmaceutical strategy document. 
    Refine the following text based on this instruction: "${instruction}".
    Maintain professional tone.

    Original Text:
    ${originalText}
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });

        return response.text || originalText;
    } catch (error) {
        console.error("Error refining section:", error);
        return originalText;
    }
}