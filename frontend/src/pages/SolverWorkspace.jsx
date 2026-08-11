import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Checkbox from '../components/common/Checkbox';
import CubeNet2D from '../components/cube/CubeNet2D';
import MoveToolbar from '../components/cube/MoveToolbar';
import SolutionPlayer from '../components/cube/SolutionPlayer';
import LogConsole from '../components/common/LogConsole';
import {
  SOLVED_STATE,
  applyMove,
  applyScramble,
  generateRandomScramble,
  validateScrambleNotation
} from '../utils/cube';
import { MOCK_SOLVES, MOCK_TRACE_LOGS } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { io } from 'socket.io-client';

const SolverWorkspace = () => {
  const { user } = useAuth();
  const [currentJobId, setCurrentJobId] = useState(null);

  useEffect(() => {
    return () => {
      if (window.activeSocket) {
        window.activeSocket.disconnect();
      }
    };
  }, []);

  // Cube State
  const [stickers, setStickers] = useState(SOLVED_STATE);
  const [history, setHistory] = useState([SOLVED_STATE]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Scramble Form
  const [scrambleText, setScrambleText] = useState('');
  const [scrambleError, setScrambleError] = useState(null);
  
  // Solver settings
  const [algorithm, setAlgorithm] = useState('IDA_STAR');
  const [heuristic, setHeuristic] = useState('CORNER_EDGE_LOWER_BOUND');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [maxDepth, setMaxDepth] = useState(30);
  const [timeout, setTimeoutVal] = useState(30); // seconds
  const [memoryLimit, setMemoryLimit] = useState(50); // MB
  const [movePruning, setMovePruning] = useState(true);
  const [transpositionTable, setTranspositionTable] = useState(true);
  const [collectTrace, setCollectTrace] = useState(true);

  // Solve status
  const [solving, setSolving] = useState(false);
  const [solveStatus, setSolveStatus] = useState('IDLE'); // 'IDLE', 'QUEUED', 'RUNNING', 'SOLVED', 'FAILED'
  const [solveLogs, setSolveLogs] = useState([]);
  const [resultMetrics, setResultMetrics] = useState(null);
  const [solution, setSolution] = useState([]);
  
  // The state of the cube during solution replay
  // When replaying, we render this instead of the interactive 'stickers' state
  const [scrambledState, setScrambledState] = useState(SOLVED_STATE);
  const [replayStickers, setReplayStickers] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);

  // Helper: push new state to history stack
  const updateCubeState = (nextState) => {
    const nextHist = history.slice(0, historyIdx + 1);
    nextHist.push(nextState);
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
    setStickers(nextState);
    setIsReplaying(false); // break out of replay mode when manual move is made
  };

  // Manual rotation
  const handleManualMove = (move) => {
    const nextState = applyMove(move, stickers);
    updateCubeState(nextState);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setStickers(history[historyIdx - 1]);
      setIsReplaying(false);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setStickers(history[historyIdx + 1]);
      setIsReplaying(false);
    }
  };

  const handleReset = () => {
    updateCubeState(SOLVED_STATE);
    setScrambleText('');
    setScrambleError(null);
    setSolution([]);
    setResultMetrics(null);
    setSolveStatus('IDLE');
    setSolveLogs([]);
    setIsReplaying(false);
  };

  // Scramble actions
  const handleGenerateScramble = () => {
    const scr = generateRandomScramble(20);
    setScrambleText(scr);
    setScrambleError(null);
  };

  const handleApplyScramble = () => {
    const check = validateScrambleNotation(scrambleText);
    if (!check.valid) {
      setScrambleError(check.error);
      return;
    }
    setScrambleError(null);
    const nextState = applyScramble(scrambleText, SOLVED_STATE);
    updateCubeState(nextState);
    setSolution([]);
    setResultMetrics(null);
    setSolveStatus('IDLE');
  };

  // Simulated Solve execution
  const runMockSimulation = () => {
    setTimeout(() => {
      setSolveStatus('RUNNING');
      setSolveLogs(prev => [
        ...prev,
        { id: 2, type: 'solve', message: `Executing ${algorithm} search with ${heuristic} (local offline simulation)...`, timestamp: new Date().toLocaleTimeString() },
        { id: 3, type: 'info', message: 'Depth-first threshold search running...', timestamp: new Date().toLocaleTimeString() }
      ]);

      setTimeout(() => {
        setSolving(false);
        setSolveStatus('SOLVED');
        
        const mockSolve = MOCK_SOLVES[0];
        setSolution(mockSolve.result.solution);
        setResultMetrics({
          length: mockSolve.result.solution_length,
          generated: mockSolve.result.nodes_generated,
          expanded: mockSolve.result.nodes_expanded,
          pruned: mockSolve.result.nodes_pruned,
          speed: '3.38k n/s',
          memory: `${(mockSolve.result.peak_memory_bytes / 1000000).toFixed(2)} MB`
        });

        setScrambledState(stickers);
        setReplayStickers(stickers);
        setIsReplaying(true);
        setSolveLogs(MOCK_TRACE_LOGS);
      }, 1200);
    }, 600);
  };

  const handleCancel = async () => {
    if (currentJobId) {
      try {
        await api.cancelSolve(currentJobId);
      } catch (err) {
        console.error('[SOLVER] Cancel failed:', err);
      }
    }
    if (window.activeSocket) {
      window.activeSocket.disconnect();
    }
    setSolving(false);
    setSolveStatus('CANCELLED');
    setSolveLogs(prev => [
      ...prev,
      { id: Date.now(), type: 'error', message: 'Job canceled by operator.', timestamp: new Date().toLocaleTimeString() }
    ]);
  };

  const handleSolve = async () => {
    const validation = validateScrambleNotation(scrambleText);
    if (scrambleText && !validation.valid) {
      setScrambleError(validation.error);
      return;
    }

    setSolving(true);
    setSolveStatus('QUEUED');
    setSolution([]);
    setResultMetrics(null);
    setSolveLogs([{ id: 1, type: 'info', message: 'Job initialized. Submitting solver request...', timestamp: new Date().toLocaleTimeString() }]);

    const cubeStateStr = stickers.join('');

    if (!user || user.role === 'guest') {
      runMockSimulation();
      return;
    }

    try {
      const jobData = await api.submitSolve(cubeStateStr, {
        algorithm,
        heuristic,
        maxDepth,
        timeoutMs: timeout,
        collectTrace
      });

      setCurrentJobId(jobData.jobId);

      const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:4000';
      const socket = io(socketUrl);
      window.activeSocket = socket;

      socket.emit('join:job', jobData.jobId);

      socket.on('solve:progress', (data) => {
        if (data.status === 'RUNNING') {
          setSolveStatus('RUNNING');
          if (data.trace) {
            setSolveLogs(data.trace);
          }
        } else if (data.status === 'SOLVED') {
          setSolving(false);
          setSolveStatus('SOLVED');
          setSolution(data.solution);
          setResultMetrics({
            length: data.solution.length,
            generated: data.metrics.nodesGenerated,
            expanded: data.metrics.nodesExpanded,
            pruned: data.metrics.nodesPruned,
            speed: data.metrics.elapsedMs > 0 ? `${Math.round((data.metrics.nodesExpanded / data.metrics.elapsedMs) * 1000)} n/s` : 'N/A',
            memory: `${(data.metrics.peakMemoryBytes / 1000000).toFixed(2)} MB`
          });
          if (data.trace) {
            setSolveLogs(data.trace);
          }
          setScrambledState(stickers);
          setReplayStickers(stickers);
          setIsReplaying(true);

          socket.disconnect();
        } else {
          setSolving(false);
          setSolveStatus(data.status);
          if (data.trace) {
            setSolveLogs(data.trace);
          }
          socket.disconnect();
        }
      });

    } catch (err) {
      console.error('[SOLVER] Submission error, falling back to mock:', err);
      runMockSimulation();
    }
  };

  // Solution replay listener
  const handleReplayStep = (stepIndex) => {
    // stepIndex 0 means initial scrambled state
    if (stepIndex === 0) {
      setReplayStickers(scrambledState);
    } else {
      const movesToApply = solution.slice(0, stepIndex);
      let current = [...scrambledState];
      for (const move of movesToApply) {
        current = applyMove(move, current);
      }
      setReplayStickers(current);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 select-none font-sans">
      {/* Page Title */}
      <div>
        <h1 className="text-[32px] font-bold text-primary font-sans leading-tight">
          Your Solving Workspace
        </h1>
        <p className="text-[15px] text-secondary font-sans mt-1">
          Perform manual rotations, configure search limits, and execute automated algorithm solving.
        </p>
      </div>

      {/* Main Grid: Left Net, Right Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cube Net & Rotation Toolbar */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <CubeNet2D stickers={isReplaying ? replayStickers : stickers} />
          
          <MoveToolbar
            onMove={handleManualMove}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleReset}
            canUndo={historyIdx > 0}
            canRedo={historyIdx < history.length - 1}
          />
        </div>

        {/* Right: Search Parameters */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card title="Search Parameters" subtitle="Configure the C++ engine threshold properties">
            <div className="flex flex-col gap-4">
              {/* Scramble sequence */}
              <div className="flex flex-col gap-2">
                <Input
                  label="Scramble Sequence"
                  placeholder="e.g. R U R' F2 U2 R'"
                  value={scrambleText}
                  onChange={(e) => {
                    setScrambleText(e.target.value);
                    setScrambleError(null);
                  }}
                  monospace
                  error={scrambleError}
                />
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Button variant="secondary" onClick={handleGenerateScramble}>
                    Generate Scramble
                  </Button>
                  <Button variant="secondary" onClick={handleApplyScramble}>
                    Apply Scramble
                  </Button>
                </div>
              </div>

              {/* Algorithm select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  ALGORITHM
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="bg-white border border-subtle rounded-btn py-[10px] px-[12px] text-[14px] text-primary focus-visible:outline-accent-blue"
                >
                  <option value="IDA_STAR">Korf's IDA* (Admissible & Optimal)</option>
                  <option value="IDDFS">IDDFS (Optimal, Exponential Time)</option>
                  <option value="BFS">Breadth-First Search (Shortest path, OOM risk)</option>
                  <option value="DFS">Depth-First Search (Low memory, Non-optimal)</option>
                </select>
              </div>

              {/* Heuristic select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  HEURISTIC MODEL
                </label>
                <select
                  value={heuristic}
                  onChange={(e) => setHeuristic(e.target.value)}
                  disabled={algorithm !== 'IDA_STAR'}
                  className="bg-white border border-subtle rounded-btn py-[10px] px-[12px] text-[14px] text-primary focus-visible:outline-accent-blue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="CORNER_EDGE_LOWER_BOUND">Corner-Edge Lower Bound (Highly Admissible)</option>
                  <option value="MISPLACED_PIECES">Misplaced Pieces (Fast, Weak Bound)</option>
                  <option value="PATTERN_DATABASE">Corner Pattern Database v1.0 (Strict)</option>
                </select>
              </div>

              {/* Advanced Parameters dropdown */}
              <div className="border-t border-subtle pt-3">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="font-mono text-[11px] font-bold text-secondary uppercase hover:text-primary transition-colors flex items-center gap-1.5 focus-visible:outline-none"
                >
                  <span>{advancedOpen ? '▼' : '▶'} ADVANCED PARAMETERS</span>
                </button>
                
                {advancedOpen && (
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-2 border-t border-dashed border-subtle animate-fadeIn">
                    <Input
                      label="Max Depth"
                      type="number"
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                    />
                    <Input
                      label="Timeout (sec)"
                      type="number"
                      value={timeout}
                      onChange={(e) => setTimeoutVal(parseInt(e.target.value))}
                    />
                    <div className="col-span-2 flex flex-col gap-3 mt-2">
                      <Checkbox
                        label="Prune redundant/inverse moves"
                        checked={movePruning}
                        onChange={(e) => setMovePruning(e.target.checked)}
                      />
                      <Checkbox
                        label="Enable Transposition Tables"
                        checked={transpositionTable}
                        onChange={(e) => setTranspositionTable(e.target.checked)}
                      />
                      <Checkbox
                        label="Collect complete execution trace"
                        checked={collectTrace}
                        onChange={(e) => setCollectTrace(e.target.checked)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Solve Button */}
              {solving ? (
                <Button
                  variant="primary-red"
                  fullWidth
                  onClick={handleCancel}
                  className="mt-4 h-12 text-[15px] font-bold tracking-tight animate-fadeIn"
                >
                  Cancel Solving
                </Button>
              ) : (
                <Button
                  variant="primary-green"
                  fullWidth
                  onClick={handleSolve}
                  className="mt-4 h-12 text-[15px] font-bold tracking-tight"
                >
                  Solve Cube
                </Button>
              )}
            </div>
          </Card>

          {/* Active Job status / progress logs */}
          {(solveStatus !== 'IDLE' || solving) && (
            <Card title="Active Solve Progress" subtitle={`Status: ${solveStatus}`}>
              <LogConsole logs={solveLogs} maxHeight="180px" />
            </Card>
          )}
        </div>
      </div>

      {/* Solution Replay Panel */}
      <SolutionPlayer
        solution={solution}
        onStepChange={handleReplayStep}
        cubeState={isReplaying ? replayStickers : stickers}
      />

      {/* Telemetry Metrics strip */}
      {resultMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="flex flex-col items-center justify-center text-center p-4 border border-subtle bg-surface">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
              Solution Length
            </span>
            <span className="font-mono text-[22px] font-bold text-primary font-mono">
              {resultMetrics.length} moves
            </span>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center p-4 border border-subtle bg-surface">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
              Nodes Explored
            </span>
            <span className="font-mono text-[22px] font-bold text-primary font-mono">
              {resultMetrics.generated.toLocaleString()}
            </span>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center p-4 border border-subtle bg-surface">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
              Nodes Pruned
            </span>
            <span className="font-mono text-[22px] font-bold text-accent-red font-mono">
              {resultMetrics.pruned.toLocaleString()}
            </span>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center p-4 border border-subtle bg-surface">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
              Execution Speed
            </span>
            <span className="font-mono text-[22px] font-bold text-accent-green font-mono">
              {resultMetrics.speed}
            </span>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center p-4 border border-subtle bg-surface col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
              Memory Footprint
            </span>
            <span className="font-mono text-[22px] font-bold text-accent-blue font-mono">
              {resultMetrics.memory}
            </span>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SolverWorkspace;
