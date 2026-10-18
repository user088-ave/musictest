/* 基礎設定與復古字體 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
}

body {
  background-color: #0b0b1a;
  color: #00ffcc;
  font-family: 'Press Start 2P', monospace;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}

.game-container {
  width: 90%;
  max-width: 750px;
  background: #12122c;
  border: 4px solid #00ffcc;
  box-shadow: 0 0 20px #00ffcc, inset 0 0 15px rgba(0, 255, 204, 0.3);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* 標頭 HUD */
.hud-header {
  width: 100%;
  text-align: center;
}

.title {
  font-size: 1.1rem;
  color: #ff007f;
  text-shadow: 2px 2px #00ffcc;
  margin-bottom: 12px;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  font-size: 0.75rem;
  color: #fff;
}

.stat-box {
  background: #1f1f47;
  padding: 6px 12px;
  border: 2px solid #ff007f;
}

/* 聲波 Visualizer */
.visualizer-container {
  width: 100%;
  background: #000;
  border: 3px solid #ff007f;
  box-shadow: 0 0 10px #ff007f;
}

#visualizer {
  width: 100%;
  height: 120px;
  display: block;
}

/* 樂器舞台區 */
.band-stage {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
}

.member-card {
  background: #1a1a3a;
  border: 3px solid #444477;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  transition: all 0.05s ease;
}

.key-badge {
  background: #444477;
  color: #fff;
  font-size: 0.9rem;
  padding: 4px 8px;
  border-radius: 3px;
}

.role-name {
  font-size: 0.55rem;
  color: #aaa;
}

/* 樂手像素角色預設 */
.pixel-avatar {
  width: 50px;
  height: 50px;
  background-color: #333366;
  border: 2px solid #555599;
  position: relative;
}

/* 樂手角色動態觸發 (Active) */
.member-card.active {
  border-color: #00ffcc;
  background: #25255e;
  box-shadow: 0 0 15px #00ffcc;
  transform: translateY(-4px);
}

.member-card.active .key-badge {
  background: #ff007f;
  color: #fff;
  box-shadow: 0 0 8px #ff007f;
}

.member-card.active .role-name {
  color: #00ffcc;
}

.member-card.active .pixel-avatar {
  background-color: #00ffcc;
  box-shadow: 0 0 12px #00ffcc;
  animation: dance 0.15s infinite alternate;
}

@keyframes dance {
  0% { transform: scale(1); }
  100% { transform: scale(1.1) rotate(3deg); }
}

/* 操作提示 */
.controls-guide {
  font-size: 0.65rem;
  color: #ffff00;
  text-align: center;
}
