import { supabase } from '../utils/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

// Helper to construct headers with the Supabase session token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session ? session.access_token : '';
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const api = {
  // 1. Scramble Parsing
  parseScramble: async (scramble) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/cube/parse`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ scramble })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Scramble parsing failed.');
    }
    return res.json();
  },

  // 2. State Validation
  validateCube: async (state) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/cube/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ state })
    });
    if (!res.ok) {
      const err = await res.json();
      return { valid: false, message: err.message, errorCode: err.errorCode };
    }
    return res.json();
  },

  // 3. Scramble Generator
  generateScramble: async (length = 20) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/cube/scramble`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ length })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to generate scramble.');
    }
    return res.json();
  },

  // 4. Submit Single Solve Job
  submitSolve: async (cubeState, options = {}) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/jobs/solve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cubeState,
        algorithm: options.algorithm || 'IDA_STAR',
        heuristic: options.heuristic || 'CORNER_EDGE_LOWER_BOUND',
        maxDepth: parseInt(options.maxDepth) || 30,
        timeoutMs: (parseInt(options.timeoutMs) || 30) * 1000,
        collectTrace: options.collectTrace !== false
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Solver submission failed.');
    }
    return res.json();
  },

  // 5. Cancel ongoing solve job
  cancelSolve: async (jobId) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/jobs/solve/${jobId}/cancel`, {
      method: 'POST',
      headers
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Job cancellation failed.');
    }
    return res.json();
  },

  // 6. Submit Multi-Solver Benchmark Run
  submitBenchmark: async (cubeState, testCases) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/benchmarks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cubeState, testCases })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Benchmark submission failed.');
    }
    return res.json();
  },

  // 7. Get specific benchmark details
  getBenchmark: async (benchmarkId) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/benchmarks/${benchmarkId}`, {
      method: 'GET',
      headers
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to fetch benchmark details.');
    }
    return res.json();
  },

  // 8. Fetch paginated user history
  getHistory: async (limit = 20, offset = 0) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/history?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to fetch user history.');
    }
    return res.json();
  },

  // 9. Fetch specific job details
  getJobDetails: async (jobId) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/history/${jobId}`, {
      method: 'GET',
      headers
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to fetch job details.');
    }
    return res.json();
  },

  // 10. Fetch Administrator System metrics
  getAdminMetrics: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/metrics`, {
      method: 'GET',
      headers
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to fetch admin metrics.');
    }
    return res.json();
  },

  // 11. Fetch Administrator System audit logs
  getAdminAuditLogs: async (limit = 50) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/audit-logs?limit=${limit}`, {
      method: 'GET',
      headers
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to fetch audit logs.');
    }
    return res.json();
  }
};
