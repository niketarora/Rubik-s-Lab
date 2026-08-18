const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { SOLVED_STATE, applyScramble, generateRandomScramble, validateScrambleNotation } = require('../utils/cube');
const { solveCube, cancelSolve } = require('../services/cppSolverService');
const { solveQueue } = require('../services/redisQueueService');
const supabase = require('../config/supabase');
const zod = require('zod');

// Schema validations
const parseSchema = zod.object({
  scramble: zod.string().min(0)
});

const validateSchema = zod.object({
  state: zod.string().length(54)
});

const scrambleSchema = zod.object({
  length: zod.number().min(1).max(100).optional()
});

const solveJobSchema = zod.object({
  cubeState: zod.string().length(54),
  algorithm: zod.enum(['BFS', 'DFS', 'IDDFS', 'IDA_STAR', 'TWO_PHASE']),
  heuristic: zod.enum(['NONE', 'MISPLACED_PIECES', 'CORNER_EDGE_LOWER_BOUND', 'PATTERN_DATABASE']).optional(),
  maxDepth: zod.number().min(0).max(50).optional(),
  timeoutMs: zod.number().min(1000).max(60000).optional(),
  collectTrace: zod.boolean().optional()
});

// 1. Parse scramble notation -> 54-character state string
router.post('/parse', optionalAuth, async (req, res, next) => {
  try {
    const { scramble } = parseSchema.parse(req.body);
    const notationCheck = validateScrambleNotation(scramble);
    if (!notationCheck.valid) {
      return res.status(400).json({ status: 'error', errorCode: 'INVALID_NOTATION', message: notationCheck.error });
    }

    const stateArr = applyScramble(scramble);
    const stateStr = stateArr.join('');
    res.status(200).json({ scramble, state: stateStr });
  } catch (err) {
    next(err);
  }
});

// 2. Validate sticker configuration (Uses C++ validation logic via a 0-depth BFS check)
router.post('/validate', optionalAuth, async (req, res, next) => {
  try {
    const { state } = validateSchema.parse(req.body);
    
    // Quick validation job on the solver executable (BFS with maxDepth=0 exits instantly)
    const valRes = await solveCube('val_' + Date.now(), state, { algorithm: 'BFS', maxDepth: 0, timeoutMs: 1000 });
    
    if (valRes.status === 'INVALID_STATE') {
      return res.status(400).json({
        valid: false,
        errorCode: valRes.errorCode || 'INVALID_STATE',
        message: valRes.message || 'The cube state is invalid or unsolvable.'
      });
    }
    
    res.status(200).json({ valid: true });
  } catch (err) {
    next(err);
  }
});

// 3. Generate random scramble sequence and target state
router.post('/scramble', optionalAuth, async (req, res, next) => {
  try {
    const { length = 20 } = scrambleSchema.parse(req.body);
    const scramble = generateRandomScramble(length);
    const stateStr = applyScramble(scramble).join('');
    res.status(200).json({ scramble, state: stateStr });
  } catch (err) {
    next(err);
  }
});

// 4. Submit single solve job (Supports direct solver execution and queued jobs)
router.post('/solve', optionalAuth, async (req, res, next) => {
  try {
    const body = solveJobSchema.parse(req.body);
    const userId = req.user ? req.user.id : null;
    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // If Redis is configured and user is logged in, queue the job in background
    if (userId && process.env.REDIS_URL) {
      try {
        const { data: job, error: dbError } = await supabase
          .from('solve_jobs')
          .insert({
            user_id: userId,
            cube_state: body.cubeState,
            algorithm: body.algorithm,
            heuristic: body.heuristic || 'NONE',
            max_depth: body.maxDepth || 30,
            timeout_ms: body.timeoutMs || 30000,
            status: 'QUEUED'
          })
          .select()
          .single();

        if (!dbError && job) {
          await solveQueue.add({
            jobId: job.id,
            cubeState: body.cubeState,
            options: {
              algorithm: body.algorithm,
              heuristic: body.heuristic,
              maxDepth: body.maxDepth,
              timeoutMs: body.timeoutMs,
              collectTrace: body.collectTrace !== false
            }
          });

          return res.status(202).json({
            jobId: job.id,
            status: 'QUEUED',
            createdAt: job.created_at
          });
        }
      } catch (err) {
        console.warn('[SOLVE] Queue failed, running direct solve:', err.message);
      }
    }

    // Direct synchronous execution on the high-performance C++ solver
    const result = await solveCube(jobId, body.cubeState, {
      algorithm: body.algorithm,
      heuristic: body.heuristic,
      maxDepth: body.maxDepth,
      timeoutMs: body.timeoutMs,
      collectTrace: body.collectTrace !== false
    });

    if (userId) {
      supabase.from('solve_jobs').insert({
        id: jobId,
        user_id: userId,
        cube_state: body.cubeState,
        algorithm: body.algorithm,
        heuristic: body.heuristic || 'NONE',
        max_depth: body.maxDepth || 30,
        timeout_ms: body.timeoutMs || 30000,
        status: result.status,
        completed_at: new Date().toISOString()
      }).then(() => {
        supabase.from('solve_results').insert({
          job_id: jobId,
          status: result.status,
          solution: result.solution,
          nodes_generated: result.metrics?.nodesGenerated || 0,
          nodes_expanded: result.metrics?.nodesExpanded || 0,
          nodes_pruned: result.metrics?.nodesPruned || 0,
          duplicate_states: result.metrics?.duplicateStates || 0,
          max_depth_reached: result.metrics?.maxDepthReached || 0,
          threshold_iterations: result.metrics?.thresholdIterations || 0,
          elapsed_ms: result.metrics?.elapsedMs || 0,
          peak_memory_bytes: result.metrics?.peakMemoryBytes || 0,
          trace_logs: result.trace || []
        }).catch(err => console.warn('[SUPABASE] Background result save failed:', err.message));
      }).catch(err => console.warn('[SUPABASE] Background job save failed:', err.message));
    }

    res.status(200).json({
      jobId: jobId,
      status: result.status,
      solution: result.solution,
      metrics: result.metrics,
      trace: result.trace
    });

  } catch (err) {
    next(err);
  }
});

// 5. Cancel ongoing solve job (Requires Auth)
router.post('/solve/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const jobId = req.params.id;

    // Fetch job to verify ownership
    const { data: job, error: fetchError } = await supabase
      .from('solve_jobs')
      .select('user_id, status')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return res.status(404).json({ status: 'error', errorCode: 'NOT_FOUND', message: 'Job not found.' });
    }

    if (job.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', errorCode: 'FORBIDDEN', message: 'Unauthorized to cancel this job.' });
    }

    // Cancel in C++ solver service
    cancelSolve(jobId);

    // Update DB status to CANCELLED
    await supabase
      .from('solve_jobs')
      .update({ status: 'CANCELLED', completed_at: new Date().toISOString() })
      .eq('id', jobId);

    res.status(200).json({ status: 'CANCELLED', jobId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
