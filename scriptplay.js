// ================= 設定區 =================
// 行程表 CSV (你的專屬連結)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMdqttI_qqT7JLjKBK2jJ9DoGU9i8t7cz8DnpCnRywMbZHgA5xo5d7sKDPp8NGZyWsJ6m4WO4LlHG5/pub?output=csv'; 

// 記帳表單 (你的專屬連結)
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdktMtlNjCQQ3mhlxgNWpmlTivqzgfupf-Bnipx0FnA67FddA/formResponse'; 
const ID_ITEM = 'entry.51280304';
const ID_PRICE = 'entry.1762976228';
const ID_CATEGORY = 'entry.194687162';
// =========================================

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

// 渲染畫面 (★這裡有修改：自動修復網址)
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

        const itemDiv = document.createElement('div');
        itemDiv.style.marginBottom = "15px";
        itemDiv.style.borderLeft = "2px solid rgba(0, 243, 255, 0.3)";
        itemDiv.style.paddingLeft = "10px";

        let locationHtml = row.location ? `<span style="font-size:0.8em; opacity:0.7; margin-left:5px;">📍${row.location}</span>` : '';
        const h4 = document.createElement('h4');
        h4.innerHTML = `${row.item} ${locationHtml}`;
        itemDiv.appendChild(h4);

        if(row.note && row.note !== '-' && row.note !== '') {
            const p = document.createElement('p');
            p.innerText = `> ${row.note}`;
            itemDiv.appendChild(p);
        }

        // ★★★ 關鍵修改區：自動判斷並修復網址 ★★★
        let rawUrl = row.url.trim();
        // 只要格子裡有東西，而且不是 FALSE
        if (rawUrl && rawUrl !== 'FALSE' && rawUrl.length > 3) {
            
            // 如果網址沒有 http 開頭，自動加上 https://
            if (!rawUrl.startsWith('http')) {
                rawUrl = 'https://' + rawUrl;
            }

            const linkBtn = document.createElement('a');
            linkBtn.href = rawUrl;
            linkBtn.target = "_blank"; 
            linkBtn.className = "small-link-btn";
            linkBtn.innerHTML = "［ 開啟連結 ］";
            itemDiv.appendChild(linkBtn);
        }
        // ★★★ 修改結束 ★★★

        if (dateBlock) {
             dateBlock.querySelector('.info-col').appendChild(itemDiv);
        }
    });
}

// 記帳發送
document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.querySelector('.submit-btn');
    const originalText = btn.innerText;

    const formData = new FormData();
    formData.append(ID_ITEM, document.getElementById('item').value);
    formData.append(ID_PRICE, document.getElementById('price').value);
    formData.append(ID_CATEGORY, document.getElementById('category').value);

    btn.innerText = '傳輸中...';
    btn.disabled = true;

    fetch(FORM_URL, { method: 'POST', body: formData, mode: 'no-cors' })
    .then(() => {
        alert('>> 數據上傳成功 <<');
        document.getElementById('expenseForm').reset();
        btn.innerText = originalText;
        btn.disabled = false;
    })
    .catch(() => {
        alert('上傳失敗');
        btn.innerText = originalText;
        btn.disabled = false;
    });
});

document.addEventListener('DOMContentLoaded', () => {
    loadItinerary();
});
