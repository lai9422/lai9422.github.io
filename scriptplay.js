// =================================================================
// 1. 確保這一行是完整的 (不要只貼網址，要包含 const SHEET_CSV_URL = ...)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVIFEt-3BoK2wakKbxqX2PbTS_KY8OU6bFXI_qoqlttS4G4sXcybgPRgdxOFmwCZt25sUxlJB5yHVP/pub?output=csv'; 
// =================================================================

// 2. 表單設定
const FORM_MISSION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf_2ZIfdEo6HKxRbWYx7a-KT11ShnU-EVAFarAsJGXd0mLH6g/formResponse'; 
const ID_MIS_DATE = 'entry.378526419';
const ID_MIS_ITEM = 'entry.145740809';
const ID_MIS_LOC  = 'entry.821175510';
const ID_MIS_NOTE = 'entry.1050135537';
const ID_MIS_URL  = 'entry.264017073';

const FORM_EXPENSE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdktMtlNjCQQ3mhlxgNWpmlTivqzgfupf-Bnipx0FnA67FddA/formResponse'; 
const ID_EXP_ITEM = 'entry.51280304';
const ID_EXP_PRICE = 'entry.1762976228';
const ID_EXP_CATEGORY = 'entry.194687162';

// 3. 系統核心
window.onload = function() {
    console.log('系統啟動...');
    loadItinerary();
    updateTime();
    
    // 綁定表單監聽
    setupFormListeners();
};

function updateTime() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = now.toLocaleTimeString('en-US', {hour12: false});
    setTimeout(updateTime, 1000);
}

// 全域切換分頁函式
window.switchTab = function(tabId) {
    console.log('切換到分頁:', tabId);
    document.querySelectorAll('.hud-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.tech-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(tabId);
    if(target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active-panel'), 10);
    } else {
        alert('錯誤：找不到 ID 為 ' + tabId + ' 的區塊，請檢查 HTML');
    }
    
    // 更新按鈕樣式
    if(tabId === 'itinerary') document.getElementById('btn-1')?.classList.add('active');
    if(tabId === 'add-mission') document.getElementById('btn-3')?.classList.add('active');
    if(tabId === 'accounting') document.getElementById('btn-2')?.classList.add('active');
}

function loadItinerary() {
    console.log("正在讀取 CSV...");
    const statusHeader = document.getElementById('itinerary-status');
    
    fetch(SHEET_CSV_URL + '&t=' + Date.now())
        .then(res => res.text())
        .then(csvText => {
            if(csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) {
                alert('【權限錯誤】\nGoogle 試算表沒有公開。\n請去試算表 -> 共用 -> 設為「知道連結者皆可檢視」。');
                return;
            }
            console.log("CSV 下載成功，長度:", csvText.length);
            const rows = parseCSV(csvText);
            renderItinerary(rows);
            if(statusHeader) statusHeader.innerText = '// 任務清單 (SYNCED)';
        })
        .catch(err => {
            console.error('讀取失敗:', err);
            statusHeader.innerText = '// 連線失敗 (OFFLINE)';
            // alert('無法讀取行程表，請檢查網路或連結'); // 避免一直跳窗干擾
        });
}

function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    // 從第 1 行開始 (跳過標題)
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        if(row.length > 2) { 
            result.push({
                date: row[1] || '',
                item: row[2] || '未命名行程',
                location: row[3] || '',
                note: row[4] || '',
                url: row[5] || ''
            });
        }
    }
    // 日期排序
    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
}

function renderItinerary(data) {
    const container = document.getElementById('itinerary-container');
    if(!container) return;
    container.innerHTML = ''; 

    if(data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">目前無行程，請按「新增行程」添加</p>';
        return;
    }

    let currentDate = '';
    let dateBlock = null;

    data.forEach(row => {
        if (row.date !== currentDate) {
            currentDate = row.date;
            dateBlock = document.createElement('div');
            dateBlock.className = 'data-row'; 
            dateBlock.innerHTML = `<div class="time-col">${row.date.slice(5)}</div><div class="info-col"></div>`; // 取月日
            container.appendChild(dateBlock);
        }
        createMissionItem(dateBlock.querySelector('.info-col'), row);
    });
}

