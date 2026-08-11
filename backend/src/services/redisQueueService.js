const Queue = require('bull');
const { solveCube, cancelSolve } = require('./cppSolverService');
const supabase = require('../config/supabase');
const { emitJobProgress } = require('../events/socket');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Initialize Bull queues
const solveQueue = new Queue('solve_jobs', redisUrl);
const benchmarkQueue = new Queue('benchmark_jobs', redisUrl);

// Process single solve jobs
solveQueue.process(async (job) => {
  const { jobId, cubeState, options } = job.data;
  console.log(`[QUEUE] Processing solve job ${jobId}`);

  // Mark job running in Database
  await supabase
    .from('solve_jobs')
    .update({ status: 'RUNNING', started_at: new Date().toISOString() })
    .eq('id', jobId);

  try {
    // Run solver
    const result = await solveCube(jobId, cubeState, options);

    // Save final metrics to solve_results table
    const { error: resError } = await supabase
      .from('solve_results')
      .insert({
        job_id: jobId,
        status: result.status,
        solution: result.solution,
        nodes_generated: result.metrics.nodesGenerated,
        nodes_expanded: result.metrics.nodesExpanded,
        nodes_pruned: result.metrics.nodesPruned,
        duplicate_states: result.metrics.duplicateStates,
        max_depth_reached: result.metrics.maxDepthReached,
        threshold_iterations: result.metrics.thresholdIterations,
        elapsed_ms: result.metrics.elapsedMs,
        peak_memory_bytes: result.metrics.peakMemoryBytes,
        trace_logs: result.trace
      });

    if (resError) throw resError;

    // Update main job entry
    await supabase
      .from('solve_jobs')
      .update({ status: result.status, completed_at: new Date().toISOString() })
      .eq('id', jobId);

    // Notify clients on WebSocket channel
    emitJobProgress(jobId, {
      status: result.status,
      solution: result.solution,
      metrics: result.metrics,
      trace: result.trace
    });

    return result;

  } catch (err) {
    console.error(`[QUEUE] Solve job ${jobId} failed:`, err);
    
    await supabase
      .from('solve_jobs')
      .update({ status: 'FAILED', completed_at: new Date().toISOString() })
      .eq('id', jobId);

    await supabase
      .from('solve_results')
      .insert({
        job_id: jobId,
        status: 'FAILED',
        trace_logs: [{ timestamp: new Date().toISOString(), type: 'error', message: err.message }]
      });

    emitJobProgress(jobId, { status: 'FAILED', message: err.message });
    throw err;
  }
});

// Process benchmark runs (running test cases sequentially/parallelly)
benchmarkQueue.process(async (job) => {
  const { benchmarkId, cubeState, testCases } = job.data;
  console.log(`[QUEUE] Processing benchmark run ${benchmarkId}`);

  await supabase
    .from('benchmarks')
    .update({ status: 'RUNNING', started_at: new Date().toISOString() })
    .eq('id', benchmarkId);

  try {
    const results = [];
    let completedCount = 0;

    for (const tc of testCases) {
      const jobUid = `${benchmarkId}_tc_${tc.id}`;
      
      // Update overall progress percentage
      emitJobProgress(benchmarkId, {
        progress: Math.round((completedCount / testCases.length) * 100),
        status: 'RUNNING'
      });

      // Run solver task
      const res = await solveCube(jobUid, cubeState, tc.options);
      results.push({
        testCaseId: tc.id,
        algorithm: tc.options.algorithm,
        heuristic: tc.options.heuristic,
        status: res.status,
        solution: res.solution,
        metrics: res.metrics
      });

      completedCount++;
    }

    // Save aggregated results
    await supabase
      .from('benchmarks')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        results: results
      })
      .eq('id', benchmarkId);

    // Emit completed event
    emitJobProgress(benchmarkId, {
      progress: 100,
      status: 'COMPLETED',
      results: results
    });

    return results;

  } catch (err) {
    console.error(`[QUEUE] Benchmark ${benchmarkId} failed:`, err);
    
    await supabase
      .from('benchmarks')
      .update({ status: 'FAILED', completed_at: new Date().toISOString() })
      .eq('id', benchmarkId);

    emitJobProgress(benchmarkId, { status: 'FAILED', message: err.message });
    throw err;
  }
});

module.exports = {
  solveQueue,
  benchmarkQueue
};
