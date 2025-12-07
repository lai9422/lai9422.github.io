// =================================================================
// 🚀 設定區 (已填入你提供的最新網址)
// =================================================================

// 1. 【表單回應 CSV】讀取行程資料庫
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVIFEt-3BoK2wakKbxqX2PbTS_KY8OU6bFXI_qoqlttS4G4sXcybgPRgdxOFmwCZt25sUxlJB5yHVP/pub?output=csv'; 

// 2. 【新增行程用】Google 表單發送網址 (表單 ID 已設定)
const FORM_MISSION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf_2ZIfdEo6HKxRbWYx7a-KT11ShnU-EVAFarAsJGXd0mLH6g/formResponse'; 

const ID_MIS_DATE = 'entry.378526419';  // 日期
const ID_MIS_ITEM = 'entry.145740809';  // 項目
const ID_MIS_LOC  = 'entry.821175510';  // 地點
const ID_MIS_NOTE = 'entry.1050135537'; // 備註
const ID_MIS_URL  = 'entry.264017073';  // 連結

// 3. 【記帳用】Google 表單設定 (維持不變)
const FORM_EXPENSE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdktMtlNjCQQ3mhlxgNWpmlTivqzgfupf-Bnipx0FnA67FddA/formResponse'; 
const ID_EXP_ITEM = 'entry.51280304';
const ID_EXP_PRICE = 'entry.1762976228';
const ID_EXP_CATEGORY = 'entry.194687162';

// =================================================================
// ⚙️ 系統核心邏輯 (已修復 switchTab 錯誤)
// =================================================================

// 1. 系統時鐘
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {hour12: false});
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = timeString;
}
setInterval(updateTime, 1000);
updateTime();

// 2. 切換分頁 (修復 ReferenceError)
// 我們將函式綁定到 window，確保 HTML 按鈕一定找得到它
window.switchTab = function(tabId) {
    // 隱藏所有面板
    document.querySelectorAll('.hud-panel').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active-panel');
    });
    // 移除按鈕活性
    document.querySelectorAll('.tech-btn').forEach(b => b.classList.remove('active'));

    // 顯示目標面板
    const target = document.getElementById(tabId);
    if(target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active-panel'), 10);
    }
    
    // 更新按鈕狀態
    if(tabId === 'itinerary') document.getElementById('btn-1')?.classList.add('active');
    if(tabId === 'add-mission') document.getElementById('btn-3')?.classList.add('active');
    if(tabId === 'accounting') document.getElementById('btn-2')?.classList.add('active');
}

// 3. 讀取行程表
function loadItinerary() {
    console.log("正在連接資料庫...");
    const statusHeader = document.getElementById('itinerary-status');
    
    // 加上時間參數防止快取
    fetch(SHEET_CSV_URL + '&t=' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error("網路連線錯誤");
            return res.text();
        })
        .then(csvText => {
            console.log("資料下載成功");
            const rows = parseCSV(csvText);
            renderItinerary(rows);
            if(statusHeader) statusHeader.innerText = '// 任務清單 (SYNCED)';
        })
        .catch(err => {
            console.error('讀取失敗:', err);
            if(statusHeader) statusHeader.innerText = '// 連線失敗 (OFFLINE)';
        });
}

// 4. CSV 解析器 (已針對 Google 表單回應格式調整)
function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    
    // Google 表單回應 CSV 結構：
    // Index 0: 時間戳記 (我們不需要)
    // Index 1: 日期
    // Index 2: 項目
    // Index 3: 地點
    // Index 4: 備註
    // Index 5: 連結
    
    // 從第 1 行開始讀 (跳過標題列)
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
