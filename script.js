let audioCtx = null;
let masterGain = null;

const keyHeights = {
  'A': 0, 'S': 0, 'D': 0, 'F': 0, 'J': 0, 'K': 0
};

let particles = [];

const chordConfigs = {
  'A': { freqs: [261.63, 329.63, 392.00, 493.88], color: '#38bdf8', name: 'C Maj7' }, 
  'S': { freqs: [164.81, 246.94, 329.63, 392.00], color: '#818cf8', name: 'E Min7' }, 
  'D': { freqs: [174.61, 261.63, 329.63, 392.00], color: '#c084fc', name: 'F Maj7' }, 
  'F': { freqs: [196.00, 293.66, 349.23, 392.00], color: '#f472b6', name: 'G7 Sus4' },
  'J': { freqs: [220.00, 261.63, 329.63, 392.00], color: '#34d399', name: 'A Min7' }, 
  'K': { freqs: [523.25, 659.25, 783.99],       color: '#fbbf24', name: 'High C' }  
};

const activeVoices = {};

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

window.addEventListener('pointerdown', () => {
  initAudio();
}, { once: true });

function playPianoChord(key) {
  initAudio();
  if (!chordConfigs[key] || activeVoices[key]) return;

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
  keyHeights[key] = 1.0;
  createParticles(key);
}

function stopPianoChord(key) {
  if (activeVoices[key]) {
    delete activeVoices[key];
  }
}

function createParticles(key) {
  const config = chordConfigs[key];
  const keys = Object.keys(chordConfigs);
  const index = keys.indexOf(key);
  const colWidth = canvas.width / keys.length;
  const centerX = colWidth * index + colWidth / 2;

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

const volumeSlider = document.getElementById('volume-slider');
if (volumeSlider) {
  volumeSlider.addEventListener('input', (e) => {
    initAudio();
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
    }
  });
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key.toUpperCase();
  if (chordConfigs[key]) {
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

const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  ctx.fillStyle = 'rgba(3, 7, 18, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const keys = Object.keys(chordConfigs);
  const colWidth = canvas.width / keys.length;

  keys.forEach((key, index) => {
    if (activeVoices[key]) {
      keyHeights[key] = Math.min(1.0, keyHeights[key] + 0.15);
    } else {
      keyHeights[key] = Math.max(0, keyHeights[key] - 0.05);
    }

    const heightFactor = keyHeights[key];
    const barWidth = colWidth * 0.6;
    const x = index * colWidth + (colWidth - barWidth) / 2;
    const h = (canvas.height * 0.75) * heightFactor;
    const y = canvas.height - h - 30;

    if (h > 2) {
      const config = chordConfigs[key];
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, y);
      gradient.addColorStop(0, 'rgba(17, 24, 39, 0.1)');
      gradient.addColorStop(1, config.color);

      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = config.color;
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, h);
      ctx.restore();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = 'bold 14px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(key, index * colWidth + colWidth / 2, canvas.height - 12);
  });

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

drawVisualizer();