function createMissionItem(parentElement, data) {
    const itemDiv = document.createElement('div');
    itemDiv.className = "mission-item-entry"; 
    
    let locHtml = data.location ? `<span style="font-size:0.8em; opacity:0.7; margin-left:5px;">📍${data.location}</span>` : '';
    let linkHtml = '';
    
    let rawUrl = data.url ? data.url.trim() : '';
    if (rawUrl.length > 3) {
        if (!rawUrl.startsWith('http')) rawUrl = 'https://' + rawUrl;
        let btnText = "🔗 開啟連結";
        let btnStyle = "";
        if (rawUrl.includes('youtu')) { btnText = "▶ 觀看影片"; btnStyle = "color:#ffaaaa; border-color:red;"; }
        else if (rawUrl.includes('map')) { btnText = "🗺️ 開啟地圖"; }
        
        linkHtml = `<a href="${rawUrl}" target="_blank" rel="noopener noreferrer" class="small-link-btn" style="${btnStyle}">${btnText}</a>`;
    }

    itemDiv.innerHTML = `
        <h4>${data.item} ${locHtml}</h4>
        ${data.note ? `<p>> ${data.note}</p>` : ''}
        ${linkHtml}
    `;
    parentElement.appendChild(itemDiv);
}

function setupFormListeners() {
    // 記帳表單
    const expForm = document.getElementById('expenseForm');
    if(expForm) {
        expForm.onsubmit = function(e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append(ID_EXP_ITEM, document.getElementById('item').value);
            formData.append(ID_EXP_PRICE, document.getElementById('price').value);
            formData.append(ID_EXP_CATEGORY, document.getElementById('category').value);
            // 這裡傳入的是 submit 按鈕 (不是清除按鈕)，所以用 querySelector 找 type=submit
            sendToGoogle(FORM_EXPENSE_URL, formData, this.querySelector('button[type="submit"]'), '記帳成功');
            this.reset();
        }
    }
    // 新增行程表單
    const misForm = document.getElementById('missionForm');
    if(misForm) {
        misForm.onsubmit = function(e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append(ID_MIS_DATE, document.getElementById('m-date').value);
            formData.append(ID_MIS_ITEM, document.getElementById('m-item').value);
            formData.append(ID_MIS_LOC, document.getElementById('m-location').value);
            formData.append(ID_MIS_NOTE, document.getElementById('m-note').value);
            formData.append(ID_MIS_URL, document.getElementById('m-url').value);
            
            // 暫存輸入的資料，用於本地顯示
            const inputDate = document.getElementById('m-date').value;
            const tempRow = {
                date: inputDate,
                item: document.getElementById('m-item').value,
                location: document.getElementById('m-location').value,
                note: document.getElementById('m-note').value,
                url: document.getElementById('m-url').value
            };
            
            sendToGoogle(FORM_MISSION_URL, formData, this.querySelector('button[type="submit"]'), '新增成功', () => {
                switchTab('itinerary');
                // 1. 切換回行程表
                const container = document.getElementById('itinerary-container');
                
                // 2. 建立新區塊 (顯示輸入的日期，而不是 NEW)
                const newDiv = document.createElement('div');
                newDiv.className = 'data-row';
                newDiv.style.borderLeft = '2px solid #ffd700'; // 金色邊框標記
                
                // 取出日期部分 (例如 2025/12/20 -> 12/20)
                let displayDate = inputDate.replace(/^\d{4}[\/-]/, '').replace(/-/g, '/');
                if(!displayDate) displayDate = "NEW"; // 防呆
                
                newDiv.innerHTML = `<div class="time-col" style="color:#ffd700">${displayDate}</div><div class="info-col"></div>`;
                
                createMissionItem(newDiv.querySelector('.info-col'), tempRow);
                
                // 3. 插入到最下方 (appendChild)
                container.appendChild(newDiv);
                
                // 自動捲動到底部，讓用戶看到新增的項目
                newDiv.scrollIntoView({ behavior: 'smooth' });
            });
            this.reset();
        }
    }
}

function sendToGoogle(url, formData, btn, successMsg, callback) {
    const orgText = btn.innerText;
    btn.innerText = '傳送中...';
    btn.disabled = true;
    fetch(url, { method: 'POST', body: formData, mode: 'no-cors' })
        .then(() => {
            alert('>> ' + successMsg + ' <<');
            if(callback) callback();
        })
        .catch(err => alert('發送失敗'))
        .finally(() => {
            btn.innerText = orgText;
            btn.disabled = false;
        });
}
