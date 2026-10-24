import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LandingPagePreviewCube from '../components/cube/LandingPagePreviewCube';
import LogConsole from '../components/common/LogConsole';

const LandingPage = () => {
  const navigate = useNavigate();

  // Mock trace logs for landing demo
  const sampleTraceLogs = [
    { id: 1, type: "solve", message: "Launching deployment trace...", timestamp: "18:59:15" },
    { id: 2, type: "info", message: "Initializing solver: threadpool_size=4, caching=ON", timestamp: "18:59:15" },
    { id: 3, type: "ok", message: "Solver core online. Version cpp-2.0.0", timestamp: "18:59:15" },
    { id: 4, type: "trace", message: "Received scramble request: D L2 F U R' B' L B D' ...", timestamp: "18:59:16" },
    { id: 5, type: "stats", message: "Nodes evaluated: 14,203 | Pruned: 27,902 | Speed: 3.3k/sec", timestamp: "18:59:17" },
    { id: 6, type: "success", message: "Solved optimally in 12 steps. Independent validator verified OK.", timestamp: "18:59:18" }
  ];

  const algorithms = [
    {
      code: "BFS",
      name: "Breadth-First Search",
      desc: "Explores nodes layer-by-layer. Guarantees finding the shortest path (optimal), but suffers from exponential memory growth.",
      meta: "Completeness: Yes | Space: O(b^d) | Optimal: Yes",
      color: "border-l-accent-blue"
    },
    {
      code: "DFS",
      name: "Depth-First Search",
      desc: "Explores branches as deeply as possible before backtracking. Extremely memory efficient, but does not guarantee the shortest path.",
      meta: "Completeness: No | Space: O(d) | Optimal: No",
      color: "border-l-accent-red"
    },
    {
      code: "IDDFS",
      name: "Iterative Deepening DFS",
      desc: "Repeatedly runs depth-limited DFS. Combines BFS optimality with DFS memory-efficiency at the cost of repeated computations.",
      meta: "Completeness: Yes | Space: O(d) | Optimal: Yes",
      color: "border-l-accent-orange"
    },
    {
      code: "IDA*",
      name: "Korf's IDA* Search",
      desc: "Depth-first search pruned by an admissible heuristic estimating remaining cost. The state-of-the-art for Rubik's Cube optimality.",
      meta: "Completeness: Yes | Space: O(d) | Optimal: Yes",
      color: "border-l-accent-green"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-page select-none">
      {/* Hero Section */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-8 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        {/* Left Column */}
        <div className="md:col-span-7 flex flex-col items-start gap-6">
          <div className="bg-accent-blue-bg text-accent-blue rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest font-sans">
            INTELLIGENT STATE-SPACE EXPLORATION
          </div>
          <h1 className="text-[36px] sm:text-[48px] font-extrabold leading-[1.1] text-primary font-sans tracking-tight">
            Explore how algorithms solve a Rubik's Cube.
          </h1>
          <p className="text-[15px] sm:text-[16px] text-secondary max-w-lg leading-relaxed font-sans">
            A visual playground and benchmark laboratory. Scramble a 3D/2D cube, trace execution steps of state-space searches, and compare structural algorithm metrics.
          </p>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button
              variant="primary-black"
              onClick={() => navigate('/solve')}
              className="px-6 py-3 font-semibold text-[14px]"
            >
              Try the Solver
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/compare')}
              className="px-6 py-3 font-semibold text-[14px]"
            >
              Compare Algorithms
            </Button>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-5 flex justify-center">
          <Card className="w-full max-w-[380px] p-8 flex flex-col items-center border border-subtle bg-surface">
            <LandingPagePreviewCube />
            <div className="mt-6 w-full pt-4 border-t border-subtle text-center">
              <Button
                variant="link"
                onClick={() => navigate('/solve/9824a-IDF')}
                className="font-bold tracking-tight text-[13px]"
              >
                View Demo Result &rarr;
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Core Search Strategies Section */}
      <section className="bg-gray-100 border-y border-subtle">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-16">
          <div className="flex flex-col items-center text-center gap-2 mb-12">
            <span className="text-[11px] font-bold text-accent-orange uppercase tracking-widest font-sans">
              THE FOUR CHANNELS
            </span>
            <h2 className="text-[28px] font-extrabold text-primary font-sans tracking-tight">
              Core Search Strategies
            </h2>
            <p className="text-secondary text-[14px] max-w-lg font-sans">
              Test and trace different paths to find solutions, measuring space, time, and optimality guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {algorithms.map((alg) => (
              <Card
                key={alg.code}
                className={`border-l-4 ${alg.color} bg-surface hover:translate-y-[-2px] transition-transform duration-200`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[16px] font-bold text-primary font-sans">
                    {alg.name}
                  </h3>
                  <span className="bg-gray-100 text-secondary font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {alg.code}
                  </span>
                </div>
                <p className="text-secondary text-[13px] leading-relaxed mb-6 font-sans min-h-[72px]">
                  {alg.desc}
                </p>
                <div className="border-t border-subtle pt-3">
                  <span className="font-mono text-[11px] text-muted font-mono block">
                    {alg.meta}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visualizing DSA Metrics Section */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column */}
        <div className="flex flex-col gap-6 items-start">
          <div className="text-[11px] font-bold text-accent-blue uppercase tracking-widest font-sans">
            DEEP GRAPH TELEMETRY
          </div>
          <h2 className="text-[30px] font-extrabold text-primary leading-tight font-sans tracking-tight">
            Visualizing Algorithm Performance
          </h2>
          <p className="text-[14px] text-secondary leading-relaxed font-sans max-w-lg">
            Our high-performance solver returns exhaustive diagnostics. Observe pruning rates, depth metrics, and memory overhead directly inside your dashboard.
          </p>

          <div className="flex flex-col gap-6 w-full">
            <div className="flex gap-4">
              <div className="font-mono text-[15px] font-bold text-accent-blue select-none font-mono">
                [01]
              </div>
              <div>
                <h4 className="font-bold text-[15px] text-primary font-sans">
                  Real-time Search Telemetry
                </h4>
                <p className="text-secondary text-[13px] leading-relaxed mt-1 font-sans">
                  Watch node thresholds grow, heuristics evaluate, and branches prune step-by-step.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="font-mono text-[15px] font-bold text-accent-blue select-none font-mono">
                [02]
              </div>
              <div>
                <h4 className="font-bold text-[15px] text-primary font-sans">
                  Independently Verified Solutions
                </h4>
                <p className="text-secondary text-[13px] leading-relaxed mt-1 font-sans">
                  Every solution path generated is applied back to the initial cube state to guarantee mathematical correctness before display.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Log Console */}
        <div>
          <Card title="Active Deployment Trace" subtitle="Direct stdin/stdout socket connection status" className="bg-surface shadow-none border border-subtle">
            <LogConsole logs={sampleTraceLogs} maxHeight="260px" />
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
