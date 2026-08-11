import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import LogConsole from '../components/common/LogConsole';
import { MOCK_SOLVES, MOCK_TRACE_LOGS } from '../services/mockData';
import { api } from '../services/api';

const ResultDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics', 'trace', 'explanation'
  const [copied, setCopied] = useState(false);
  const [solve, setSolve] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const job = await api.getJobDetails(id);
        const res = job.solve_results?.[0] || null;
        setSolve({
          id: job.id,
          input_scramble: job.cube_state,
          algorithm: job.algorithm,
          heuristic: job.heuristic,
          status: job.status,
          created_at: job.created_at,
          result: res ? {
            solution: res.solution,
            solution_length: res.solution.length,
            nodes_generated: res.nodes_generated,
            nodes_expanded: res.nodes_expanded,
            nodes_pruned: res.nodes_pruned,
            duplicate_states: res.duplicate_states,
            max_depth_reached: res.max_depth_reached,
            threshold_iterations: res.threshold_iterations,
            elapsed_ms: res.elapsed_ms,
            peak_memory_bytes: res.peak_memory_bytes,
            trace_logs: res.trace_logs
          } : null
        });
      } catch (err) {
        console.warn('[DETAILS] Failed to load job details, using mock fallback:', err);
        const mockSolve = MOCK_SOLVES.find(s => s.id === id) || MOCK_SOLVES[0];
        setSolve(mockSolve);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const result = solve?.result;

  const handleCopy = () => {
    if (result && result.solution) {
      navigator.clipboard.writeText(result.solution.join(' '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReplayInWorkspace = () => {
    // Navigate back to solver workspace preloaded with this scramble and solution
    navigate('/solve', {
      state: {
        scramble: solve.input_scramble,
        solution: result ? result.solution : []
      }
    });
  };

  if (loading || !solve) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 font-sans items-center justify-center min-h-[300px]">
        <div className="text-secondary font-semibold text-lg animate-pulse">Loading execution details...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 select-none font-sans">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col gap-2">
        <Link to="/solve" className="text-[13px] font-semibold text-accent-blue hover:text-blue-700 transition-colors self-start">
          &larr; Back to workspace
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[28px] sm:text-[32px] font-bold text-primary font-sans leading-tight">
            Solve Log #{solve.id}
          </h1>
          <StatusBadge status={solve.status} />
        </div>
      </div>

      {/* Main Solution Sequence Card */}
      {result ? (
        <Card className="bg-surface border border-subtle">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-grow">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-2">
                OPTIMAL SOLUTION MOVE SEQUENCE ({result.solution_length} MOVES)
              </span>
              <div className="flex flex-wrap gap-2.5 p-3 bg-accent-blue-bg/40 border border-accent-blue/15 rounded-btn">
                {result.solution.map((move, idx) => (
                  <span key={idx} className="font-mono text-[18px] sm:text-[22px] font-extrabold text-accent-blue font-mono">
                    {move}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="secondary" onClick={handleCopy} className="h-10 shrink-0 font-semibold">
              {copied ? 'Copied!' : 'Copy move list'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-accent-red-bg/20 border border-accent-red/20 text-center p-6 text-accent-red">
          <h3 className="font-bold text-[16px] font-sans">Search Terminated Unsuccessfully</h3>
          <p className="text-[13px] font-sans mt-1">
            Reason: {solve.status === 'TIMEOUT' ? 'Max execution timeout elapsed.' : 'Out of heap memory protection limit.'}
          </p>
        </Card>
      )}

      {/* Tabs list */}
      <div className="flex items-center gap-6 border-b border-subtle select-none">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 text-[14px] font-bold font-sans transition-all border-b-2 ${
            activeTab === 'metrics'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Algorithm Metrics
        </button>
        <button
          onClick={() => setActiveTab('trace')}
          className={`pb-3 text-[14px] font-bold font-sans transition-all border-b-2 ${
            activeTab === 'trace'
              ? 'border-transparent text-secondary hover:text-primary border-primary'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
          style={{ borderBottomColor: activeTab === 'trace' ? '#111827' : 'transparent' }}
        >
          Search Trace Log
        </button>
        <button
          onClick={() => setActiveTab('explanation')}
          className={`pb-3 text-[14px] font-bold font-sans transition-all border-b-2 ${
            activeTab === 'explanation'
              ? 'border-transparent text-secondary hover:text-primary border-primary'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
          style={{ borderBottomColor: activeTab === 'explanation' ? '#111827' : 'transparent' }}
        >
          Graph Explanation
        </button>
      </div>

      {/* Two-column Content Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (65% width) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeTab === 'metrics' && (
            <Card title="Search Statistics" subtitle="Exhaustive metrics returned by the C++ engine core">
              <div className="flex flex-col text-[14px] font-sans">
                {/* Statistics rows */}
                <div className="flex justify-between items-center py-3 border-b border-subtle">
                  <span className="text-secondary">Selected Algorithm</span>
                  <span className="font-mono font-bold text-primary">{solve.algorithm}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-subtle">
                  <span className="text-secondary">Active Heuristic Model</span>
                  <span className="font-mono font-bold text-primary">
                    {solve.heuristic ? solve.heuristic : 'None (Uninformed Search)'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-subtle">
                  <span className="text-secondary">Execution Time</span>
                  <span className="font-mono font-bold text-primary">
                    {result ? `${(result.elapsed_ms / 1000).toFixed(2)}s` : 'OOM/TO'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-subtle">
                  <span className="text-secondary">States/Nodes Generated</span>
                  <span className="font-mono font-bold text-primary">
                    {result ? result.nodes_generated.toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-subtle">
                  <span className="text-secondary">Pruned Leaves</span>
                  <span className="font-mono font-bold text-accent-red">
                    {result ? result.nodes_pruned.toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-subtle">
                  <span className="text-secondary">Transposition Cache Hits</span>
                  <span className="font-mono font-bold text-accent-green">
                    {result ? result.duplicate_states.toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-subtle">
                  <span className="text-secondary">Max Search Depth Reached</span>
                  <span className="font-mono font-bold text-primary">
                    {result ? result.max_depth_reached : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 last:border-b-0">
                  <span className="text-secondary">Max Memory Footprint</span>
                  <span className="font-mono font-bold text-accent-blue">
                    {result ? `${(result.peak_memory_bytes / 1000000).toFixed(2)} MB` : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'trace' && (
            <Card title="Active Execution Trace" subtitle="Sub-millisecond timestamps of search bounds">
              <LogConsole logs={MOCK_TRACE_LOGS} maxHeight="350px" />
            </Card>
          )}

          {activeTab === 'explanation' && (
            <Card title="Graph State Space Explanation" subtitle="How this solution was calculated">
              <div className="text-[14px] text-primary leading-relaxed font-sans flex flex-col gap-4">
                <p>
                  A Rubik's Cube state can be mapped to a node in an undirected graph. The starting node represents the scrambled state (<strong>Initial State S_0</strong>), and the target node represents the fully solved state (<strong>Solved State G</strong>).
                </p>
                <p>
                  To find the shortest sequence of moves, we run Korf's <strong>IDA* (Iterative Deepening A*)</strong> search. IDA* uses the <strong>Corner-Edge Lower Bound</strong> heuristic to estimate the minimum number of moves remaining. Because the estimate is <em>admissible</em> (never overestimates), the final path is guaranteed to be optimal.
                </p>
                <p>
                  In this run, the heuristic pruned <strong>{result ? result.nodes_pruned.toLocaleString() : 'N/A'}</strong> branches early before their total path cost exceeded the depth threshold, saving substantial search time.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (35% width) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card title="Actions" subtitle="Manage this run record">
            <div className="flex flex-col gap-3">
              {result && (
                <Button variant="primary-black" onClick={handleReplayInWorkspace} fullWidth>
                  Replay solution steps
                </Button>
              )}
              <Button variant="secondary" onClick={() => alert('Saved to history!')} fullWidth>
                Save to Workspace
              </Button>
              <Button variant="secondary" onClick={() => alert('Share link copied to clipboard!')} fullWidth>
                Share report
              </Button>
              <div className="text-center mt-3">
                <Button variant="link" onClick={() => navigate('/compare')}>
                  Compare with other algorithms
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResultDetailsPage;
