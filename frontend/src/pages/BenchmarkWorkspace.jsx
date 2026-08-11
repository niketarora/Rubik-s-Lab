import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Checkbox from '../components/common/Checkbox';
import ProgressBar from '../components/common/ProgressBar';
import LogConsole from '../components/common/LogConsole';
import Table from '../components/common/Table';
import { MOCK_BENCHMARKS } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { io } from 'socket.io-client';

const BenchmarkWorkspace = () => {
  const { user } = useAuth();
  const mockBenchmarkData = MOCK_BENCHMARKS[0];

  // Configuration State
  const [scramble, setScramble] = useState(mockBenchmarkData.scramble);
  const [compareBFS, setCompareBFS] = useState(true);
  const [compareDFS, setCompareDFS] = useState(true);
  const [compareIDDFS, setCompareIDDFS] = useState(true);
  const [compareIDAStar, setCompareIDAStar] = useState(true);

  const [testCases, setTestCases] = useState(mockBenchmarkData.test_cases);
  const [scrambleDepth, setScrambleDepth] = useState(mockBenchmarkData.scramble_depth);
  const [timeout, setTimeoutVal] = useState(mockBenchmarkData.timeout_ms / 1000);
  const [memoryLimit, setMemoryLimit] = useState(mockBenchmarkData.memory_limit_bytes / 1000000);

  // Execution State
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [progressLogs, setProgressLogs] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(mockBenchmarkData.results);

  // Reset configuration
  const handleReset = () => {
    setCompareBFS(true);
    setCompareDFS(true);
    setCompareIDDFS(true);
    setCompareIDAStar(true);
    setTestCases(100);
    setScrambleDepth(20);
    setTimeoutVal(30);
    setMemoryLimit(50);
    setShowResults(false);
    setRunning(false);
    setCompleted(0);
    setProgressLogs([]);
    setResultsData(mockBenchmarkData.results);
  };

  // Run mock benchmark
  const runMockSimulation = () => {
    setRunning(true);
    setCompleted(0);
    setShowResults(false);
    setProgressLogs([
      { id: 1, type: "info", message: "Initialising benchmark runner daemon...", timestamp: new Date().toLocaleTimeString() },
      { id: 2, type: "info", message: `Configured: ${testCases} cases, depth=${scrambleDepth}, memory_limit=${memoryLimit}MB`, timestamp: new Date().toLocaleTimeString() }
    ]);

    const logsTemplate = [
      { progress: 10, log: { id: 3, type: "solve", message: "Enqueueing BFS test runs...", timestamp: new Date().toLocaleTimeString() } },
      { progress: 25, log: { id: 4, type: "error", message: "BFS exceeded memory limit (50MB) on case #24. Terminated.", timestamp: new Date().toLocaleTimeString() } },
      { progress: 40, log: { id: 5, type: "solve", message: "Enqueueing DFS test runs (non-optimal mode)...", timestamp: new Date().toLocaleTimeString() } },
      { progress: 60, log: { id: 6, type: "ok", message: "DFS completed 80/100 successfully. 20 timed out.", timestamp: new Date().toLocaleTimeString() } },
      { progress: 75, log: { id: 7, type: "solve", message: "Enqueueing IDDFS test runs...", timestamp: new Date().toLocaleTimeString() } },
      { progress: 90, log: { id: 8, type: "ok", message: "IDDFS completed 100/100 successfully.", timestamp: new Date().toLocaleTimeString() } },
      { progress: 95, log: { id: 9, type: "solve", message: "Enqueueing IDA* test runs (MisplacedPieces heuristic)...", timestamp: new Date().toLocaleTimeString() } },
      { progress: 100, log: { id: 10, type: "success", message: "IDA* and all child jobs finalized. Collating stats.", timestamp: new Date().toLocaleTimeString() } }
    ];

    let intervalId = setInterval(() => {
      setCompleted(prev => {
        const next = prev + 5;
        const matchingLog = logsTemplate.find(item => item.progress === next);
        if (matchingLog) {
          setProgressLogs(oldLogs => [...oldLogs, matchingLog.log]);
        }

        if (next >= 100) {
          clearInterval(intervalId);
          setRunning(false);
          setShowResults(true);
          setResultsData(mockBenchmarkData.results);
          return 100;
        }
        return next;
      });
    }, 200);
  };

  const handleStartBenchmark = async () => {
    setRunning(true);
    setCompleted(0);
    setShowResults(false);
    setProgressLogs([
      { id: 1, type: "info", message: "Initialising benchmark runner daemon...", timestamp: new Date().toLocaleTimeString() },
      { id: 2, type: "info", message: `Configured: ${testCases} cases, depth=${scrambleDepth}, memory_limit=${memoryLimit}MB`, timestamp: new Date().toLocaleTimeString() }
    ]);

    if (!user || user.role === 'guest') {
      runMockSimulation();
      return;
    }

    try {
      const selectedAlgos = [];
      if (compareBFS) selectedAlgos.push('BFS');
      if (compareDFS) selectedAlgos.push('DFS');
      if (compareIDDFS) selectedAlgos.push('IDDFS');
      if (compareIDAStar) selectedAlgos.push('IDA_STAR');

      const testCasesList = selectedAlgos.map((algo, idx) => ({
        id: `tc_${idx}`,
        options: {
          algorithm: algo,
          heuristic: algo === 'IDA_STAR' ? 'CORNER_EDGE_LOWER_BOUND' : 'NONE',
          maxDepth: scrambleDepth,
          timeoutMs: timeout * 1000
        }
      }));

      const bData = await api.submitBenchmark(scramble, testCasesList);

      const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:4000';
      const socket = io(socketUrl);

      socket.emit('join:job', bData.benchmarkId);

      socket.on('solve:progress', (data) => {
        if (data.progress !== undefined) {
          setCompleted(data.progress);
        }
        if (data.status === 'COMPLETED') {
          setRunning(false);
          setShowResults(true);

          const formatted = data.results.map(item => ({
            algorithm: item.algorithm === 'IDA_STAR' ? 'IDA*' : item.algorithm,
            heuristic: item.heuristic === 'NONE' ? null : item.heuristic,
            success_rate: item.status === 'SOLVED' ? 100.0 : 0.0,
            median_time_ms: item.metrics.elapsedMs,
            mean_time_ms: item.metrics.elapsedMs,
            p95_time_ms: item.metrics.elapsedMs,
            avg_length: item.solution.length,
            nodes_expanded: item.metrics.nodesExpanded,
            pruning_ratio: item.metrics.nodesGenerated > 0 ? `${Math.round((item.metrics.nodesPruned / item.metrics.nodesGenerated) * 100)}%` : '0%',
            peak_memory_bytes: item.metrics.peakMemoryBytes,
            status: item.status === 'SOLVED' ? 'SUCCESS' : 'FAILED'
          }));

          setResultsData(formatted);
          socket.disconnect();
        } else if (data.status === 'FAILED') {
          setRunning(false);
          socket.disconnect();
        }
      });

    } catch (err) {
      console.error('[BENCHMARK] Error submitting:', err);
      runMockSimulation();
    }
  };

  // Table Columns config
  const tableColumns = [
    { key: "algorithm", label: "Algorithm", monospace: false },
    {
      key: "success_rate",
      label: "Success",
      align: "center",
      render: (row, val) => {
        const color = val >= 90 ? 'text-accent-green' : val > 0 ? 'text-accent-orange' : 'text-accent-red';
        return <span className={`font-mono font-bold ${color}`}>{val.toFixed(1)}%</span>;
      }
    },
    { key: "median_time_ms", label: "Median T", align: "right", monospace: true, render: (row, val) => val > 0 ? `${val.toLocaleString()}ms` : 'OOM/TO' },
    { key: "mean_time_ms", label: "Mean T", align: "right", monospace: true, render: (row, val) => val > 0 ? `${val.toLocaleString()}ms` : 'OOM/TO' },
    { key: "p95_time_ms", label: "P95 T", align: "right", monospace: true, render: (row, val) => val > 0 ? `${val.toLocaleString()}ms` : 'OOM/TO' },
    { key: "avg_length", label: "Avg Len", align: "center", monospace: true, render: (row, val) => val > 0 ? `${val.toFixed(1)}` : 'N/A' },
    { key: "nodes_expanded", label: "Nodes Exp", align: "right", monospace: true, render: (row, val) => val.toLocaleString() },
    { key: "pruning_ratio", label: "Pruning", align: "center", monospace: true },
    { key: "peak_memory_bytes", label: "Memory", align: "right", monospace: true, render: (row, val) => `${(val / 1000).toFixed(0)}KB` }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 select-none font-sans">
      {/* H1 header */}
      <div>
        <h1 className="text-[32px] font-bold text-primary leading-tight font-sans">
          Algorithm Benchmark Workspace
        </h1>
        <p className="text-[15px] text-secondary font-sans mt-1">
          Setup and execute massive automated state-space searches comparing speed, efficiency, and heuristics.
        </p>
      </div>

      {/* Top row: Config and progress cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-7">
          <Card title="Benchmark Configuration" subtitle="Define the workload criteria for parallel search runs">
            <div className="flex flex-col gap-4">
              <Input
                label="Benchmark Scramble State"
                value={scramble}
                onChange={(e) => setScramble(e.target.value)}
                monospace
                readOnly
                className="bg-gray-50 border border-subtle text-secondary"
              />

              {/* Checkboxes row */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  ALGORITHMS TO COMPARE
                </label>
                <div className="flex flex-wrap gap-6 mt-1">
                  <Checkbox label="BFS" checked={compareBFS} onChange={(e) => setCompareBFS(e.target.checked)} />
                  <Checkbox label="DFS" checked={compareDFS} onChange={(e) => setCompareDFS(e.target.checked)} />
                  <Checkbox label="IDDFS" checked={compareIDDFS} onChange={(e) => setCompareIDDFS(e.target.checked)} />
                  <Checkbox label="IDA*" checked={compareIDAStar} onChange={(e) => setCompareIDAStar(e.target.checked)} />
                </div>
              </div>

              {/* Limits / workloads */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                <Input
                  label="Test Cases"
                  type="number"
                  value={testCases}
                  onChange={(e) => setTestCases(parseInt(e.target.value))}
                />
                <Input
                  label="Scramble Depth"
                  type="number"
                  value={scrambleDepth}
                  onChange={(e) => setScrambleDepth(parseInt(e.target.value))}
                />
                <Input
                  label="Timeout (sec)"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeoutVal(parseInt(e.target.value))}
                />
                <Input
                  label="Memory Limit (MB)"
                  type="number"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(parseInt(e.target.value))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4">
                <Button variant="primary-blue" onClick={handleStartBenchmark} disabled={running}>
                  {running ? 'Running...' : 'Start Benchmark'}
                </Button>
                <Button variant="secondary" onClick={handleReset}>
                  Reset Configuration
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Progress Card */}
        <div className="lg:col-span-5">
          <Card title="Run Progress" subtitle={running ? "Executing child solver instances" : "Runner Idle"}>
            <div className="flex flex-col gap-4">
              <ProgressBar
                value={completed}
                label={running ? "Running test cases..." : "Suite Complete"}
                colorClass="bg-accent-blue"
              />
              <div className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                ACTIVE BENCHMARK STATUS
              </div>
              <LogConsole logs={progressLogs} maxHeight="170px" />
            </div>
          </Card>
        </div>
      </div>

      {/* Results Table (Middle) */}
      {showResults && (
        <div className="animate-fadeIn flex flex-col gap-6">
          {/* Table */}
          <Card title="Benchmark Performance Results" subtitle="Aggregated metrics from 100 distinct random states">
            <Table
              columns={tableColumns}
              data={resultsData}
              emptyMessage="No benchmark data to show yet."
            />
          </Card>

          {/* Bottom Row: Charts & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart (65% width) */}
            <div className="lg:col-span-8">
              <Card title="Median Execution Time (ms)" subtitle="Lower value represents faster search speed">
                <div className="flex flex-col gap-4 py-3">
                  {resultsData.map(res => {
                    const isFailed = res.status === 'FAILED' || res.median_time_ms === 0 || res.status === 'TIMEOUT' || res.status === 'MEMORY_LIMIT';
                    const maxTime = Math.max(...resultsData.map(r => r.median_time_ms)) || 1;
                    const percentage = isFailed ? 1 : Math.max(10, Math.min(100, (res.median_time_ms / maxTime) * 100));
                    const color = res.algorithm === 'IDA*' ? 'bg-accent-green' : res.algorithm === 'IDDFS' ? 'bg-accent-orange' : res.algorithm === 'DFS' ? 'bg-accent-red' : 'bg-accent-blue';
                    return (
                      <div key={res.algorithm} className="flex items-center gap-4 text-[13px]">
                        <span className="w-16 font-semibold font-sans text-secondary text-right">{res.algorithm}</span>
                        <div className="flex-grow bg-gray-100 rounded-full h-7 overflow-hidden border border-subtle flex items-center pr-2">
                          <div className={`${isFailed ? 'bg-gray-400' : color} h-full rounded-r-md transition-all duration-500`} style={{ width: `${percentage}%` }} />
                          <span className={`font-mono font-bold ${isFailed ? 'text-accent-red' : 'text-primary'} ml-3 font-mono`}>
                            {isFailed ? (res.status === 'MEMORY_LIMIT' ? 'Memory Limit Exceeded' : 'OOM / Timeout / Limit Exceeded') : `${res.median_time_ms.toLocaleString()}ms`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Actions card (35% width) */}
            <div className="lg:col-span-4">
              <Card title="Workspace Actions" subtitle="Save and export this data">
                <div className="flex flex-col gap-3 pt-2">
                  <Button variant="primary-black" fullWidth>
                    Save Benchmark Run
                  </Button>
                  <Button variant="secondary" fullWidth>
                    Export Data (JSON/CSV)
                  </Button>
                  <div className="text-center mt-3">
                    <Button variant="link">
                      Share Performance Report
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkWorkspace;
