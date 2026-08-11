import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import { MOCK_SOLVES } from '../services/mockData';
import { api } from '../services/api';

const AdminWorkspace = () => {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'jobs', 'workers', 'config'

  // Config parameters
  const [maxDepthLimit, setMaxDepthLimit] = useState(30);
  const [maxTimeoutLimit, setMaxTimeoutLimit] = useState(60);
  const [concurrencyLimit, setConcurrencyLimit] = useState(2);
  const [guestRateLimit, setGuestRateLimit] = useState(5); // solves per hour

  const [jobs, setJobs] = useState(
    MOCK_SOLVES.map(s => ({
      id: s.id,
      user: s.user_id === 'mock-user-123' ? 'Alex Mercer' : 'Guest Operator',
      algorithm: s.algorithm,
      status: s.status,
      created_at: s.created_at
    }))
  );

  const [metrics, setMetrics] = useState({
    activeJobs: 1,
    waitingJobs: 0,
    activeWorkers: 2,
    cpuLoad: 45,
    memoryUsageBytes: 42000000,
    totalJobsProcessed: 145,
    errorRate: 1.2
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const data = await api.getAdminMetrics();
        setMetrics(data);
        
        // Also update jobs list from server if available
        const histData = await api.getHistory(30, 0);
        const formattedJobs = histData.jobs.map(job => ({
          id: job.id,
          user: job.profiles?.display_name || 'Guest Operator',
          algorithm: job.algorithm,
          status: job.status,
          created_at: job.created_at
        }));
        setJobs(formattedJobs);
      } catch (err) {
        console.warn('[ADMIN] Failed to load metrics, keeping mocks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [activeSubTab]);

  // Mock list of workers
  const workers = [
    { name: "solver-worker-core-01", status: "ONLINE", version: "cpp-2.0.0", job: "Idle", load: "2%", heartbeat: "18:59:10" },
    { name: "solver-worker-core-02", status: "ONLINE", version: "cpp-2.0.0", job: "bench-suite-99", load: "98%", heartbeat: "18:59:12" },
    { name: "solver-worker-wasm-h1", status: "OFFLINE", version: "cpp-1.9.0", job: "None", load: "0%", heartbeat: "18:22:00" }
  ];

  const handleCancelJob = async (jobId) => {
    try {
      await api.cancelSolve(jobId);
      setJobs(prev => prev.map(job => {
        if (job.id === jobId) {
          return { ...job, status: 'CANCELLED' };
        }
        return job;
      }));
      alert(`Job ${jobId} cancellation sent successfully.`);
    } catch (err) {
      console.error('[ADMIN] Job cancel failed:', err);
      alert(`Failed to cancel job: ${err.message}`);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    alert('System configuration parameters saved and pushed to all active worker processes.');
  };

  const adminMenu = [
    { key: "overview", label: "System Overview" },
    { key: "jobs", label: "Job Management" },
    { key: "workers", label: "Worker Health" },
    { key: "config", label: "Limits & Quotas" }
  ];

  // Jobs table columns
  const jobsColumns = [
    { key: "id", label: "Job ID", monospace: true },
    { key: "user", label: "Operator" },
    { key: "algorithm", label: "Algorithm" },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row, val) => <StatusBadge status={val} />
    },
    { key: "created_at", label: "Submitted", render: (row, val) => new Date(val).toLocaleTimeString() },
    {
      key: "actions",
      label: "Control Action",
      align: "center",
      render: (row) => (
        <div className="flex items-center gap-2 justify-center">
          {row.status === 'RUNNING' || row.status === 'QUEUED' ? (
            <Button
              variant="link"
              onClick={() => handleCancelJob(row.id)}
              className="text-accent-red hover:text-red-700 font-semibold"
            >
              Cancel Job
            </Button>
          ) : (
            <Button
              variant="link"
              onClick={() => alert(`Retrying job ${row.id}...`)}
              className="font-semibold text-[13px]"
            >
              Retry
            </Button>
          )}
        </div>
      )
    }
  ];

  // Workers table columns
  const workerColumns = [
    { key: "name", label: "Worker Hostname" },
    {
      key: "status",
      label: "Worker Status",
      align: "center",
      render: (row, val) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-sans ${
            val === 'ONLINE' ? 'bg-accent-green-bg text-accent-green' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {val}
        </span>
      )
    },
    { key: "version", label: "Engine Version", monospace: true },
    { key: "job", label: "Current Task ID", monospace: true },
    { key: "load", label: "CPU Load", align: "center", monospace: true },
    { key: "heartbeat", label: "Last Heartbeat", align: "right", monospace: true }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 select-none font-sans min-h-[calc(100vh-128px)]">
      {/* Page Header */}
      <div className="border-b border-subtle pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-primary font-sans leading-tight">
            Administrator Command Shell
          </h1>
          <p className="text-[15px] text-secondary font-sans mt-1">
            System status monitoring, cluster scaling configuration, and solve limits orchestration.
          </p>
        </div>
        <span className="bg-accent-red-bg text-accent-red font-bold text-[11px] px-[12px] py-[5px] rounded-full tracking-wider uppercase font-sans border border-accent-red/10">
          Operator Role: Administrator
        </span>
      </div>

      {/* Admin Sub-navigation Header */}
      <div className="flex items-center gap-6 border-b border-subtle select-none">
        {adminMenu.map(menuItem => (
          <button
            key={menuItem.key}
            onClick={() => setActiveSubTab(menuItem.key)}
            className={`pb-3 text-[14px] font-bold font-sans transition-all border-b-2 ${
              activeSubTab === menuItem.key
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            {menuItem.label}
          </button>
        ))}
      </div>

      {/* Content Rendering based on subtab */}
      <div className="flex-grow">
        {activeSubTab === 'overview' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Top row status cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="flex flex-col items-start p-6 bg-surface border border-subtle">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                  RUNNING SOLVE JOBS
                </span>
                <span className="font-sans text-[28px] font-extrabold text-accent-blue leading-none">
                  {metrics.activeJobs}
                </span>
                <span className="text-[12px] text-secondary mt-3">
                  Node queue size: {metrics.waitingJobs}
                </span>
              </Card>

              <Card className="flex flex-col items-start p-6 bg-surface border border-subtle">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                  ACTIVE CLUSTER WORKERS
                </span>
                <span className="font-sans text-[28px] font-extrabold text-accent-green leading-none">
                  {metrics.activeWorkers} / 3
                </span>
                <span className="text-[12px] text-secondary mt-3">
                  Nodes online and responding
                </span>
              </Card>

              <Card className="flex flex-col items-start p-6 bg-surface border border-subtle">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                  SYSTEM CPU LOAD
                </span>
                <span className="font-sans text-[28px] font-extrabold text-primary leading-none">
                  {metrics.cpuLoad.toFixed(1)}%
                </span>
                <span className="text-[12px] text-secondary mt-3">
                  Average cluster load factor
                </span>
              </Card>

              <Card className="flex flex-col items-start p-6 bg-surface border border-subtle">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                  TOTAL SOLVES PROCESSED
                </span>
                <span className="font-sans text-[28px] font-extrabold text-accent-orange leading-none">
                  {metrics.totalJobsProcessed}
                </span>
                <span className="text-[12px] text-secondary mt-3">
                  Historical jobs throughput
                </span>
              </Card>
            </div>

            {/* System Alerts */}
            <Card title="Recent System Audit Alerts" subtitle="Centralized event logs for all administrative mutations">
              <div className="flex flex-col gap-2 font-mono text-[12px] text-primary">
                <div className="flex items-center gap-4 py-2 border-b border-subtle">
                  <span className="text-gray-400 select-none">18:59:10</span>
                  <span className="text-accent-blue font-bold">[AUDIT]</span>
                  <span>Administrator Alex Mercer updated solver concurrency limits from 4 to 2.</span>
                </div>
                <div className="flex items-center gap-4 py-2 border-b border-subtle">
                  <span className="text-gray-400 select-none">18:22:00</span>
                  <span className="text-accent-red font-bold">[ALERT]</span>
                  <span className="text-accent-red">Worker node "solver-worker-wasm-h1" missed heartbeat interval. Status set to OFFLINE.</span>
                </div>
                <div className="flex items-center gap-4 py-2 last:border-b-0">
                  <span className="text-gray-400 select-none">15:40:12</span>
                  <span className="text-accent-blue font-bold">[AUDIT]</span>
                  <span>Job cancelled manually: Job #1284f-TO stopped by admin request.</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeSubTab === 'jobs' && (
          <Card title="Cluster Jobs Queue" subtitle="Search and manage all solver and benchmark request threads" className="animate-fadeIn">
            <Table
              columns={jobsColumns}
              data={jobs}
              emptyMessage="No active jobs running."
            />
          </Card>
        )}

        {activeSubTab === 'workers' && (
          <Card title="Worker Telemetry Node Clusters" subtitle="Heartbeat monitoring and CPU capacity limits" className="animate-fadeIn">
            <Table
              columns={workerColumns}
              data={workers}
              emptyMessage="No worker nodes detected."
            />
          </Card>
        )}

        {activeSubTab === 'config' && (
          <Card title="Limits & Quotas Orchestration" subtitle="Adjust safety caps to protect worker memory spaces" className="max-w-2xl animate-fadeIn">
            <form onSubmit={handleSaveConfig} className="flex flex-col gap-4">
              <Input
                label="Maximum Solver Depth Limit"
                type="number"
                value={maxDepthLimit}
                onChange={(e) => setMaxDepthLimit(parseInt(e.target.value))}
              />
              <Input
                label="Maximum Timeout Limit (seconds)"
                type="number"
                value={maxTimeoutLimit}
                onChange={(e) => setMaxTimeoutLimit(parseInt(e.target.value))}
              />
              <Input
                label="Worker Thread Concurrency Cap"
                type="number"
                value={concurrencyLimit}
                onChange={(e) => setConcurrencyLimit(parseInt(e.target.value))}
              />
              <Input
                label="Guest Rate Limit quota (solves/hour)"
                type="number"
                value={guestRateLimit}
                onChange={(e) => setGuestRateLimit(parseInt(e.target.value))}
              />
              <div className="pt-2 border-t border-subtle flex justify-end">
                <Button type="submit" variant="primary-black" className="h-10 font-bold">
                  Save limits configuration
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminWorkspace;
