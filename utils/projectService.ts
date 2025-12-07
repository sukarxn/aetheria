import { supabase } from './supabaseClient';

// Save a new project
export async function saveProject(userId: string, { title, generatedDocument, chatHistory, knowledgeGraph }: any) {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        user_id: userId,
        title,
        generated_document: generatedDocument,
        chat_history: chatHistory,
        knowledge_graph: knowledgeGraph,
      },
    ])
    .select();

  if (error) throw new Error(`Failed to save project: ${error.message}`);
  return data?.[0];
}

// Get all projects for a user
export async function getUserProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return data;
}

// Get a specific project
export async function getProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw new Error(`Failed to fetch project: ${error.message}`);
  return data;
}

// Update a project
export async function updateProject(projectId: string, updates: any) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select();

  if (error) throw new Error(`Failed to update project: ${error.message}`);
  return data?.[0];
}

// Delete a project
export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}
