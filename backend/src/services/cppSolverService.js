const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const { emitJobProgress } = require('../events/socket');

const SOLVER_BIN = process.env.SOLVER_PATH || path.join(__dirname, '../../../solver-engine/rubiks_solver.exe');

const activeProcesses = new Map();

const solveCube = (jobId, cubeState, options = {}) => {
  return new Promise((resolve, reject) => {
    const args = []; // Runs in daemon mode, communicates over stdin/stdout
    
    console.log(`[SOLVER] Spawning C++ solver process for job ${jobId}`);
    const child = spawn(SOLVER_BIN, args);
    activeProcesses.set(jobId, child);

    const rl = readline.createInterface({
      input: child.stdout,
      terminal: false
    });

    let resolved = false;

    rl.on('line', (line) => {
      try {
        const data = JSON.parse(line);
        
        // Handle running progress or final state
        if (data.status === 'RUNNING') {
          emitJobProgress(jobId, data.progress);
        } else {
          resolved = true;
          activeProcesses.delete(jobId);
          child.kill();
          resolve(data);
        }
      } catch (err) {
        console.error(`[SOLVER] Failed to parse stdout line: ${line}`, err);
      }
    });

    child.stderr.on('data', (data) => {
      console.error(`[SOLVER stderr] ${data.toString()}`);
    });

    child.on('close', (code) => {
      activeProcesses.delete(jobId);
      if (!resolved) {
        reject(new Error(`Solver process exited unexpectedly with code ${code}`));
      }
    });

    child.on('error', (err) => {
      activeProcesses.delete(jobId);
      reject(err);
    });

    // Write input JSON line to C++ solver
    const requestPayload = {
      requestId: jobId,
      cubeState: cubeState,
      algorithm: options.algorithm || 'IDA_STAR',
      heuristic: options.heuristic || 'CORNER_EDGE_LOWER_BOUND',
      maxDepth: options.maxDepth || 30,
      timeoutMs: options.timeoutMs || 30000,
      collectTrace: options.collectTrace !== false
    };

    child.stdin.write(JSON.stringify(requestPayload) + '\n');
  });
};

const cancelSolve = (jobId) => {
  const child = activeProcesses.get(jobId);
  if (child) {
    console.log(`[SOLVER] Canceling job ${jobId}, killing process`);
    child.kill();
    activeProcesses.delete(jobId);
    return true;
  }
  return false;
};

module.exports = {
  solveCube,
  cancelSolve
};
