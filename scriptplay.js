// =================================================================
// 🚀 V6.2 設定區 (雙軌網址已設定完成)
// =================================================================

// 1. 【表單回應 CSV】(手機新增的資料)
const CSV_FORM_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVIFEt-3BoK2wakKbxqX2PbTS_KY8OU6bFXI_qoqlttS4G4sXcybgPRgdxOFmwCZt25sUxlJB5yHVP/pub?output=csv'; 

// 2. 【手動編輯 CSV】(電腦規劃的資料 - V3)
const CSV_MANUAL_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMdqttI_qqT7JLjKBK2jJ9DoGU9i8t7cz8DnpCnRywMbZHgA5xo5d7sKDPp8NGZyWsJ6m4WO4LlHG5/pub?output=csv'; 

// 3. 【新增行程表單】發送網址
const FORM_MISSION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf_2ZIfdEo6HKxRbWYx7a-KT11ShnU-EVAFarAsJGXd0mLH6g/formResponse'; 

// 4. 【表單 ID 設定】
// 新增行程用
const ID_MIS_DATE = 'entry.378526419';
const ID_MIS_ITEM = 'entry.145740809';
const ID_MIS_LOC  = 'entry.821175510';
const ID_MIS_NOTE = 'entry.1050135537';
const ID_MIS_URL  = 'entry.264017073';

// 記帳用
const FORM_EXPENSE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdktMtlNjCQQ3mhlxgNWpmlTivqzgfupf-Bnipx0FnA67FddA/formResponse'; 
const ID_EXP_ITEM = 'entry.51280304';
const ID_EXP_PRICE = 'entry.1762976228';
const ID_EXP_CATEGORY = 'entry.194687162';

// =================================================================
// ⚙️ 系統核心邏輯 (雙核心讀取)
// =================================================================

window.onload = function() {
    console.log('系統啟動 (V6.2 Hybrid)...');
    loadMergedItinerary(); // 啟動合併讀取
    updateTime();
    setupFormListeners();
};

function updateTime() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = now.toLocaleTimeString('en-US', {hour12: false});
    setTimeout(updateTime, 1000);
}

// 分頁切換
window.switchTab = function(tabId) {
    document.querySelectorAll('.hud-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.tech-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(tabId);
    if(target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active-panel'), 10);
    }
    
    if(tabId === 'itinerary') document.getElementById('btn-1')?.classList.add('active');
    if(tabId === 'add-mission') document.getElementById('btn-3')?.classList.add('active');
    if(tabId === 'accounting') document.getElementById('btn-2')?.classList.add('active');
}

// 🚀 核心：同時讀取兩個來源並合併
async function loadMergedItinerary() {
    console.log("正在同步雙軌資料庫...");
    const statusHeader = document.getElementById('itinerary-status');
    
    try {
        const promises = [];
        
        // 1. 讀取表單回應 (Form Data)
        // 格式: [0]Timestamp, [1]Date, [2]Item, [3]Loc, [4]Note, [5]URL
        if(CSV_FORM_URL) {
            promises.push(
                fetch(CSV_FORM_URL + '&t=' + Date.now())
                .then(r => r.text())
                .then(t => ({ source: 'FORM', data: parseCSV(t, [1, 2, 3, 4, 5]) }))
            );
        }
        
        // 2. 讀取手動試算表 (Manual Data)
        // 格式: [0]Date, [1]Item, [2]Loc, ... [5]Note, [6]URL
        if(CSV_MANUAL_URL) {
            promises.push(
                fetch(CSV_MANUAL_URL + '&t=' + Date.now())
                .then(r => r.text())
                .then(t => ({ source: 'MANUAL', data: parseCSV(t, [0, 1, 2, 5, 6]) }))
            );
        }

        if(promises.length === 0) {
            if(statusHeader) statusHeader.innerText = '// 未設定資料來源';
            return;
        }

        const results = await Promise.all(promises);
        let allData = [];

        // 合併資料
        results.forEach(res => {
            console.log(`來源 [${res.source}] 載入 ${res.data.length} 筆`);
            allData = allData.concat(res.data);
        });

        // 依照日期排序
        allData.sort((a, b) => {
            return a.date.localeCompare(b.date);
        });

        console.log(`總計行程: ${allData.length} 筆`);
        renderItinerary(allData);
        if(statusHeader) statusHeader.innerText = `// 同步完成 (共 ${allData.length} 筆)`;

    } catch (err) {
        console.error('讀取失敗:', err);
        if(statusHeader) statusHeader.innerText = '// 連線失敗 (OFFLINE)';
    }
}

// 通用 CSV 解析器 (傳入欄位對應索引 [Date, Item, Loc, Note, Url])
function parseCSV(text, indices) {
    const lines = text.split('\n');
    const result = [];
    const [idxDate, idxItem, idxLoc, idxNote, idxUrl] = indices;

    // 從第 1 行開始 (跳過標題)
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        
        const maxIdx = Math.max(...indices);
        if(row.length > maxIdx) { 
            // 基本防呆：日期太短就跳過
            if(!row[idxDate] || row[idxDate].length < 5) continue;

            result.push({
                date: row[idxDate],
                item: row[idxItem] || '未命名',
                location: row[idxLoc] || '',
                note: row[idxNote] || '',
                url: row[idxUrl] || ''
            });
        }
    }
    return result;
}

