:root {
    --primary-color: #00f3ff; /* 螢光青 */
    --bg-color: #050510; /* 深藍黑 */
    --panel-bg: rgba(10, 20, 30, 0.95);
    --border-color: rgba(0, 243, 255, 0.3);
}

body {
    background-color: var(--bg-color);
    background-image: 
        linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 30px 30px;
    color: var(--primary-color);
    font-family: 'Share Tech Mono', 'Noto Sans TC', monospace;
    margin: 0; padding: 0; overflow-x: hidden;
}

.scan-line {
    position: fixed; top: 0; left: 0; width: 100%; height: 5px;
    background: rgba(0, 243, 255, 0.1);
    animation: scan 3s linear infinite; pointer-events: none; z-index: 999;
}
@keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }

.container { max-width: 600px; margin: 0 auto; padding: 20px; padding-bottom: 50px;}

.hud-header {
    border-bottom: 2px solid var(--primary-color);
    padding-bottom: 10px; margin-bottom: 20px; text-align: center;
}
.status-bar {
    font-size: 12px; display: flex; justify-content: space-between;
    opacity: 0.8; margin-bottom: 5px;
}
.blink { animation: blinking 1s infinite; }
@keyframes blinking { 0% {opacity: 0;} 50% {opacity: 1;} 100% {opacity: 0;} }
h1 { font-size: 24px; margin: 0; text-shadow: 0 0 10px var(--primary-color); }

.hud-nav { display: flex; gap: 5px; margin-bottom: 20px; }
.tech-btn {
    flex: 1; background: transparent;
    border: 1px solid var(--primary-color);
    color: var(--primary-color); padding: 10px 5px;
    font-size: 14px; cursor: pointer; transition: 0.3s;
    font-family: inherit; display: flex; flex-direction: column; align-items: center; justify-content: center;
    clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.tech-btn .icon { font-size: 20px; margin-bottom: 5px; }
.tech-btn.active, .tech-btn:hover {
    background: rgba(0, 243, 255, 0.2);
    box-shadow: 0 0 15px var(--primary-color); color: white;
}

.hud-panel {
    background: var(--panel-bg); border: 1px solid var(--border-color);
    padding: 20px; position: relative;
    box-shadow: inset 0 0 20px rgba(0, 243, 255, 0.05); min-height: 300px;
}
.hud-panel::before {
    content: ''; position: absolute; top: -1px; left: -1px;
    width: 20px; height: 20px; border-top: 2px solid var(--primary-color); border-left: 2px solid var(--primary-color);
}
.hud-panel::after {
    content: ''; position: absolute; bottom: -1px; right: -1px;
    width: 20px; height: 20px; border-bottom: 2px solid var(--primary-color); border-right: 2px solid var(--primary-color);
}
h3 { margin-top: 0; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px; }

.data-row {
    display: flex; border-left: 2px solid var(--primary-color);
    margin-bottom: 20px; padding-left: 15px;
    background: linear-gradient(90deg, rgba(0,243,255,0.05) 0%, transparent 100%);
}
.time-col { font-weight: bold; min-width: 50px; padding-top: 5px; color: #fff; font-size: 14px;}
.info-col { width: 100%; }
.mission-item-entry { margin-bottom: 15px; border-bottom: 1px solid rgba(0,243,255,0.1); padding-bottom: 10px; }
.info-col h4 { margin: 0 0 5px 0; color: #fff; text-shadow: 0 0 5px var(--primary-color); font-size: 16px; }
.info-col p { margin: 2px 0; font-size: 14px; opacity: 0.8; line-height: 1.4; }

.input-group { margin-bottom: 15px; }
.input-group label { display: block; font-size: 12px; margin-bottom: 5px; opacity: 0.7; }
input, select {
    width: 100%; background: rgba(0, 0, 0, 0.5);
    border: 1px solid var(--border-color);
    color: white; padding: 10px; font-size: 16px; font-family: inherit; box-sizing: border-box;
}
input:focus, select:focus {
    outline: none; border-color: var(--primary-color);
    box-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
}
.submit-btn {
    width: 100%; padding: 15px; margin-top: 10px;
    background: var(--primary-color); color: black;
    font-weight: bold; border: none; font-size: 18px;
    cursor: pointer; font-family: inherit;
    clip-path: polygon(0 0, 95% 0, 100% 20%, 100% 100%, 5% 100%, 0 80%);
}

.small-link-btn {
    display: inline-block; margin-top: 8px; font-size: 12px;
    color: var(--primary-color); border: 1px solid var(--primary-color);
    padding: 4px 10px; text-decoration: none; transition: 0.3s;
    background: rgba(0, 243, 255, 0.1);
}
.small-link-btn:hover { background: var(--primary-color); color: black; }
footer { text-align: center; font-size: 10px; opacity: 0.5; margin-top: 30px; }
