import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import { MOCK_SOLVES } from '../services/mockData';
import { api } from '../services/api';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [solvesList, setSolvesList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await api.getHistory(itemsPerPage, (currentPage - 1) * itemsPerPage);
        const formatted = data.jobs.map(job => {
          const res = job.solve_results?.[0] || null;
          return {
            id: job.id,
            input_scramble: job.cube_state,
            algorithm: job.algorithm,
            status: job.status,
            created_at: job.created_at,
            result: res ? {
              solution_length: res.solution.length,
              elapsed_ms: res.elapsed_ms
            } : null
          };
        });
        setSolvesList(formatted);
        setTotalItems(data.total);
      } catch (err) {
        console.warn('[HISTORY] Failed to load, using mock:', err);
        setSolvesList(MOCK_SOLVES);
        setTotalItems(MOCK_SOLVES.length);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentPage]);

  // Filter logic
  const filteredSolves = useMemo(() => {
    return solvesList.filter(solve => {
      const matchesSearch = solve.input_scramble.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            solve.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAlgo = selectedAlgo === 'ALL' || solve.algorithm === selectedAlgo;
      const matchesStatus = selectedStatus === 'ALL' || solve.status === selectedStatus;

      return matchesSearch && matchesAlgo && matchesStatus;
    });
  }, [solvesList, searchTerm, selectedAlgo, selectedStatus]);

  // Paginated data
  const paginatedData = useMemo(() => {
    return filteredSolves; // The dataset is already sliced by server-side pagination!
  }, [filteredSolves]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const columns = [
    { key: "id", label: "Solve ID", monospace: true },
    {
      key: "input_scramble",
      label: "Scramble Sequence",
      monospace: true,
      render: (row, val) => (
        <span className="block max-w-[280px] sm:max-w-md truncate font-mono" title={val}>
          {val}
        </span>
      )
    },
    { key: "algorithm", label: "Algorithm" },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row, val) => <StatusBadge status={val} />
    },
    {
      key: "solution_length",
      label: "Length",
      align: "center",
      monospace: true,
      render: (row) => row.result ? `${row.result.solution_length} moves` : 'N/A'
    },
    {
      key: "elapsed_ms",
      label: "Time",
      align: "right",
      monospace: true,
      render: (row) => row.result ? `${(row.result.elapsed_ms / 1000).toFixed(2)}s` : 'OOM/TO'
    },
    {
      key: "created_at",
      label: "Date",
      align: "right",
      render: (row, val) => new Date(val).toLocaleDateString()
    },
    {
      key: "actions",
      label: "Action",
      align: "center",
      render: (row) => (
        <div className="flex items-center gap-3 justify-center">
          <Button
            variant="link"
            onClick={() => navigate(`/solve/${row.id}`)}
            className="font-semibold text-[13px]"
          >
            View Details
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 select-none font-sans">
      {/* Page Title */}
      <div>
        <h1 className="text-[32px] font-bold text-primary font-sans leading-tight">
          Solve History Log
        </h1>
        <p className="text-[15px] text-secondary font-sans mt-1">
          Trace, filter, and audit past optimization solve runs executed inside your sandbox.
        </p>
      </div>

      {/* Filter Row card */}
      <Card className="bg-surface border border-subtle">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Input
            label="Search Scramble / ID"
            placeholder="Search e.g. D L2..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Filter Algorithm
            </label>
            <select
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-subtle rounded-btn py-[10px] px-[12px] text-[14px] text-primary focus-visible:outline-accent-blue"
            >
              <option value="ALL">All Algorithms</option>
              <option value="IDA_STAR">IDA*</option>
              <option value="IDDFS">IDDFS</option>
              <option value="BFS">BFS</option>
              <option value="DFS">DFS</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Filter Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-subtle rounded-btn py-[10px] px-[12px] text-[14px] text-primary focus-visible:outline-accent-blue"
            >
              <option value="ALL">All Statuses</option>
              <option value="SOLVED">SOLVED</option>
              <option value="TIMEOUT">TIMED OUT</option>
              <option value="MEMORY_LIMIT">OOM LIMIT</option>
            </select>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setSelectedAlgo('ALL');
              setSelectedStatus('ALL');
              setCurrentPage(1);
            }}
            className="h-11 font-semibold"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* History table */}
      <Table
        columns={columns}
        data={paginatedData}
        pagination={{
          currentPage: currentPage,
          totalItems: totalItems,
          itemsPerPage: itemsPerPage,
          onPageChange: handlePageChange
        }}
        emptyMessage="No matching solves found in history."
      />
    </div>
  );
};

export default HistoryPage;
