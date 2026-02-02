const layer = document.getElementById('cursor-layer');
const cursors = new Map();

export function updateGhostCursor(userId, pos) {
  let el = cursors.get(userId);
  if (!el) {
    el = document.createElement('div');
    el.className = 'ghost-cursor';
    layer.appendChild(el);
    cursors.set(userId, el);
  }
  el.style.left = `${pos.x}px`;
  el.style.top = `${pos.y}px`;
}

export function clearGhostCursor() {
  cursors.forEach(el => el.remove());
  cursors.clear();
}
