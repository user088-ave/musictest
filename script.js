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
let startTime = 0;

// DOM 元素
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const judgmentEl = document.getElementById('judgment');
const startBtn = document.getElementById('start-btn');
const audioUpload = document.getElementById('audio-upload');

// 檔案上傳監聽
audioUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const arrayBuffer = await file.arrayBuffer();
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  alert('音樂載入成功！點擊「開始遊戲」即可遊玩。');
});

startBtn.addEventListener('click', () => {
  startGame();
});

function startGame() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // 若未上傳音樂，產生簡單的內建節奏音軌
  if (!audioBuffer) {
    createDefaultAudioBuffer();
  }

  // 重置遊戲狀態
  score = 0;
  combo = 0;
  notes = [];
  updateHUD();

  // 產生示範譜面 (每 0.5 秒掉落一個音符)
  generateBeatmap();

  if (bgmSource) bgmSource.stop();
  bgmSource = audioCtx.createBufferSource();
  bgmSource.buffer = audioBuffer;
  bgmSource.connect(audioCtx.destination);
  bgmSource.start(0);

  startTime = audioCtx.currentTime;
  isPlaying = true;

  requestAnimationFrame(gameLoop);
}

// 產生測試譜面
function generateBeatmap() {
  const duration = audioBuffer.duration;
  for (let t = 1.0; t < duration - 1; t += 0.5) {
    const col = Math.floor(Math.random() * COLS);
    notes.push({
      col: col,
      time: t, // 目標擊打時間 (秒)
      hit: false
    });
  }
}

// 產生內建音訊
function createDefaultAudioBuffer() {
  const sampleRate = 44100;
  const duration = 10; // 10秒測試音
  audioBuffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = audioBuffer.getChannelData(0);
  for (let i = 0; i < audioBuffer.length; i++) {
    const t = i / sampleRate;
    data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(- (t % 1) * 3) * 0.1;
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
  const threshold = 0.15; // 判定範圍 (秒)

  // 尋找該軌道最接近判定線的未擊打音符
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
    if (minDiff < 0.06) {
      showJudgment('PERFECT', 'jud-perfect');
      score += 300;
      combo += 1;
    } else {
      showJudgment('GOOD', 'jud-good');
      score += 100;
      combo += 1;
    }
  } else {
    // 空按或按錯
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

  // 清除畫布
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 繪製 4 條軌道背景
  for (let i = 0; i < COLS; i++) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(i * COL_WIDTH + 20, 0, COL_WIDTH - 4, CANVAS_HEIGHT);
  }

  // 繪製判定線
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, JUDGE_LINE_Y);
  ctx.lineTo(20 + COLS * COL_WIDTH, JUDGE_LINE_Y);
  ctx.stroke();

  // 繪製按鍵提示字母於判定線下方
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 16px Outfit';
  for (let i = 0; i < COLS; i++) {
    ctx.fillText(keyNames[i], i * COL_WIDTH + 58, JUDGE_LINE_Y + 30);
  }

  // 渲染與更新音符位置 (速度: 300 像素/秒)
  const speed = 300; 
  for (let note of notes) {
    if (note.hit) continue;

    const timeDiff = note.time - currentTime;
    const y = JUDGE_LINE_Y - (timeDiff * speed);

    // 若音符過期未打 -> Miss
    if (y < -30) {
      note.hit = true;
      showJudgment('MISS', 'jud-miss');
      combo = 0;
      updateHUD();
      continue;
    }

    // 繪製幾何音符
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(note.col * COL_WIDTH + 25, y, COL_WIDTH - 14, 16);
  }

  // 檢查音樂是否結束
  if (audioBuffer && currentTime > audioBuffer.duration) {
    isPlaying = false;
    alert(`遊戲結束！最終得分：${score}`);
    return;
  }

  requestAnimationFrame(gameLoop);
}
