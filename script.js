document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素 ---
    const fabBtn = document.getElementById('fab-btn');
    const modal = document.getElementById('post-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const submitPostBtn = document.getElementById('submit-post');
    const postText = document.getElementById('post-text');
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image');
    const feed = document.getElementById('feed');
    
    // 導覽與頁面
    const navItems = document.querySelectorAll('.nav-item');
    const pageSections = document.querySelectorAll('.page-section');
    
    // 聊天與通知
    const msgInput = document.getElementById('msg-input');
    const sendMsgBtn = document.getElementById('send-msg-btn');
    const chatMessages = document.getElementById('chat-messages');
    const notificationList = document.getElementById('notification-list');
    const toastContainer = document.getElementById('toast-container');

    let currentImageFile = null;

    // ========================
    // 0. 工具函式：彈出通知 & 寫入通知頁
    // ========================
    
    // 顯示彈出卡片 (Toast)
    function showToast(title, message, iconClass = 'fa-solid fa-bell') {
        const toast = document.createElement('div');
        toast.classList.add('toast-card');
        
        toast.innerHTML = `
            <div class="toast-icon"><i class="${iconClass}"></i></div>
            <div class="toast-body">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        
        toastContainer.appendChild(toast);

        // 動畫結束後 (4秒) 移除元素
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // 新增到「通知頁面」列表
    function addNotificationToPage(content) {
        const div = document.createElement('div');
        div.classList.add('noti-item');
        div.innerHTML = `
            <div class="avatar" style="background-color: #e7f3ff; color: #1877f2;">N</div>
            <div class="noti-content">
                <p>${content}</p>
                <span class="noti-time">剛剛</span>
            </div>
        `;
        // 插入到最上方
        notificationList.prepend(div);
    }

    // ========================
    // 1. 頁面切換邏輯
    // ========================
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            pageSections.forEach(section => {
                section.classList.remove('active');
                section.classList.add('hidden');
            });
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
            document.getElementById(targetId).classList.add('active');
            fabBtn.style.display = (targetId === 'page-home') ? 'flex' : 'none';
        });
    });

    // ========================
    // 2. 聊天功能 (整合通知)
    // ========================
    function sendMessage() {
        const text = msgInput.value.trim();
        if (!text) return;

        const date = new Date();
        const timeString = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'sent');
        msgDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;
        chatMessages.appendChild(msgDiv);
        msgInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // [觸發通知] 1. 彈出 Toast
        showToast('訊息已發送', `你傳送了：${text.substring(0, 10)}...`, 'fa-solid fa-paper-plane');
        
        // [觸發通知] 2. 寫入通知頁面
        addNotificationToPage(`你對 <strong>Alice</strong> 發送了一則訊息。`);
    }

    sendMsgBtn.addEventListener('click', sendMessage);
    msgInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    // ========================
    // 3. 貼文功能 (整合通知)
    // ========================
    fabBtn.addEventListener('click', () => { modal.classList.add('show'); postText.focus(); });
    const closeModal = () => { modal.classList.remove('show'); resetForm(); };
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    imageUpload.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            currentImageFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        }
    });

    removeImageBtn.addEventListener('click', () => {
        imageUpload.value = '';
        currentImageFile = null;
        imagePreview.src = '';
        imagePreviewContainer.classList.add('hidden');
    });

    function resetForm() {
        postText.value = '';
        imageUpload.value = '';
        currentImageFile = null;
        imagePreview.src = '';
        imagePreviewContainer.classList.add('hidden');
    }

    submitPostBtn.addEventListener('click', () => {
        const text = postText.value.trim();
        if (!text && !currentImageFile) { alert('請輸入內容或上傳圖片！'); return; }
        createPost(text, currentImageFile);
        closeModal();
    });

    function createPost(text, imageFile) {
        const date = new Date();
        const timeString = date.toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        const postDiv = document.createElement('div');
        postDiv.classList.add('post-card');
        let imageHtml = imageFile ? `<img src="${URL.createObjectURL(imageFile)}" class="post-image">` : '';

        postDiv.innerHTML = `
            <div class="post-header">
                <div class="user-info">
                    <div class="avatar">Me</div>
                    <div>
                        <div class="username">我</div>
                        <div style="font-size: 12px; color: #666;">${timeString}</div>
                    </div>
                </div>
            </div>
            <div class="post-content"><p>${escapeHtml(text)}</p>${imageHtml}</div>
        `;
        feed.prepend(postDiv);

        // [觸發通知] 1. 彈出 Toast
        showToast('發文成功', '你的貼文已經發布到動態牆囉！', 'fa-solid fa-check');

        // [觸發通知] 2. 寫入通知頁面
        addNotificationToPage(`你成功發布了一則新貼文。`);
    }

    function escapeHtml(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});