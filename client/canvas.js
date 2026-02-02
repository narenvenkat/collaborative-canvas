import { emitDrawingSegments, emitStrokeEnd, emitCursorMove } from './websocket.js';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let lastPos = null;
let strokeStyle = {
  color: '#000000',
  width: 4
};

let pendingSegments = [];
let lastCursorSent = 0;

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

export function initCanvas() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  canvas.addEventListener('mousedown', handlePointerDown);
  canvas.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd);

  requestAnimationFrame(flushSegments);
}

export function setStrokeColor(color) {
  strokeStyle.color = color;
}

export function setStrokeWidth(width) {
  strokeStyle.width = width;
}

export function drawSegment(segment) {
  ctx.strokeStyle = segment.style.color;
  ctx.lineWidth = segment.style.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(segment.start.x, segment.start.y);
  ctx.lineTo(segment.end.x, segment.end.y);
  ctx.stroke();
}

export function applyFullRedraw(strokes) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) {
    for (const segment of stroke.segments) {
      drawSegment(segment);
    }
  }
}

export function getCanvasCoordinates(event, targetCanvas = canvas) {
  const rect = targetCanvas.getBoundingClientRect();
  const scaleX = targetCanvas.width / rect.width;
  const scaleY = targetCanvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

// Pointer logic

function handlePointerDown(e) {
  e.preventDefault();
  isDrawing = true;
  lastPos = getCanvasCoordinates(e);
}

function handlePointerMove(e) {
  if (!isDrawing) {
    maybeSendCursor(e);
    return;
  }
  const currentPos = getCanvasCoordinates(e);
  const segment = {
    start: lastPos,
    end: currentPos,
    style: { ...strokeStyle }
  };
  drawSegment(segment);
  queueSegment(segment);
  lastPos = currentPos;
  maybeSendCursor(e);
}

function handlePointerUp(e) {
  if (!isDrawing) return;
  isDrawing = false;
  lastPos = null;
  emitStrokeEnd();
}

// Touch wrappers

function touchToMouseEvent(touchEvent) {
  const t = touchEvent.touches[0] || touchEvent.changedTouches[0];
  return {
    clientX: t.clientX,
    clientY: t.clientY
  };
}

function handleTouchStart(e) {
  e.preventDefault();
  const fakeMouse = touchToMouseEvent(e);
  handlePointerDown(fakeMouse);
}

function handleTouchMove(e) {
  e.preventDefault();
  const fakeMouse = touchToMouseEvent(e);
  handlePointerMove(fakeMouse);
}

function handleTouchEnd(e) {
  e.preventDefault();
  handlePointerUp(e);
}

// Emission / queue

function queueSegment(segment) {
  pendingSegments.push(segment);
}

function flushSegments() {
  if (pendingSegments.length) {
    emitDrawingSegments(pendingSegments);
    pendingSegments = [];
  }
  requestAnimationFrame(flushSegments);
}

function maybeSendCursor(e) {
  const now = performance.now();
  if (now - lastCursorSent < 50) return;
  lastCursorSent = now;
  const pos = getCanvasCoordinates(e);
  emitCursorMove(pos);
}
