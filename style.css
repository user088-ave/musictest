// Web Audio API 上下文與合成器設定
let audioCtx = null;
let analyser = null;
let masterGain = null;

// 音軌狀態管理
const activeNodes = {};
let combo = 0;
let hype = 0;

// 定義 8-Bit 聲響 (音高與波形)
const trackConfigs = {
  'A': { type: 'noise', freq: 100, role: 'Drums' },
  'S': { type: 'sawtooth', freq: 110, role: 'Bass' },   // A2 鍵
  'D': { type: 'square', freq: 329.63, role: 'Chords' }, // E4 鍵
  'F': { type: 'triangle', freq: 523.25, role: 'Lead' }   // C5 鍵
};

// 初始化 Web Audio API
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; // 避免聲音過大
    
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// 播放 8-Bit 晶片聲音 (按壓觸發)
function startSound(key) {
  if (!trackConfigs[key] || activeNodes[key]) return;
  initAudio();

  const config = trackConfigs[key];
  const now = audioCtx.currentTime;

  if (config.type === 'noise') {
    // 合成 8-Bit 小鼓/雜訊鼓點
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.8, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    noise.connect(noiseFilter);
    noiseFilter.connect(gainNode);
    gainNode.connect(masterGain);
    
    noise.start(now);
    activeNodes[key] = { stop: () => noise.stop() };
  } else {
    // 振盪器波形 (Bass, Chords, Lead)
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.freq, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.02);

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start(now);
    activeNodes[key] = { osc, gainNode };
  }

  updateHUD(true);
}

// 停止聲音 (放開按鈕)
function stopSound(key) {
  if (!activeNodes[key]) return;
  
  const now = audioCtx.currentTime;
  const node = activeNodes[key];

  if (node.gainNode) {
    node.gainNode.gain.linearRampToValueAtTime(0.01, now + 0.05);
    setTimeout(() => {
      if (node.osc) {
        node.osc.stop();
        node.osc.disconnect();
      }
    }, 50);
  }
  delete activeNodes[key];
}

// 更新 Combo 與熱度值
function updateHUD(isPressed) {
  const comboEl = document.getElementById('combo-count');
  const hypeEl = document.getElementById('hype-count');

  if (isPressed) {
    combo += 1;
    hype = Math.min(100, hype + 5);
  }
  
  comboEl.innerText = combo;
  hypeEl.innerText = `${hype}%`;
}

// 監聽鍵盤事件
window.addEventListener('keydown', (e) => {
  const key = e.key.toUpperCase();
  if (trackConfigs[key] && !e.repeat) {
    startSound(key);
    const card = document.getElementById(`card-${key}`);
    if (card) card.classList.add('active');
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toUpperCase();
  if (trackConfigs[key]) {
    stopSound(key);
    const card = document.getElementById(`card-${key}`);
    if (card) card.classList.remove('active');
  }
});

// Canvas 聲波 Visualizer 繪製
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  canvasCtx.fillStyle = '#000000';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  if (!analyser) return;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const barWidth = (canvas.width / bufferLength) * 1.5;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * canvas.height;

    // 8-Bit 像素發光方柱
    canvasCtx.fillStyle = i % 2 === 0 ? '#00ffcc' : '#ff007f';
    canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

    x += barWidth;
  }
}

// 啟動視覺化繪製
drawVisualizer();
