// =================================================================
// 🚀 設定區 (已填入你的資料，請勿修改第 1 行格式)
// =================================================================

// 1. 【表單回應 CSV】讀取行程資料庫
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVIFEt-3BoK2wakKbxqX2PbTS_KY8OU6bFXI_qoqlttS4G4sXcybgPRgdxOFmwCZt25sUxlJB5yHVP/pub?output=csv'; 

// 2. 【新增行程用】Google 表單發送網址
const FORM_MISSION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf_2ZIfdEo6HKxRbWYx7a-KT11ShnU-EVAFarAsJGXd0mLH6g/formResponse'; 

// 3. 【新增行程 ID】
const ID_MIS_DATE = 'entry.378526419';  // 日期
const ID_MIS_ITEM = 'entry.145740809';  // 項目
const ID_MIS_LOC  = 'entry.821175510';  // 地點
const ID_MIS_NOTE = 'entry.1050135537'; // 備註
const ID_MIS_URL  = 'entry.264017073';  // 連結

// 4. 【記帳用】Google 表單設定
const FORM_EXPENSE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdktMtlNjCQQ3mhlxgNWpmlTivqzgfupf-Bnipx0FnA67FddA/formResponse'; 
const ID_EXP_ITEM = 'entry.51280304';
const ID_EXP_PRICE = 'entry.1762976228';
const ID_EXP_CATEGORY = 'entry.194687162';

// =================================================================
// ⚙️ 系統核心邏輯
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
// 綁定到 window 確保 HTML 按鈕找得到
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

// 4. CSV 解析器 (略過第一欄時間戳記)
function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    
    // 從第 1 行開始讀 (跳過標題列)
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // 切割 CSV
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim());
        
        // Google 表單回應格式：[0]時間戳記, [1]日期, [2]項目, [3]地點, [4]備註, [5]連結
        if(row.length > 2) { 
            result.push({
                date: row[1] || '', // 改抓第 2 格
                item: row[2] || '未命名行程',
                location: row[3] || '',
                note: row[4] || '',
                url: row[5] || ''
            });
        }
    }
    
    // 依照日期重新排序
    result.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    });

    return result;
}

// 5. 渲染畫面
function renderItinerary(data) {
    const container = document.getElementById('itinerary-container');
    if(!container) return;
    
    container.innerHTML = ''; 
    let currentDate = '';
    let dateBlock = null;

    if(data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; opacity:0.7;">目前尚無行程資料<br>請至「新增行程」頁面添加</p>';
        return;
    }

    data.forEach(row => {
        // 建立日期標題
        if (row.date !== currentDate) {
            currentDate = row.date;
            dateBlock = document.createElement('div');
            dateBlock.className = 'data-row'; 
            
            const timeCol = document.createElement('div');
            timeCol.className = 'time-col';
            // 只顯示 月/日
            timeCol.innerHTML = row.date.replace(/^\d{4}[\/-]/, '').replace(/-/g, '/'); 
            
            const infoCol = document.createElement('div');
            infoCol.className = 'info-col';
            
            dateBlock.appendChild(timeCol);
            dateBlock.appendChild(infoCol);
            container.appendChild(dateBlock);
        }
        createMissionItem(dateBlock.querySelector('.info-col'), row);
    });
}

