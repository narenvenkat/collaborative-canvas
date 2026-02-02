import { initCanvas, setStrokeColor, setStrokeWidth } from './canvas.js';
import { initSocket, emitUndoRequest, onBeforeUnload } from './websocket.js';

const colorPicker = document.getElementById('color-picker');
const widthPicker = document.getElementById('width-picker');
const undoBtn = document.getElementById('undo-btn');
const roomInput = document.getElementById('room-input');
const joinBtn = document.getElementById('join-btn');

let currentRoom = 'default';

initCanvas();
initSocket(currentRoom);

colorPicker.addEventListener('input', e => {
  setStrokeColor(e.target.value);
});

widthPicker.addEventListener('input', e => {
  setStrokeWidth(Number(e.target.value));
});

undoBtn.addEventListener('click', () => {
  emitUndoRequest();
});

joinBtn.addEventListener('click', () => {
  const roomId = roomInput.value.trim() || 'default';
  if (roomId === currentRoom) return;
  // Simple strategy: reload page with hash to rejoin new room.
  window.location.hash = `#${encodeURIComponent(roomId)}`;
  window.location.reload();
});

window.addEventListener('beforeunload', () => {
  onBeforeUnload();
});

// Read room from URL hash (e.g., #team-room)
const hash = window.location.hash.replace('#', '');
if (hash) {
  currentRoom = decodeURIComponent(hash);
}
