let audioCtx = null;
let masterGain = null;

// 記錄每個按鍵的當前動態高度
const keyHeights = {
  'A': 0, 'S': 0, 'D': 0, 'F': 0, 'J': 0, 'K': 0
};

// 粒子陣列
let particles = [];

// 定義鋼琴和弦頻率與對應顏色
const chordConfigs = {
  'A': { freqs: [261.63, 329.63, 392.00, 493.88], color: '#38bdf8', name: 'C Maj7' }, 
  'S': { freqs: [164.81, 246.94, 329.63, 392.00], color: '#818cf8', name: 'E Min7' }, 
  'D': { freqs: [174.61, 261.63, 329.63, 392.00], color: '#c084fc', name: 'F Maj7' }, 
  'F': { freqs: [196.00, 293.66, 349.23, 392.00], color: '#f472b6', name: 'G7 Sus4' },
  'J': { freqs: [220.00, 261.63, 329.63, 392.00], color: '#34d399', name: 'A Min7' }, 
  'K': { freqs: [523.25, 659.25, 783.99],       color: '#fbbf24', name: 'High C' }  
};

const activeVoices = {};

// 初始化 Web Audio API
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// 播放鋼琴和弦與觸發對應位置特效
function playPianoChord(key) {
  if (!chordConfigs[key] || activeVoices[key]) return;
  initAudio();

  const config = chordConfigs[key];
  const now = audioCtx.currentTime;
  const oscillators = [];
  const gains = [];

  config.freqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 2.5);

    oscillators.push(osc);
    gains.push(gain);
  });

  activeVoices[key] = { oscillators, gains };

  // 瞬間拉高該按鍵的視覺化柱狀高度
  keyHeights[key] = 1.0;

  // 在該按鍵正中央位置噴發粒子
  createParticles(key);
}

// 停止發聲
function stopPianoChord(key) {
  if (activeVoices[key]) {
    delete activeVoices[key];
  }
}

// 根據按鍵位置產生對應的粒子（精準對齊欄位中心）
function createParticles(key) {
  const config = chordConfigs[key];
  const keys = Object.keys(chordConfigs);
  const index = keys.indexOf(key);
  const colWidth = canvas.width / keys.length;
  const centerX = colWidth * index + colWidth / 2; // 欄位正中央

  for (let i = 0; i < 20; i++) {
    particles.push({
      x: centerX + (Math.random() - 0.5) * (colWidth * 0.6),
      y: canvas.height - 20,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 6 - 2,
      radius: Math.random() * 4 + 2,
      color: config.color,
      alpha: 1
    });
  }
}

// 音量控制
document.getElementById('volume-slider').addEventListener('input', (e) => {
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
  }
});

// 鍵盤事件監聽
window.addEventListener('keydown', (e) => {
  const key = e.key.toUpperCase();
  if (chordConfigs[key] && !e.repeat) {
    playPianoChord(key);
    const card = document.getElementById(`card-${key}`);
    if (card) card.classList.add('active');
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toUpperCase();
  if (chordConfigs[key]) {
    stopPianoChord(key);
    const card = document.getElementById(`card-${key}`);
    if (card) card.classList.remove('active');
  }
});

// Canvas 畫布與分欄動態視覺化繪製
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  // 清除背景殘影
  ctx.fillStyle = 'rgba(3, 7, 18, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const keys = Object.keys(chordConfigs);
  const colWidth = canvas.width / keys.length;

  // 1. 繪製 6 個完美對齊琴鍵位置的光柱 (Bars)
  keys.forEach((key, index) => {
    if (activeVoices[key]) {
      keyHeights[key] = Math.min(1.0, keyHeights[key] + 0.15);
    } else {
      keyHeights[key] = Math.max(0, keyHeights[key] - 0.05);
    }

    const heightFactor = keyHeights[key];
    
    // 讓光柱寬度佔該欄位的 60%，並透過公式精準置中在該欄位內
    const barWidth = colWidth * 0.6;
    const x = index * colWidth + (colWidth - barWidth) / 2;
    const h = (canvas.height * 0.75) * heightFactor;
    const y = canvas.height - h - 30; // 留空間給底部按鍵提示文字

    if (h > 2) {
      const config = chordConfigs[key];
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, y);
      gradient.addColorStop(0, 'rgba(17, 24, 39, 0.1)');
      gradient.addColorStop(1, config.color);

      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = config.color;
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, h); // 使用標準矩形確保完美對齊
      ctx.restore();
    }

    // 繪製底部的鍵名標示於畫布中
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = 'bold 14px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(key, index * colWidth + colWidth / 2, canvas.height - 12);
  });

  // 2. 繪製擴散粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.02;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 啟動畫布渲染
drawVisualizer();
```[cite: 1]

更新後，光柱就會跟著你的按鍵位置，完完全全和粒子從同一個欄位中心升起囉！快去 GitHub 重新整理看看效果吧！
