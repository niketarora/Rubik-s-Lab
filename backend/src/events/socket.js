const { Server } = require('socket.io');
let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    socket.on('join:job', (jobId) => {
      console.log(`[WS] Client ${socket.id} joined room job_${jobId}`);
      socket.join(`job_${jobId}`);
    });

    socket.on('leave:job', (jobId) => {
      console.log(`[WS] Client ${socket.id} left room job_${jobId}`);
      socket.leave(`job_${jobId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  return io;
};

const emitJobProgress = (jobId, progressData) => {
  if (io) {
    io.to(`job_${jobId}`).emit('solve:progress', progressData);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitJobProgress
};
