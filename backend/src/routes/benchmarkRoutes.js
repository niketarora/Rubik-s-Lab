const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { benchmarkQueue } = require('../services/redisQueueService');
const supabase = require('../config/supabase');
const zod = require('zod');

const benchmarkSchema = zod.object({
  cubeState: zod.string().length(54),
  testCases: zod.array(zod.object({
    id: zod.string(),
    options: zod.object({
      algorithm: zod.enum(['BFS', 'DFS', 'IDDFS', 'IDA_STAR']),
      heuristic: zod.enum(['NONE', 'MISPLACED_PIECES', 'CORNER_EDGE_LOWER_BOUND', 'PATTERN_DATABASE']).optional(),
      maxDepth: zod.number().min(0).max(50).optional(),
      timeoutMs: zod.number().min(1000).max(60000).optional()
    })
  })).min(1)
});

// 1. Submit a benchmark run comparison (Requires Auth)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = benchmarkSchema.parse(req.body);
    const userId = req.user.id;

    // Create DB entry
    const { data: benchmark, error: dbError } = await supabase
      .from('benchmarks')
      .insert({
        user_id: userId,
        cube_state: body.cubeState,
        test_cases: body.testCases,
        status: 'QUEUED'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Add to Redis benchmark queue
    await benchmarkQueue.add({
      benchmarkId: benchmark.id,
      cubeState: body.cubeState,
      testCases: body.testCases
    });

    res.status(202).json({
      benchmarkId: benchmark.id,
      status: 'QUEUED',
      createdAt: benchmark.created_at
    });

  } catch (err) {
    next(err);
  }
});

// 2. Fetch specific benchmark run status and results
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const benchmarkId = req.params.id;

    const { data: benchmark, error: fetchError } = await supabase
      .from('benchmarks')
      .select('*')
      .eq('id', benchmarkId)
      .single();

    if (fetchError || !benchmark) {
      return res.status(404).json({ status: 'error', errorCode: 'NOT_FOUND', message: 'Benchmark not found.' });
    }

    if (benchmark.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', errorCode: 'FORBIDDEN', message: 'Unauthorized to view this benchmark.' });
    }

    res.status(200).json(benchmark);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
