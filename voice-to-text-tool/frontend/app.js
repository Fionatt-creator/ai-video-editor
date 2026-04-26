/**
 * 语音转文字工具 - 前端应用
 */

// API 基础地址
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : '';  // 生产环境使用相对路径

// 全局状态
let currentTaskId = null;
let statusCheckInterval = null;

// DOM 元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const progressSection = document.getElementById('progressSection');
const resultSection = document.getElementById('resultSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const fileName = document.getElementById('fileName');
const transcriptionText = document.getElementById('transcriptionText');
const summaryContent = document.getElementById('summaryContent');
const toast = document.getElementById('toast');

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadHistory();
});

function initEventListeners() {
    // 点击上传区域
    dropZone.addEventListener('click', () => fileInput.click());
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // 拖拽事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // 编辑按钮
    document.getElementById('editBtn').addEventListener('click', toggleEdit);
    
    // 导出按钮
    document.querySelectorAll('.dropdown-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            exportResult(link.dataset.format);
        });
    });
    
    // 生成摘要按钮
    document.getElementById('generateSummaryBtn').addEventListener('click', generateSummary);
}

// ===== 文件上传 =====
async function handleFileUpload(file) {
    // 检查文件类型
    const allowedTypes = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
        showToast('不支持的文件格式', 'error');
        return;
    }
    
    // 检查文件大小 (最大 500MB)
    if (file.size > 500 * 1024 * 1024) {
        showToast('文件太大，请上传小于 500MB 的文件', 'error');
        return;
    }
    
    // 显示进度区域
    uploadSection.style.display = 'none';
    progressSection.style.display = 'block';
    fileName.textContent = file.name;
    progressText.textContent = '正在上传...';
    progressFill.style.width = '30%';
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || '上传失败');
        }
        
        currentTaskId = data.task_id;
        progressFill.style.width = '50%';
        progressText.textContent = '正在转写中，请稍候...';
        
        // 开始轮询状态
        startStatusCheck();
        
    } catch (error) {
        console.error('上传错误:', error);
        showToast(error.message, 'error');
        resetUpload();
    }
}

// ===== 状态轮询 =====
function startStatusCheck() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
    
    statusCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/status/${currentTaskId}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || '获取状态失败');
            }
            
            updateProgress(data);
            
            if (data.status === 'completed') {
                clearInterval(statusCheckInterval);
                showResult(data);
                showToast('转写完成！', 'success');
                loadHistory();
            } else if (data.status === 'failed') {
                clearInterval(statusCheckInterval);
                throw new Error(data.error || '转写失败');
            }
            
        } catch (error) {
            console.error('状态检查错误:', error);
            clearInterval(statusCheckInterval);
            showToast(error.message, 'error');
            resetUpload();
        }
    }, 2000);  // 每2秒检查一次
}

function updateProgress(data) {
    const statusMap = {
        'pending': { width: '50%', text: '等待处理...' },
        'processing': { width: '75%', text: '正在转写中...' },
        'completed': { width: '100%', text: '转写完成' },
        'failed': { width: '100%', text: '转写失败' }
    };
    
    const status = statusMap[data.status] || statusMap['pending'];
    progressFill.style.width = status.width;
    progressText.textContent = status.text;
}

// ===== 显示结果 =====
function showResult(data) {
    progressSection.style.display = 'none';
    resultSection.style.display = 'block';
    
    transcriptionText.value = data.text || '';
    updateWordCount();
    
    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

function resetUpload() {
    progressSection.style.display = 'none';
    uploadSection.style.display = 'block';
    progressFill.style.width = '0%';
    fileInput.value = '';
    currentTaskId = null;
}

// ===== 标签页切换 =====
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    document.getElementById(`${tabName}Panel`).classList.add('active');
}

// ===== 编辑功能 =====
function toggleEdit() {
    const isReadonly = transcriptionText.hasAttribute('readonly');
    const editBtn = document.getElementById('editBtn');
    
    if (isReadonly) {
        transcriptionText.removeAttribute('readonly');
        transcriptionText.focus();
        editBtn.innerHTML = '<i class="fas fa-save"></i> 保存';
        showToast('现在可以编辑文本了', 'success');
    } else {
        transcriptionText.setAttribute('readonly', true);
        editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
        
        // 保存到服务器
        saveTranscription();
    }
}

