import { useState } from 'react';
import { saveProject, getUserProjects } from '../utils/projectService';

export function SupabaseTest() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [projects, setProjects] = useState<any[]>([]);

  const testSaveProject = async () => {
    setLoading(true);
    setMessage('');
    try {
      // Using a valid UUID for testing - replace with actual authenticated user ID
      const testUserId = '550e8400-e29b-41d4-a716-446655440000';
      
      const newProject = await saveProject(testUserId, {
        title: 'Test Project',
        generatedDocument: { content: 'Test document content' },
        chatHistory: [{ role: 'user', message: 'Hello' }],
        knowledgeGraph: { nodes: [], edges: [] },
      });

      setMessage(`✅ Project saved successfully! ID: ${newProject?.id}`);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testFetchProjects = async () => {
    setLoading(true);
    setMessage('');
    try {
      const testUserId = '550e8400-e29b-41d4-a716-446655440000';
      const data = await getUserProjects(testUserId);
      setProjects(data || []);
      setMessage(`✅ Fetched ${data?.length || 0} projects`);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Supabase Test</h2>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={testSaveProject} disabled={loading} style={{ marginRight: '10px' }}>
          {loading ? 'Saving...' : 'Save Test Project'}
        </button>
        <button onClick={testFetchProjects} disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Projects'}
        </button>
      </div>
      {message && <p style={{ fontWeight: 'bold', color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
      {projects.length > 0 && (
        <div>
          <h3>Projects:</h3>
          <pre>{JSON.stringify(projects, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
