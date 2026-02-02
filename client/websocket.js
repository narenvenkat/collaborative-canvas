import { drawSegment, applyFullRedraw } from './canvas.js';
import { updateGhostCursor, clearGhostCursor } from './ghost-cursors.js';

let socket = null;

export function initSocket(roomId) {
  socket = window.io();

  socket.on('connect', () => {
    socket.emit('join_room', roomId || 'default');
  });

  socket.on('initial_state', strokes => {
    applyFullRedraw(strokes);
  });

  socket.on('drawing_step', segments => {
    if (!Array.isArray(segments)) segments = [segments];
    for (const segment of segments) {
      drawSegment(segment);
    }
  });

  socket.on('cursor_move', ({ userId, pos }) => {
    updateGhostCursor(userId, pos);
  });

  socket.on('undo_applied', strokes => {
    applyFullRedraw(strokes);
  });

  socket.on('disconnect', () => {
    // clean up cursors if needed
  });
}

export function emitDrawingSegments(segments) {
  if (!socket || socket.disconnected) return;
  socket.emit('drawing_steps', segments);
}

export function emitStrokeEnd() {
  if (!socket || socket.disconnected) return;
  socket.emit('stroke_end');
}

export function emitCursorMove(pos) {
  if (!socket || socket.disconnected) return;
  socket.emit('cursor_move', pos);
}

export function emitUndoRequest() {
  if (!socket || socket.disconnected) return;
  socket.emit('undo_request');
}

export function onBeforeUnload() {
  if (socket) {
    socket.disconnect();
  }
  clearGhostCursor();
}
