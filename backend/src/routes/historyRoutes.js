const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const supabase = require('../config/supabase');

// 1. Fetch user solve history list (paginated)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const { data: jobs, error, count } = await supabase
      .from('solve_jobs')
      .select('*, solve_results(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.status(200).json({
      jobs,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    next(err);
  }
});

// 2. Fetch specific job run details
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const { data: job, error } = await supabase
      .from('solve_jobs')
      .select('*, solve_results(*)')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return res.status(404).json({ status: 'error', errorCode: 'NOT_FOUND', message: 'Job not found.' });
    }

    // Verify ownership
    if (job.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', errorCode: 'FORBIDDEN', message: 'Unauthorized to view this job details.' });
    }

    res.status(200).json(job);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
