import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/socket.js';
import { Hospital } from './models/Hospital.js';
import { seedDatabase } from './seeders/seed.js';

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Auto-seed if database is empty
    const hospitalCount = await Hospital.countDocuments();
    if (hospitalCount === 0) {
      console.log('[PulseRelay] Empty database detected. Auto-seeding initial data...');
      await seedDatabase();
    }

    // 3. Create HTTP Server
    const server = http.createServer(app);

    // 4. Initialize Socket.IO
    const io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
    });
    initSocket(io);

    // 5. Start listening on 0.0.0.0 for Render compatibility
    const PORT = ENV.PORT || 10000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[PulseRelay Server] 🚀 Running on port ${PORT} (0.0.0.0)`);
      console.log(`[PulseRelay Server] Health check available at: http://localhost:${PORT}/health`);
      console.log(`[PulseRelay Server] API v1 available at: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('[PulseRelay Startup Error]:', error);
    process.exit(1);
  }
};

startServer();
