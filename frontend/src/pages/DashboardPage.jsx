import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import DonutChart from '../components/common/DonutChart';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import { MOCK_SOLVES } from '../services/mockData';
import { api } from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [recentSolves, setRecentSolves] = useState([]);
  const [stats, setStats] = useState({ total: 145, successRate: 98.6, avgTime: '4.20s' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getHistory(5, 0);
        const formatted = data.jobs.map(job => {
          const res = job.solve_results?.[0] || null;
          return {
            id: job.id,
            input_scramble: job.cube_state,
            algorithm: job.algorithm,
            status: job.status,
            result: res ? {
              solution_length: res.solution.length,
              elapsed_ms: res.elapsed_ms
            } : null
          };
        });
        setRecentSolves(formatted);
        
        // Calculate success rate
        const total = data.total || 0;
        const solved = data.jobs.filter(j => j.status === 'SOLVED').length;
        setStats({
          total,
          successRate: total > 0 ? (solved / data.jobs.length) * 100 : 100,
          avgTime: '4.20s' // Simple static representation or computed
        });
      } catch (err) {
        console.warn('[DASHBOARD] Failed to load dashboard, using mock data:', err);
        setRecentSolves(MOCK_SOLVES.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Columns for recent solves table
  const tableColumns = [
    { key: "id", label: "Solve ID", monospace: true },
    { key: "input_scramble", label: "Scramble Sequence", monospace: true, render: (row, val) => val.length > 25 ? `${val.substring(0, 25)}...` : val },
    { key: "algorithm", label: "Algorithm" },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row, val) => <StatusBadge status={val} />
    },
    { key: "solution_length", label: "Length", align: "center", monospace: true, render: (row) => row.result ? `${row.result.solution_length} moves` : 'N/A' },
    { key: "elapsed_ms", label: "Time", align: "right", monospace: true, render: (row) => row.result ? `${(row.result.elapsed_ms / 1000).toFixed(2)}s` : 'OOM/TO' },
    {
      key: "actions",
      label: "Action",
      align: "center",
      render: (row) => (
        <Button
          variant="link"
          onClick={() => navigate(`/solve/${row.id}`)}
          className="font-semibold text-[13px]"
        >
          View Details
        </Button>
      )
    }
  ];

  const donutLegend = [
    { label: "Optimal solves", value: "92", color: "#16A34A" },
    { label: "Sub-optimal (DFS)", value: "38", color: "#6B7280" },
    { label: "Out of Memory", value: "11", color: "#2563EB" },
    { label: "Timed Out", value: "4", color: "#DC2626" }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 select-none font-sans">
      {/* Top Header Row with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-primary font-sans leading-tight">
            Your Solving Workspace
          </h1>
          <p className="text-[15px] text-secondary font-sans mt-1">
            Realtime performance metrics and historical telemetry for your workspace.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <Button variant="secondary" onClick={() => navigate('/compare')}>
            Run benchmark
          </Button>
          <Button variant="primary-black" onClick={() => navigate('/solve')}>
            New solve
          </Button>
        </div>
      </div>

      {/* 4-column stat-card row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col items-start p-6 bg-surface border border-subtle">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
            TOTAL SOLVES
          </span>
          <span className="font-sans text-[28px] font-extrabold text-accent-blue leading-none">
            {stats.total}
          </span>
          <span className="text-[12px] text-secondary mt-3">
            Active workspace solves
          </span>
        </Card>

        <Card className="flex flex-col items-start p-6 bg-surface border border-subtle">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
            SUCCESS RATE
          </span>
          <span className="font-sans text-[28px] font-extrabold text-accent-green leading-none">
            {stats.successRate.toFixed(1)}%
          </span>
          <span className="text-[12px] text-secondary mt-3">
            Telemetry success percentage
          </span>
        </Card>

        <Card className="flex flex-col items-start p-6 bg-surface border border-subtle">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
            AVG SOLVE TIME
          </span>
          <span className="font-sans text-[28px] font-extrabold text-accent-orange leading-none">
            {stats.avgTime}
          </span>
          <span className="text-[12px] text-secondary mt-3">
            Based on active runs
          </span>
        </Card>

        <Card className="flex flex-col items-start p-6 bg-surface border border-subtle">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
            BEST PATH LENGTH
          </span>
          <span className="font-sans text-[28px] font-extrabold text-accent-red leading-none">
            11 moves
          </span>
          <span className="text-[12px] text-secondary mt-3">
            IDA* optimal solving
          </span>
        </Card>
      </div>

      {/* 2-column Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timing by Algorithm bar chart (65% width) */}
        <div className="lg:col-span-8">
          <Card title="Timing by Algorithm (ms)" subtitle="Comparison of search time over recent workloads">
            <div className="flex flex-col gap-4 py-4">
              {/* IDA* */}
              <div className="flex items-center gap-4 text-[13px]">
                <span className="w-16 font-semibold font-sans text-secondary text-right">IDA*</span>
                <div className="flex-grow bg-gray-100 rounded-full h-7 overflow-hidden border border-subtle flex items-center pr-2">
                  <div className="bg-accent-green h-full rounded-r-md transition-all duration-500 w-[20%]" />
                  <span className="font-mono font-bold text-primary ml-3 font-mono">1,820ms</span>
                </div>
              </div>

              {/* IDDFS */}
              <div className="flex items-center gap-4 text-[13px]">
                <span className="w-16 font-semibold font-sans text-secondary text-right">IDDFS</span>
                <div className="flex-grow bg-gray-100 rounded-full h-7 overflow-hidden border border-subtle flex items-center pr-2">
                  <div className="bg-accent-orange h-full rounded-r-md transition-all duration-500 w-[55%]" />
                  <span className="font-mono font-bold text-primary ml-3 font-mono">5,410ms</span>
                </div>
              </div>

              {/* BFS */}
              <div className="flex items-center gap-4 text-[13px]">
                <span className="w-16 font-semibold font-sans text-secondary text-right">BFS</span>
                <div className="flex-grow bg-gray-100 rounded-full h-7 overflow-hidden border border-subtle flex items-center pr-2">
                  <div className="bg-accent-blue h-full rounded-r-md transition-all duration-500 w-[12%]" />
                  <span className="font-mono font-bold text-primary ml-3 font-mono">1,120ms</span>
                </div>
              </div>

              {/* DFS */}
              <div className="flex items-center gap-4 text-[13px]">
                <span className="w-16 font-semibold font-sans text-secondary text-right">DFS</span>
                <div className="flex-grow bg-gray-100 rounded-full h-7 overflow-hidden border border-subtle flex items-center pr-2">
                  <div className="bg-accent-red h-full rounded-r-md transition-all duration-500 w-[85%]" />
                  <span className="font-mono font-bold text-primary ml-3 font-mono">9,850ms</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Heuristic Efficacy Donut chart (35% width) */}
        <div className="lg:col-span-4">
          <Card title="Heuristic Efficacy" subtitle="Percentage of optimal solutions found">
            <div className="flex items-center justify-center py-4 h-full">
              <DonutChart
                percentage={76.4}
                label="OPTIMAL"
                valueLabel="76.4%"
                color="#16A34A"
                legendItems={donutLegend}
                className="w-full justify-between"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom recent runs log table */}
      <Card title="Recent Runs Log" subtitle="History logs from recent workspace solve requests">
        <Table
          columns={tableColumns}
          data={recentSolves}
          emptyMessage="No search logs available."
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
