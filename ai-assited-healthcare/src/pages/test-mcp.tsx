import { useState } from 'react';
import { mcpClient } from '../lib/mcp-client';

export default function TestMCP() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing MCP connection...');
      
      // Test server health/initialization
      const health = await mcpClient.checkServerHealth();
      console.log('Health check result:', health);
      
      if (!health) {
        throw new Error('Server health check failed');
      }

      // Test calling a tool
      const response = await mcpClient.callTool('list_all_patients', {});
      console.log('Tool call response:', response);
      
      setResult(response);
    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testSpecificTool = async (toolName: string, params: any = {}) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await mcpClient.callTool(toolName, params);
      setResult(response);
    } catch (err) {
      console.error(`Test failed for ${toolName}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>MCP Server Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Testing...' : 'Test Basic Connection'}
        </button>

        <button 
          onClick={() => testSpecificTool('get_assessment_summary_stats', { assessment_type: 'phq' })} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          Test PHQ Stats
        </button>

        <button 
          onClick={() => testSpecificTool('identify_patients_needing_attention', { risk_threshold: 0.7 })} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Risk Assessment
        </button>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <h3>Result:</h3>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>Available Tools to Test:</h3>
        <ul>
          <li>list_all_patients</li>
          <li>get_assessment_summary_stats</li>
          <li>identify_patients_needing_attention</li>
          <li>get_patient_phq_scores</li>
          <li>analyze_patient_progress</li>
          <li>get_patient_substance_history</li>
          <li>calculate_composite_risk_score</li>
        </ul>
      </div>
    </div>
  );
}