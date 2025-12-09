import { supabase } from './supabaseClient';

// Generate a unique thread ID
export function generateThreadId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Save a new project
export async function saveProject(userId: string, { title, generatedDocument, chatHistory, knowledgeGraph, threadId }: any) {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        user_id: userId,
        thread_id: threadId || generateThreadId(),
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
  console.log('\n🗂️ SUPABASE FETCH INITIATED:');
  console.log('  - Project ID:', projectId);
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('❌ Supabase fetch FAILED:', error.message);
    throw new Error(`Failed to fetch project: ${error.message}`);
  }
  
  console.log('✅ Supabase fetch SUCCESS');
  if (data?.chat_history) {
    console.log('  - Chat history count retrieved:', data.chat_history.length);
    console.log('  - Chat history preview:', JSON.stringify(data.chat_history.slice(0, 2), null, 2));
  } else {
    console.log('  - ⚠️ No chat_history field found in retrieved data');
  }
  return data;
}

// Update a project
export async function updateProject(projectId: string, updates: any) {
  console.log('\n🗄️ SUPABASE UPDATE INITIATED:');
  console.log('  - Project ID:', projectId);
  if (updates.chat_history) {
    console.log('  - Chat history count:', updates.chat_history.length);
    console.log('  - Chat history preview:', JSON.stringify(updates.chat_history.slice(0, 2), null, 2));
  }
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select();

  if (error) {
    console.error('❌ Supabase update FAILED:', error.message);
    throw new Error(`Failed to update project: ${error.message}`);
  }
  
  console.log('✅ Supabase update SUCCESS');
  console.log('   - Returned data:', data?.[0] ? 'Yes' : 'No');
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
