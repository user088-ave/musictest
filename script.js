const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const COLS = 4;
const COL_WIDTH = 90;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const JUDGE_LINE_Y = 500;

const keysMap = { 'D': 0, 'F': 1, 'J': 2, 'K': 3 };
const keyNames = ['D', 'F', 'J', 'K'];

let score = 0;
let combo = 0;
let isPlaying = false;
let notes = [];
let audioCtx = null;
let bgmSource = null;
let audioBuffer = null;
let gainNode = null;
let startTime = 0;

// DOM 元素
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const judgmentEl = document.getElementById('judgment');
const startBtn = document.getElementById('start-btn');
const audioUpload = document.getElementById('audio-upload');

// 初始化 Web Audio API 與音量節點
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// 檔案上傳監聽
audioUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  initAudio();
  const arrayBuffer = await file.arrayBuffer();
  audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  alert('音樂載入成功！點擊「開始遊戲」即可遊玩。');
});

startBtn.addEventListener('click', () => {
  startGame();
});

function startGame() {
  initAudio();

  // 若未上傳音樂，產生預設測試音訊
  if (!audioBuffer) {
    createDefaultAudioBuffer();
  }

  // 重置遊戲狀態
  score = 0;
  combo = 0;
  notes = [];
  updateHUD();

  // 根據音樂長度密集生成音符（每 0.35 秒一個，確保落鍵豐富）
  generateBeatmap();

  if (bgmSource) bgmSource.stop();
  bgmSource = audioCtx.createBufferSource();
  bgmSource.buffer = audioBuffer;
  
  // 連接音量控制節點
  bgmSource.connect(gainNode);
  bgmSource.start(0);

  startTime = audioCtx.currentTime;
  isPlaying = true;

  requestAnimationFrame(gameLoop);
}

// 生成豐富的音符譜面
function generateBeatmap() {
  const duration = audioBuffer.duration;
  // 從第 1 秒開始，每隔 0.35 秒隨機生成一個落鍵，確保數量充足
  for (let t = 1.0; t < duration - 1; t += 0.35) {
    const col = Math.floor(Math.random() * COLS);
    notes.push({
      col: col,
      time: t, 
      hit: false
    });
  }
}

// 產生內建音訊
function createDefaultAudioBuffer() {
  const sampleRate = 44100;
  const duration = 15; 
  audioBuffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = audioBuffer.getChannelData(0);
  for (let i = 0; i < audioBuffer.length; i++) {
    const t = i / sampleRate;
    data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(- (t % 0.5) * 4) * 0.1;
  }
}

// 調整音量大小 (接收來自滑桿的值 0 ~ 1)
function setVolume(val) {
  if (gainNode) {
    gainNode.gain.setValueAtTime(val, audioCtx ? audioCtx.currentTime : 0);
  }
}

// 鍵盤事件
window.addEventListener('keydown', (e) => {
  const key = e.key.toUpperCase();
  if (keysMap[key] !== undefined && isPlaying) {
    checkHit(keysMap[key]);
  }
});

function checkHit(col) {
  const currentTime = audioCtx.currentTime - startTime;
  const threshold = 0.18; // 判定範圍 (秒)

  let closestNote = null;
  let minDiff = 999;

  for (let note of notes) {
    if (note.col === col && !note.hit) {
      const diff = Math.abs(note.time - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }
  }

  if (closestNote && minDiff < threshold) {
    closestNote.hit = true;
    if (minDiff < 0.08) {
      showJudgment('PERFECT', 'jud-perfect');
      score += 300;
      combo += 1;
    } else {
      showJudgment('GOOD', 'jud-good');
      score += 100;
      combo += 1;
    }
  } else {
    showJudgment('MISS', 'jud-miss');
    combo = 0;
  }
  updateHUD();
}

function showJudgment(text, className) {
  judgmentEl.innerText = text;
  judgmentEl.className = className;
}

function updateHUD() {
  scoreEl.innerText = score;
  comboEl.innerText = combo;
}

// 遊戲主循環
function gameLoop() {
  if (!isPlaying) return;

  const currentTime = audioCtx.currentTime - startTime;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 繪製軌道
  for (let i = 0; i < COLS; i++) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(i * COL_WIDTH + 20, 0, COL_WIDTH - 4, CANVAS_HEIGHT);
  }

  // 判定線
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, JUDGE_LINE_Y);
  ctx.lineTo(20 + COLS * COL_WIDTH, JUDGE_LINE_Y);
  ctx.stroke();

  // 鍵位提示
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 16px Outfit';
  for (let i = 0; i < COLS; i++) {
    ctx.fillText(keyNames[i], i * COL_WIDTH + 58, JUDGE_LINE_Y + 30);
  }

  // 渲染音符 (速度: 300 像素/秒)
  const speed = 300; 
  for (let note of notes) {
    if (note.hit) continue;

    const timeDiff = note.time - currentTime;
    const y = JUDGE_LINE_Y - (timeDiff * speed);

    if (y < -30) {
      note.hit = true;
      showJudgment('MISS', 'jud-miss');
      combo = 0;
      updateHUD();
      continue;
    }

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(note.col * COL_WIDTH + 25, y, COL_WIDTH - 14, 16);
  }

  if (audioBuffer && currentTime > audioBuffer.duration) {
    isPlaying = false;
    alert(`遊戲結束！最終得分：${score}`);
    return;
  }

  requestAnimationFrame(gameLoop);
}
