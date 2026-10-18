let audioCtx = null;
let masterGain = null;
let analyser = null;

// 音符粒子陣列
let particles = [];

// 定義鋼琴和弦頻率 (Hz)
const chordConfigs = {
  'A': { freqs: [261.63, 329.63, 392.00, 493.88], color: '#38bdf8', name: 'C Maj7' }, // C4, E4, G4, B4
  'S': { freqs: [164.81, 246.94, 329.63, 392.00], color: '#818cf8', name: 'E Min7' }, // E3, B3, E4, G4
  'D': { freqs: [174.61, 261.63, 329.63, 392.00], color: '#c084fc', name: 'F Maj7' }, // F3, C4, E4, G4
  'F': { freqs: [196.00, 293.66, 349.23, 392.00], color: '#f472b6', name: 'G7 Sus4' },// G3, D4, F4, G4
  'J': { freqs: [220.00, 261.63, 329.63, 392.00], color: '#34d399', name: 'A Min7' }, // A3, C4, E4, G4
  'K': { freqs: [523.25, 659.25, 783.99],       color: '#fbbf24', name: 'High C' }  // C5, E5, G5
};

const activeVoices = {};

// 初始化 Web Audio API
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);

    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// 模擬鋼琴琴音 (合成器)
function playPianoChord(key) {
  if (!chordConfigs[key] || activeVoices[key]) return;
  initAudio();

  const config = chordConfigs[key];
  const now = audioCtx.currentTime;
  const oscillators = [];
  const gains = [];

  // 為和弦中的每個頻率建立音軌
  config.freqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // 正弦波 + 柔和泛音模擬鋼琴質感
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // ADSR 鋼琴包絡線：快速 Hit，漸進釋放 (Decay/Release)
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

  // 產生動態光影粒子
  createParticles(key);
}

// 觸發視覺化粒子擴散
function createParticles(key) {
  const config = chordConfigs[key];
  const keys = Object.keys(chordConfigs);
  const index = keys.indexOf(key);
  const canvasWidth = canvas.width;
  const x = (canvasWidth / keys.length) * (index + 0.5);

  for (let i = 0; i < 25; i++) {
    particles.push({
      x: x,
      y: canvas.height - 20,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 8 - 2,
      radius: Math.random() * 5 + 2,
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

// 鍵盤按下與放開監聽
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
    delete activeVoices[key];
    const card = document.getElementById(`card-${key}`);
    if (card) card.classList.remove('active');
  }
});

// Canvas 高質感動態光影繪製
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  // 漸隱背景產生尾影效果
  ctx.fillStyle = 'rgba(3, 7, 18, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 繪製頻域平滑波形 (Equalizer)
  if (analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const barWidth = (canvas.width / bufferLength) * 2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * (canvas.height * 0.7);

      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.1)');
      gradient.addColorStop(1, 'rgba(192, 132, 252, 0.8)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

      x += barWidth;
    }
  }

  // 繪製動態粒子光霧
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.015;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 啟動畫布渲染
drawVisualizer();
