const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createRoomManager } = require('./rooms');
const { createStateManager } = require('./state-manager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const rooms = createRoomManager();
const state = createStateManager();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'client')));

io.on('connection', socket => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', roomId => {
    if (!roomId) roomId = 'default';
    socket.join(roomId);
    rooms.addClient(roomId, socket.id);

    const strokes = state.getStrokes(roomId);
    socket.emit('initial_state', strokes);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('drawing_steps', segments => {
    const roomId = rooms.getRoomForClient(socket.id);
    if (!roomId || !Array.isArray(segments) || !segments.length) return;

    state.appendSegments(roomId, socket.id, segments);
    socket.to(roomId).emit('drawing_step', segments);
  });

  socket.on('stroke_end', () => {
    const roomId = rooms.getRoomForClient(socket.id);
    if (!roomId) return;
    state.completeStroke(roomId, socket.id);
  });

  socket.on('cursor_move', pos => {
    const roomId = rooms.getRoomForClient(socket.id);
    if (!roomId || !pos) return;
    socket.to(roomId).emit('cursor_move', { userId: socket.id, pos });
  });

  socket.on('undo_request', () => {
    const roomId = rooms.getRoomForClient(socket.id);
    if (!roomId) return;
    const strokes = state.undoLastStroke(roomId, socket.id);
    io.to(roomId).emit('undo_applied', strokes);
  });

  socket.on('disconnect', () => {
    rooms.removeClientFromAll(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
