// =================================================================
// 🚀 核心設定區 (所有 ID 已自動填入)
// =================================================================

// 1. 行程表 CSV 讀取網址
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMdqttI_qqT7JLjKBK2jJ9DoGU9i8t7cz8DnpCnRywMbZHgA5xo5d7sKDPp8NGZyWsJ6m4WO4LlHG5/pub?output=csv'; 

// 2. 【記帳用】Google 表單設定
const FORM_EXPENSE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdktMtlNjCQQ3mhlxgNWpmlTivqzgfupf-Bnipx0FnA67FddA/formResponse'; 
const ID_EXP_ITEM = 'entry.51280304';
const ID_EXP_PRICE = 'entry.1762976228';
const ID_EXP_CATEGORY = 'entry.194687162';

// 3. 【新增行程用】Google 表單設定 (已從你的連結解析 ID)
const FORM_MISSION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf_2ZIfdEo6HKxRbWYx7a-KT11ShnU-EVAFarAsJGXd0mLH6g/formResponse'; 

const ID_MIS_DATE = 'entry.378526419';  // 日期
const ID_MIS_ITEM = 'entry.145740809';  // 項目
const ID_MIS_LOC  = 'entry.821175510';  // 地點
const ID_MIS_NOTE = 'entry.1050135537'; // 備註
const ID_MIS_URL  = 'entry.264017073';  // 連結

// =================================================================
// 系統核心邏輯 (以下無需修改)
// =================================================================

// 系統時鐘
function updateTime() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('en-US', {hour12: false});
}
setInterval(updateTime, 1000);
updateTime();

// 切換分頁
window.switchTab = function(tabId) {
    document.querySelectorAll('.hud-panel').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active-panel');
    });
    document.querySelectorAll('.tech-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(tabId);
    if(target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active-panel'), 10);
    }
    
    if(tabId === 'itinerary') document.getElementById('btn-1').classList.add('active');
    if(tabId === 'add-mission') document.getElementById('btn-3').classList.add('active');
    if(tabId === 'accounting') document.getElementById('btn-2').classList.add('active');
}

// 讀取行程表
function loadItinerary() {
    console.log("正在連接衛星資料庫...");
    const statusHeader = document.getElementById('itinerary-status');
    
    fetch(SHEET_CSV_URL + '&t=' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error("網路連線錯誤");
            return res.text();
        })
        .then(csvText => {
            const rows = parseCSV(csvText);
            renderItinerary(rows);
            statusHeader.innerText = '// 任務清單 (SYNCED)';
        })
        .catch(err => {
            console.error('讀取失敗:', err);
            statusHeader.innerText = '// 連線失敗 (OFFLINE)';
        });
}

// CSV 解析器
function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim());
        if(row.length > 2) { 
            result.push({
                date: row[0] || '',
                item: row[1] || '未命名行程',
                location: row[2] || '',
                note: row[5] || '',
                url: row[6] || ''
            });
        }
    }
    return result;
}

// 渲染畫面
function renderItinerary(data) {
    const container = document.getElementById('itinerary-container');
    container.innerHTML = ''; 
    let currentDate = '';
    let dateBlock = null;

    data.forEach(row => {
        if (row.date !== currentDate) {
            currentDate = row.date;
            dateBlock = document.createElement('div');
            dateBlock.className = 'data-row'; 
            
            const timeCol = document.createElement('div');
            timeCol.className = 'time-col';
            timeCol.innerHTML = row.date.replace(/\d{4}\//, '').replace(/-/g, '/'); 
            
            const infoCol = document.createElement('div');
            infoCol.className = 'info-col';
            
            dateBlock.appendChild(timeCol);
            dateBlock.appendChild(infoCol);
            container.appendChild(dateBlock);
        }
        createMissionItem(dateBlock.querySelector('.info-col'), row);
    });
}

function createMissionItem(parentElement, data) {
    const itemDiv = document.createElement('div');
    itemDiv.className = "mission-item-entry"; 

    let locationHtml = data.location ? `<span style="font-size:0.8em; opacity:0.7; margin-left:5px;">📍${data.location}</span>` : '';
    const h4 = document.createElement('h4');
    h4.innerHTML = `${data.item} ${locationHtml}`;
    itemDiv.appendChild(h4);

    if(data.note && data.note !== '-' && data.note !== '') {
        const p = document.createElement('p');
        p.innerText = `> ${data.note}`;
        itemDiv.appendChild(p);
    }

    let rawUrl = data.url ? data.url.trim() : '';
    if (rawUrl && rawUrl !== 'FALSE' && !rawUrl.includes('[URL]') && rawUrl.length > 3) {
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

// 發送函式
function sendToGoogle(url, formData, btn, btnText, callback) {
    btn.innerText = '傳輸中...';
    btn.disabled = true;

    fetch(url, { method: 'POST', body: formData, mode: 'no-cors' })
    .then(() => {
        if(callback) callback();
        btn.innerText = btnText;
        btn.disabled = false;
    })
    .catch(() => {
        alert('上傳失敗，請檢查網路');
        btn.innerText = btnText;
        btn.disabled = false;
    });
}

// 功能 A: 記帳表單發送
document.getElementById('expenseForm').addEventListener('submit', function(e) {
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

// 功能 B: 新增行程表單發送
document.getElementById('missionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('.submit-btn');
    const originalText = btn.innerText;

    // 取得輸入值
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
        alert('>> 新增成功！ <<\n(注意：約 3-5 分鐘後才會永久顯示在行程表)');
        
        // 切換回行程表並暫時顯示
        switchTab('itinerary');
        const container = document.getElementById('itinerary-container');
        const newDiv = document.createElement('div');
        newDiv.className = 'data-row';
        newDiv.style.borderLeft = '2px solid #ffd700'; 
        newDiv.innerHTML = `
            <div class="time-col" style="color:#ffd700">NEW</div>
            <div class="info-col"></div>
        `;
        createMissionItem(newDiv.querySelector('.info-col'), {
            item: itemVal, location: locVal, note: noteVal, url: urlVal
        });
        container.insertBefore(newDiv, container.firstChild);
    });
    this.reset();
});

document.addEventListener('DOMContentLoaded', () => {
    loadItinerary();
});
