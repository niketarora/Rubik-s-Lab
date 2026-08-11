const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const supabase = require('../config/supabase');
const { solveQueue, benchmarkQueue } = require('../services/redisQueueService');

// 1. Fetch system metrics (solves count, queue depths, system info)
router.get('/metrics', requireAdmin, async (req, res, next) => {
  try {
    // DB aggregates
    const { count: totalSolves } = await supabase
      .from('solve_jobs')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Redis queues info
    let solveJobCounts = { waiting: 0, active: 0, completed: 0, failed: 0 };
    let benchmarkJobCounts = { waiting: 0, active: 0, completed: 0 };

    try {
      solveJobCounts = await solveQueue.getJobCounts();
      benchmarkJobCounts = await benchmarkQueue.getJobCounts();
    } catch (redisErr) {
      console.warn('[REDIS] Warning: Could not fetch active queue counts.', redisErr.message);
    }

    res.status(200).json({
      solves: {
        total: totalSolves || 0,
        queued: solveJobCounts.waiting,
        running: solveJobCounts.active,
        completed: solveJobCounts.completed,
        failed: solveJobCounts.failed
      },
      benchmarks: {
        queued: benchmarkJobCounts.waiting,
        running: benchmarkJobCounts.active,
        completed: benchmarkJobCounts.completed
      },
      users: {
        total: activeUsers || 0
      },
      system: {
        uptimeSeconds: Math.round(process.uptime()),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. Fetch administrator audit logs
router.get('/audit-logs', requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;
    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