async function saveTranscription() {
    if (!currentTaskId) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/save/${currentTaskId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcriptionText.value })
        });
        
        if (response.ok) {
            showToast('保存成功', 'success');
        }
    } catch (error) {
        console.error('保存失败:', error);
    }
}

// ===== 字数统计 =====
function updateWordCount() {
    const text = transcriptionText.value;
    const charCount = text.length;
    const wordCount = text.trim().split(/\s+/).filter(w => w).length;
    
    document.getElementById('charCount').textContent = charCount;
    document.getElementById('wordCount').textContent = wordCount;
}

transcriptionText.addEventListener('input', updateWordCount);

// ===== 生成摘要 =====
async function generateSummary() {
    if (!currentTaskId) return;
    
    const btn = document.getElementById('generateSummaryBtn');
    const type = document.getElementById('summaryType').value;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    
    summaryContent.innerHTML = `
        <div class="empty-state">
            <div class="spinner" style="width: 40px; height: 40px; border-width: 3px;"></div>
            <p>AI 正在分析内容...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/api/summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: currentTaskId,
                summary_type: type
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || '生成失败');
        }
        
        // 渲染摘要结果
        summaryContent.innerHTML = `
            <div class="summary-result">
                ${formatSummary(data.summary)}
            </div>
        `;
        
        showToast('摘要生成成功', 'success');
        
    } catch (error) {
        console.error('生成摘要错误:', error);
        summaryContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${error.message}</p>
            </div>
        `;
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> 生成摘要';
    }
}

function formatSummary(text) {
    // 将换行符转换为 <br>，将列表符号转换为 <ul><li>
    if (text.includes('•') || text.includes('-') || text.includes('*')) {
        const items = text.split(/[\n\r]+/).filter(line => line.trim());
        const listItems = items.map(item => {
            const cleanItem = item.replace(/^[•\-\*]\s*/, '').trim();
            return cleanItem ? `<li>${cleanItem}</li>` : '';
        }).join('');
        return `<ul>${listItems}</ul>`;
    }
    return text.replace(/\n/g, '<br>');
}

// ===== 导出功能 =====
async function exportResult(format) {
    if (!currentTaskId) return;
    
    showToast('正在准备导出...', 'success');
    
    try {
        const includeSummary = format === 'docx' || format === 'txt';
        
        const response = await fetch(`${API_BASE}/api/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: currentTaskId,
                format: format,
                include_summary: includeSummary
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '导出失败');
        }
        
        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcription_${currentTaskId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('导出成功', 'success');
        
    } catch (error) {
        console.error('导出错误:', error);
        showToast(error.message, 'error');
    }
}

// ===== 历史记录 =====
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/api/tasks`);
        const data = await response.json();
        
        const historyList = document.getElementById('historyList');
        
        if (!data.tasks || data.tasks.length === 0) {
            historyList.innerHTML = '<p style="color: #9ca3af; text-align: center;">暂无历史记录</p>';
            return;
        }
        
        // 只显示最近的5个任务
        const recentTasks = data.tasks.slice(-5).reverse();
        
        historyList.innerHTML = recentTasks.map(task => `
            <div class="history-item" data-task-id="${task.task_id}">
                <div class="history-item-info">
                    <i class="fas fa-file-audio"></i>
                    <span>任务 #${task.task_id}</span>
                </div>
                <div class="history-item-status">
                    <span class="status-badge status-${task.status}">${getStatusText(task.status)}</span>
                    ${task.status === 'completed' ? `
                        <button class="btn btn-secondary" onclick="loadTask('${task.task_id}')" style="padding: 6px 12px; font-size: 12px;">
                            查看
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('加载历史记录失败:', error);
    }
}

function getStatusText(status) {
    const map = {
        'pending': '等待中',
        'processing': '处理中',
        'completed': '已完成',
        'failed': '失败'
    };
    return map[status] || status;
}

async function loadTask(taskId) {
    try {
        const response = await fetch(`${API_BASE}/api/status/${taskId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
            currentTaskId = taskId;
            uploadSection.style.display = 'none';
            progressSection.style.display = 'none';
            resultSection.style.display = 'block';
            transcriptionText.value = data.text || '';
            updateWordCount();
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('加载任务失败:', error);
        showToast('加载失败', 'error');
    }
}

// ===== Toast 提示 =====
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