function renderItinerary(data) {
    const container = document.getElementById('itinerary-container');
    if(!container) return;
    container.innerHTML = ''; 

    if(data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">無資料</p>';
        return;
    }

    let currentDate = '';
    let dateBlock = null;

    data.forEach(row => {
        if (row.date !== currentDate) {
            currentDate = row.date;
            dateBlock = document.createElement('div');
            dateBlock.className = 'data-row'; 
            
            // 格式化日期顯示 (移除年份)
            let displayDate = row.date.replace(/^\d{4}[\/-]/, '').replace(/-/g, '/');
            
            dateBlock.innerHTML = `<div class="time-col">${displayDate}</div><div class="info-col"></div>`;
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
    // 排除無效連結字串
    if (rawUrl.length > 3 && rawUrl !== 'FALSE' && !rawUrl.includes('[URL]')) {
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
    // 記帳
    const expForm = document.getElementById('expenseForm');
    if(expForm) {
        expForm.onsubmit = function(e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append(ID_EXP_ITEM, document.getElementById('item').value);
            formData.append(ID_EXP_PRICE, document.getElementById('price').value);
            formData.append(ID_EXP_CATEGORY, document.getElementById('category').value);
            sendToGoogle(FORM_EXPENSE_URL, formData, this.querySelector('button[type="submit"]'), '記帳成功');
            this.reset();
        }
    }
    // 新增行程
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
            
            // 本地暫時顯示
            const tempRow = {
                date: document.getElementById('m-date').value,
                item: document.getElementById('m-item').value,
                location: document.getElementById('m-location').value,
                note: document.getElementById('m-note').value,
                url: document.getElementById('m-url').value
            };
            
            sendToGoogle(FORM_MISSION_URL, formData, this.querySelector('button[type="submit"]'), '新增成功', () => {
                switchTab('itinerary');
                const container = document.getElementById('itinerary-container');
                
                // 移除"無資料"提示
                const emptyP = container.querySelector('p');
                if(emptyP) emptyP.remove();

                const newDiv = document.createElement('div');
                newDiv.className = 'data-row';
                newDiv.style.borderLeft = '2px solid #ffd700';
                
                let displayDate = tempRow.date.replace(/^\d{4}[\/-]/, '').replace(/-/g, '/');
                newDiv.innerHTML = `<div class="time-col" style="color:gold">${displayDate}</div><div class="info-col"></div>`;
                createMissionItem(newDiv.querySelector('.info-col'), tempRow);
                
                container.appendChild(newDiv);
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
