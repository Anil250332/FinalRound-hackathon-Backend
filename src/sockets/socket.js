let io = null;

export const initSocket = (socketIoInstance) => {
  io = socketIoInstance;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join hospital specific room
    socket.on('hospital:join', (hospitalId) => {
      if (hospitalId) {
        socket.join(`hospital_${hospitalId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined room: hospital_${hospitalId}`);
      }
    });

    // Leave hospital specific room
    socket.on('hospital:leave', (hospitalId) => {
      if (hospitalId) {
        socket.leave(`hospital_${hospitalId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => {
  return io;
};

// Emit event to all hospitals
export const broadcastEmergency = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Emit event to a specific hospital room
export const emitToHospital = (hospitalId, event, data) => {
  if (io && hospitalId) {
    io.to(`hospital_${hospitalId.toString()}`).emit(event, data);
  }
};
