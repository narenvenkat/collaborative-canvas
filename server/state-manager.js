const { randomUUID } = require('crypto');

function createStateManager() {
  const rooms = new Map(); // roomId -> { strokes: [] }

  function ensureRoom(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { strokes: [] });
    }
    return rooms.get(roomId);
  }

  return {
    appendSegments(roomId, userId, segments) {
      const room = ensureRoom(roomId);
      let stroke = room.strokes[room.strokes.length - 1];

      if (!stroke || stroke.userId !== userId || stroke.completed) {
        stroke = {
          id: randomUUID(),
          userId,
          segments: [],
          completed: false
        };
        room.strokes.push(stroke);
      }

      stroke.segments.push(...segments);
    },

    completeStroke(roomId, userId) {
      const room = rooms.get(roomId);
      if (!room) return;
      const stroke = room.strokes[room.strokes.length - 1];
      if (stroke && stroke.userId === userId) {
        stroke.completed = true;
      }
    },

    getStrokes(roomId) {
      const room = rooms.get(roomId);
      return room ? room.strokes : [];
    },

    undoLastStroke(roomId, userId) {
      const room = rooms.get(roomId);
      if (!room) return [];
      for (let i = room.strokes.length - 1; i >= 0; i--) {
        if (room.strokes[i].userId === userId) {
          room.strokes.splice(i, 1);
          break;
        }
      }
      return room.strokes;
    }
  };
}

module.exports = { createStateManager };