// 6. 建立單個任務 DOM
function createMissionItem(parentElement, data) {
    const itemDiv = document.createElement('div');
    itemDiv.className = "mission-item-entry"; 

    let locationHtml = data.location ? `<span style="font-size:0.8em; opacity:0.7; margin-left:5px;">📍${data.location}</span>` : '';
    const h4 = document.createElement('h4');
    h4.innerHTML = `${data.item} ${locationHtml}`;
    itemDiv.appendChild(h4);

    if(data.note) {
        const p = document.createElement('p');
        p.innerText = `> ${data.note}`;
        itemDiv.appendChild(p);
    }

    let rawUrl = data.url ? data.url.trim() : '';
    if (rawUrl && rawUrl.length > 3) {
        if (!rawUrl.startsWith('http')) rawUrl = 'https://' + rawUrl;
        
        const linkBtn = document.createElement('a');
        linkBtn.href = rawUrl;
        linkBtn.target = "_blank";
        linkBtn.rel = "noopener noreferrer"; 
        linkBtn.className = "small-link-btn";

        if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
            linkBtn.innerHTML = "▶ 觀看影片";
            linkBtn.style.borderColor = "#ff0000";
            linkBtn.style.color = "#ffaaaa";
        } else if (rawUrl.includes('map')) {
            linkBtn.innerHTML = "🗺️ 開啟地圖";
        } else {
            linkBtn.innerHTML = "🔗 開啟連結";
        }
        itemDiv.appendChild(linkBtn);
    }
    parentElement.appendChild(itemDiv);
}

// 7. 發送表單功能 (通用)
function sendToGoogle(url, formData, btn, originalText, callback) {
    btn.innerText = '傳輸中...';
    btn.disabled = true;

    fetch(url, { method: 'POST', body: formData, mode: 'no-cors' })
    .then(() => {
        if(callback) callback();
        btn.innerText = originalText;
        btn.disabled = false;
    })
    .catch(() => {
        alert('上傳失敗，請檢查網路');
        btn.innerText = originalText;
        btn.disabled = false;
    });
}

// 綁定事件
document.addEventListener('DOMContentLoaded', () => {
    // 啟動讀取行程
    loadItinerary();

    // 綁定記帳表單
    const expenseForm = document.getElementById('expenseForm');
    if(expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const btn = this.querySelector('.submit-btn');
            const originalText = btn.innerText;
            
            const formData = new FormData();
            formData.append(ID_EXP_ITEM, document.getElementById('item').value);
            formData.append(ID_EXP_PRICE, document.getElementById('price').value);
            formData.append(ID_EXP_CATEGORY, document.getElementById('category').value);

            sendToGoogle(FORM_EXPENSE_URL, formData, btn, originalText, () => {
                alert('>> 記帳成功 <<');
            });
            this.reset();
        });
    }

    // 綁定新增行程表單
    const missionForm = document.getElementById('missionForm');
    if(missionForm) {
        missionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const btn = this.querySelector('.submit-btn');
            const originalText = btn.innerText;

            // 取得欄位值
            const dateVal = document.getElementById('m-date').value;
            const itemVal = document.getElementById('m-item').value;
            const locVal = document.getElementById('m-location').value;
            const noteVal = document.getElementById('m-note').value;
            const urlVal = document.getElementById('m-url').value;

            const formData = new FormData();
            formData.append(ID_MIS_DATE, dateVal);
            formData.append(ID_MIS_ITEM, itemVal);
            formData.append(ID_MIS_LOC, locVal);
            formData.append(ID_MIS_NOTE, noteVal);
            formData.append(ID_MIS_URL, urlVal);

            sendToGoogle(FORM_MISSION_URL, formData, btn, originalText, () => {
                alert('>> 新增成功！ <<\n約 3-5 分鐘後會同步到行程表');
                
                // 暫時在畫面顯示剛剛新增的資料
                switchTab('itinerary');
                const container = document.getElementById('itinerary-container');
                if(container) {
                    const emptyMsg = container.querySelector('p');
                    if(emptyMsg) emptyMsg.remove();

                    const newDiv = document.createElement('div');
                    newDiv.className = 'data-row';
                    newDiv.style.borderLeft = '2px solid #ffd700'; 
                    newDiv.innerHTML = `<div class="time-col" style="color:#ffd700">NEW</div><div class="info-col"></div>`;
                    createMissionItem(newDiv.querySelector('.info-col'), {
                        item: itemVal, location: locVal, note: noteVal, url: urlVal
                    });
                    container.insertBefore(newDiv, container.firstChild);
                }
            });
            this.reset();
        });
    }
});
