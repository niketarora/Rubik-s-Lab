import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Checkbox from '../components/common/Checkbox';
import CubeNet2D from '../components/cube/CubeNet2D';
import Cube3D from '../components/cube/Cube3D';
import CubeViewToggle from '../components/cube/CubeViewToggle';
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
  const [algorithm, setAlgorithm] = useState('TWO_PHASE');
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

  // 2D/3D visualizer states
  const [viewMode, setViewMode] = useState('2D');
  const [currentReplayStep, setCurrentReplayStep] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1);

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
    setCurrentReplayStep(0);
  };

  // Scramble actions
  const handleGenerateScramble = (length = 6) => {
    const scrambleLen = typeof length === 'number' ? length : 6;
    const scr = generateRandomScramble(scrambleLen);
    setScrambleText(scr);
    setScrambleError(null);
    const nextState = applyScramble(scr, SOLVED_STATE);
    updateCubeState(nextState);
    setSolution([]);
    setResultMetrics(null);
    setSolveStatus('IDLE');
    setCurrentReplayStep(0);
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
    setCurrentReplayStep(0);
  };

  // Combined scramble/reset for CubeNet2D quadrant icon
  const handleScrambleReset = () => {
    const isSolvedState = JSON.stringify(stickers) === JSON.stringify(SOLVED_STATE);
    if (isSolvedState) {
      handleGenerateScramble(6);
    } else {
      handleReset();
    }
  };

  // Simulated Solve execution fallback
  const runMockSimulation = () => {
    setSolving(false);
    setSolveStatus('FAILED');
    setSolveLogs(prev => [
      ...prev,
      { id: Date.now(), type: 'error', message: 'Unable to connect to backend solver service. Please ensure the server is running on port 4000.', timestamp: new Date().toLocaleTimeString() }
    ]);
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
    setSolveLogs([{ id: 1, type: 'info', message: 'Job initialized. Submitting solver request to C++ engine...', timestamp: new Date().toLocaleTimeString() }]);
    setCurrentReplayStep(0);

    const cubeStateStr = stickers.join('');

    try {
      const jobData = await api.submitSolve(cubeStateStr, {
        algorithm,
        heuristic,
        maxDepth,
        timeoutMs: timeout,
        collectTrace
      });

      setCurrentJobId(jobData.jobId);

      // Handle direct synchronous response from C++ solver
      if (jobData.status === 'SOLVED') {
        setSolving(false);
        setSolveStatus('SOLVED');
        setSolution(jobData.solution || []);
        if (jobData.metrics) {
          setResultMetrics({
            length: jobData.solution ? jobData.solution.length : 0,
            generated: jobData.metrics.nodesGenerated,
            expanded: jobData.metrics.nodesExpanded,
            pruned: jobData.metrics.nodesPruned,
            speed: jobData.metrics.elapsedMs > 0 ? `${Math.round((jobData.metrics.nodesExpanded / jobData.metrics.elapsedMs) * 1000)} n/s` : 'N/A',
            memory: `${((jobData.metrics.peakMemoryBytes || 0) / 1000000).toFixed(2)} MB`
          });
        }
        if (jobData.trace && jobData.trace.length > 0) {
          setSolveLogs(jobData.trace);
        } else {
          setSolveLogs(prev => [
            ...prev,
            { id: Date.now(), type: 'solve', message: `Search complete! Found ${jobData.solution?.length || 0}-move optimal solution in ${jobData.metrics?.elapsedMs || 0}ms.`, timestamp: new Date().toLocaleTimeString() }
          ]);
        }
        setScrambledState(stickers);
        setReplayStickers(stickers);
        setIsReplaying(true);
        return;
      }

      if (jobData.status === 'FAILED' || jobData.status === 'INVALID_STATE' || jobData.status === 'TIMEOUT') {
        setSolving(false);
        setSolveStatus(jobData.status);
        if (jobData.trace && jobData.trace.length > 0) {
          setSolveLogs(jobData.trace);
        } else {
          setSolveLogs(prev => [
            ...prev,
            { id: Date.now(), type: 'error', message: `Solver ended with status: ${jobData.status}`, timestamp: new Date().toLocaleTimeString() }
          ]);
        }
        return;
      }

      // If job is queued in Redis, listen via Socket.IO
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
          setSolution(data.solution || []);
          if (data.metrics) {
            setResultMetrics({
              length: data.solution ? data.solution.length : 0,
              generated: data.metrics.nodesGenerated,
              expanded: data.metrics.nodesExpanded,
              pruned: data.metrics.nodesPruned,
              speed: data.metrics.elapsedMs > 0 ? `${Math.round((data.metrics.nodesExpanded / data.metrics.elapsedMs) * 1000)} n/s` : 'N/A',
              memory: `${((data.metrics.peakMemoryBytes || 0) / 1000000).toFixed(2)} MB`
            });
          }
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
      console.error('[SOLVER] Submission error:', err);
      setSolving(false);
      setSolveStatus('FAILED');
      const isConnectionError = err.message.includes('Failed to fetch') || err.message.includes('NetworkError');
      const displayMsg = isConnectionError
        ? 'Cannot connect to backend server at http://localhost:4000. Please ensure the backend server is running ("npm start" in backend/).'
        : `Solver error: ${err.message}`;

      setSolveLogs(prev => [
        ...prev,
        { id: Date.now(), type: 'error', message: displayMsg, timestamp: new Date().toLocaleTimeString() }
      ]);
    }
  };

  // Solution replay listener
  const handleReplayStep = (stepIndex) => {
    setCurrentReplayStep(stepIndex);
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
        {/* Left: Cube visualizer & Rotation Toolbar */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[12px] font-bold text-secondary uppercase font-sans tracking-wider leading-none">State View</h2>
              <CubeViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>
            
            {viewMode === '2D' ? (
              <div className="relative">
                {isReplaying && solution.length > 0 && currentReplayStep > 0 && (
                  <div className="absolute top-4 left-4 z-10 bg-accent-blue/95 backdrop-blur-sm text-on-dark font-mono font-extrabold text-[20px] px-3.5 py-1.5 rounded-btn shadow border border-white/10 select-none animate-pulse">
                    Active: {solution[currentReplayStep - 1]}
                  </div>
                )}
                <CubeNet2D
                  stickers={isReplaying ? replayStickers : stickers}
                  onScrambleReset={handleScrambleReset}
                />
              </div>
            ) : (
              <div className="flex flex-col border border-subtle bg-surface rounded-card p-6 relative gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-subtle">
                  <h3 className="text-[15px] font-bold text-primary font-sans leading-none">
                    3D Interactive View
                  </h3>
                  <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider font-sans leading-none">
                    Interactive orbit rotation
                  </span>
                </div>
                <div className="relative">
                  {isReplaying && solution.length > 0 && currentReplayStep > 0 && (
                    <div className="absolute top-4 left-4 z-10 bg-accent-blue/95 backdrop-blur-sm text-on-dark font-mono font-extrabold text-[20px] px-3.5 py-1.5 rounded-btn shadow border border-white/10 select-none animate-pulse">
                      Active: {solution[currentReplayStep - 1]}
                    </div>
                  )}
                  <Cube3D
                    stickers={isReplaying ? replayStickers : stickers}
                    solution={solution}
                    currentStep={currentReplayStep}
                    speed={replaySpeed}
                  />
                </div>
              </div>
            )}
          </div>
          
          <MoveToolbar
            onMove={handleManualMove}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleReset}
            canUndo={historyIdx > 0}
            canRedo={historyIdx < history.length - 1}
          />

          {/* Solution Replay Panel moved to Left Column under manual controls to solve split-attention UX */}
          {solution.length > 0 && (
            <SolutionPlayer
              solution={solution}
              onStepChange={handleReplayStep}
              cubeState={isReplaying ? replayStickers : stickers}
              onSpeedChange={setReplaySpeed}
            />
          )}
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
                <div className="flex flex-col gap-2 mt-1">
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="secondary" onClick={() => handleGenerateScramble(6)} className="text-[12px] py-2 px-1">
                      Quick (6 moves)
                    </Button>
                    <Button variant="secondary" onClick={() => handleGenerateScramble(10)} className="text-[12px] py-2 px-1">
                      Medium (10)
                    </Button>
                    <Button variant="secondary" onClick={() => handleGenerateScramble(20)} className="text-[12px] py-2 px-1">
                      Full (20 moves)
                    </Button>
                  </div>
                  <Button variant="secondary" onClick={handleApplyScramble} className="w-full">
                    Apply Scramble Sequence
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
                  <option value="TWO_PHASE">Kociemba Two-Phase (Fast, Near-Optimal ~20ms)</option>
                  <option value="IDA_STAR">Korf's IDA* (Optimal, Shortest Solution)</option>
                  <option value="IDDFS">IDDFS (Iterative Deepening)</option>
                  <option value="BFS">Breadth-First Search (Shortest path)</option>
                  <option value="DFS">Depth-First Search (Fast tree exploration)</option>
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

      {/* Solution Replay Panel moved to left column */}

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
