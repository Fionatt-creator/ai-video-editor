let selectedPath = null;

function renderTree(items, level = 0, container = document.getElementById('fileTree')) {
    items.forEach(item => {
        const li = document.createElement('li');
        li.style.paddingLeft = (level * 12 + 8) + 'px';
        li.className = 'tree-item';
        li.dataset.path = item.p;
        
        let toggle = '';
        if (item.d && item.c && item.c.length > 0) {
            toggle = `<span class="tree-toggle" onclick="toggleFolder(event, '${escapeHtml(item.p)}')">▶</span>`;
        } else {
            toggle = '<span style="width: 14px; display: inline-block;"></span>';
        }
        
        li.innerHTML = toggle + `<span class="tree-icon">${item.i}</span>` + escapeHtml(item.n);
        
        li.onclick = (e) => {
            if (!e.target.classList.contains('tree-toggle')) {
                selectItem(item);
            }
        };
        
        container.appendChild(li);
        
        if (item.d && item.c && item.c.length > 0) {
            const childrenContainer = document.createElement('ul');
            childrenContainer.className = 'tree-children';
            childrenContainer.id = 'children-' + item.p.replace(/[^a-zA-Z0-9]/g, '_');
            renderTree(item.c, level + 1, childrenContainer);
            container.appendChild(childrenContainer);
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleFolder(event, path) {
    event.stopPropagation();
    const containerId = 'children-' + path.replace(/[^a-zA-Z0-9]/g, '_');
    const container = document.getElementById(containerId);
    const toggle = event.target;
    
    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        toggle.textContent = '▶';
    } else {
        container.classList.add('expanded');
        toggle.textContent = '▼';
    }
}

function selectItem(item) {
    document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
    const el = document.querySelector(`[data-path="${CSS.escape(item.p)}"]`);
    if (el) el.classList.add('active');
    selectedPath = item.p;
    
    if (item.d) {
        showFolder(item);
    } else {
        showFile(item);
    }
}

function showFolder(item) {
    const content = document.getElementById('content');
    const childCount = item.c ? item.c.length : 0;
    
    let html = `
        <div class="preview-header">
            <div class="preview-title">${item.i} ${escapeHtml(item.n)}</div>
            <div class="preview-meta">${childCount} 个项目</div>
        </div>
        <div class="folder-grid">
    `;
    
    if (item.c) {
        item.c.forEach(child => {
            html += `
                <div class="folder-item" onclick="selectItemByPath('${escapeHtml(child.p)}')">
                    <span class="icon">${child.i}</span>
                    <span class="name">${escapeHtml(child.n)}</span>
                </div>
            `;
        });
    }
    
    html += '</div>';
    content.innerHTML = html;
}

function showFile(item) {
    const content = document.getElementById('content');
    const sizeText = item.s ? formatSize(item.s) : '';
    
    content.innerHTML = `
        <div class="preview-header">
            <div class="preview-title">${item.i} ${escapeHtml(item.n)}</div>
            <div class="preview-meta">${sizeText}</div>
        </div>
        <div style="padding: 40px; text-align: center; color: var(--text-muted);">
            <p style="font-size: 48px; margin-bottom: 16px;">${item.i}</p>
            <p>${escapeHtml(item.n)}</p>
            <p style="font-size: 12px; margin-top: 8px;">${sizeText}</p>
        </div>
    `;
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function selectItemByPath(path) {
    const item = findItem(FILE_TREE, path);
    if (item) selectItem(item);
}

function findItem(items, path) {
    for (let item of items) {
        if (item.p === path) return item;
        if (item.c) {
            const found = findItem(item.c, path);
            if (found) return found;
        }
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof FILE_TREE !== 'undefined') {
        renderTree(FILE_TREE);
    }
});
