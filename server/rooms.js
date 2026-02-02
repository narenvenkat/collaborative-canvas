function createRoomManager() {
  const clientRoom = new Map();   // socketId -> roomId
  const roomClients = new Map();  // roomId -> Set(socketIds)

  return {
    addClient(roomId, socketId) {
      clientRoom.set(socketId, roomId);
      if (!roomClients.has(roomId)) {
        roomClients.set(roomId, new Set());
      }
      roomClients.get(roomId).add(socketId);
    },

    removeClientFromAll(socketId) {
      const roomId = clientRoom.get(socketId);
      if (!roomId) return;
      const set = roomClients.get(roomId);
      if (set) {
        set.delete(socketId);
        if (set.size === 0) {
          roomClients.delete(roomId);
        }
      }
      clientRoom.delete(socketId);
    },

    getRoomForClient(socketId) {
      return clientRoom.get(socketId);
    }
  };
}

module.exports = { createRoomManager };
