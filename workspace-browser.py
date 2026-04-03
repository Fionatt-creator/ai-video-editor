#!/usr/bin/env python3
"""
OpenClaw Workspace 文件浏览器
访问地址: http://localhost:8080
"""

import os
import json
import mimetypes
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import urllib.request

WORKSPACE = "/root/.openclaw/workspace"
PORT = 8080

HTML_TEMPLATE = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace 文件浏览器</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            min-height: 100vh;
        }
        .header {
            background: #161b22;
            border-bottom: 1px solid #30363d;
            padding: 16px 24px;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .header h1 {
            font-size: 18px;
            font-weight: 600;
            color: #f0f6fc;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .breadcrumb {
            padding: 12px 24px;
            background: #0d1117;
            border-bottom: 1px solid #21262d;
            font-size: 14px;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px;
        }
        .breadcrumb a {
            color: #58a6ff;
            text-decoration: none;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
        }
        .breadcrumb a:hover {
            background: #388bfd26;
        }
        .breadcrumb span {
            color: #8b949e;
        }
        .container {
            padding: 0;
            max-width: 1200px;
            margin: 0 auto;
        }
        .file-list {
            list-style: none;
        }
        .file-item {
            display: flex;
            align-items: center;
            padding: 12px 24px;
            border-bottom: 1px solid #21262d;
            transition: background 0.15s;
            cursor: pointer;
        }
        .file-item:hover {
            background: #161b22;
        }
        .file-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        .file-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .file-name {
            font-size: 14px;
            color: #f0f6fc;
            font-weight: 500;
        }
        .file-meta {
            font-size: 12px;
            color: #8b949e;
        }
        .file-size {
            font-size: 13px;
            color: #8b949e;
            font-family: monospace;
        }
        .empty-state {
            text-align: center;
            padding: 80px 24px;
            color: #8b949e;
        }
        .preview-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            flex-direction: column;
        }
        .preview-modal.active {
            display: flex;
        }
        .preview-header {
            background: #161b22;
            border-bottom: 1px solid #30363d;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .preview-title {
            font-size: 14px;
            font-weight: 500;
        }
        .preview-close {
            background: #21262d;
            border: 1px solid #30363d;
            color: #c9d1d9;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
        }
        .preview-close:hover {
            background: #30363d;
        }
        .preview-content {
            flex: 1;
            overflow: auto;
            padding: 24px;
        }
        .preview-text {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-all;
            max-width: 900px;
            margin: 0 auto;
        }
        .stats {
            background: #161b22;
            border-bottom: 1px solid #21262d;
            padding: 8px 24px;
            font-size: 12px;
            color: #8b949e;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📁 Workspace 文件浏览器</h1>
    </div>
    
    <div class="breadcrumb" id="breadcrumb"></div>
    
    <div class="stats" id="stats"></div>
    
    <div class="container">
        <ul class="file-list" id="fileList"></ul>
    </div>
    
    <div class="preview-modal" id="previewModal">
        <div class="preview-header">
            <span class="preview-title" id="previewTitle">文件预览</span>
            <button class="preview-close" onclick="closePreview()">关闭</button>
        </div>
        <div class="preview-content">
            <pre class="preview-text" id="previewContent"></pre>
        </div>
    </div>

    <script>
        let currentPath = '';
        
        function renderBreadcrumb(path) {
            const parts = path.split('/').filter(p => p);
            let html = '<a href="#/">📁 root</a>';
            let buildPath = '';
            
            parts.forEach((part, i) => {
                buildPath += '/' + part;
                html += '<span>/</span>';
                if (i === parts.length - 1) {
                    html += `<span>${escapeHtml(part)}</span>`;
                } else {
                    html += `<a href="#${buildPath}">${escapeHtml(part)}</a>`;
                }
            });
            
            document.getElementById('breadcrumb').innerHTML = html;
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
        }
        
        function formatDate(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleString('zh-CN');
        }
        
        function getFileIcon(name, isDir) {
            if (isDir) return '📁';
            if (name.endsWith('.md')) return '📝';
            if (name.endsWith('.py')) return '🐍';
            if (name.endsWith('.js')) return '📜';
            if (name.endsWith('.json')) return '📋';
            if (name.endsWith('.html') || name.endsWith('.htm')) return '🌐';
            if (name.endsWith('.css')) return '🎨';
            if (name.endsWith('.yml') || name.endsWith('.yaml')) return '⚙️';
            if (name.endsWith('.sh')) return '⌨️';
            if (name.endsWith('.txt')) return '📄';
            if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.gif')) return '🖼️';
            if (name.endsWith('.pdf')) return '📕';
            if (name.endsWith('.zip') || name.endsWith('.tar') || name.endsWith('.gz')) return '📦';
            return '📄';
        }
        
        async function loadFiles(path = '') {
            currentPath = path;
            renderBreadcrumb(path);
            
            try {
                const response = await fetch('/api/files?path=' + encodeURIComponent(path));
                const data = await response.json();
                
                const listEl = document.getElementById('fileList');
                
                if (data.files.length === 0) {
                    listEl.innerHTML = '<div class="empty-state">📂 这个文件夹是空的</div>';
                    document.getElementById('stats').textContent = '0 个项目';
                    return;
                }
                
                let html = '';
                
                // 返回上级
                if (path) {
                    const parentPath = path.split('/').slice(0, -1).join('/');
                    html += `
                        <li class="file-item" onclick="loadFiles('${parentPath}')">
                            <div class="file-icon">⬆️</div>
                            <div class="file-info">
                                <div class="file-name">..</div>
                                <div class="file-meta">返回上级目录</div>
                            </div>
                        </li>
                    `;
                }
                
                // 文件夹
                data.files.filter(f => f.is_dir).forEach(file => {
                    html += `
                        <li class="file-item" onclick="loadFiles('${escapeHtml(file.path)}')">
                            <div class="file-icon">${getFileIcon(file.name, true)}</div>
                            <div class="file-info">
                                <div class="file-name">${escapeHtml(file.name)}</div>
                                <div class="file-meta">${formatDate(file.mtime)}</div>
                            </div>
                        </li>
                    `;
                });
                
                // 文件
                data.files.filter(f => !f.is_dir).forEach(file => {
                    html += `
                        <li class="file-item" onclick="previewFile('${escapeHtml(file.path)}', '${escapeHtml(file.name)}')">
                            <div class="file-icon">${getFileIcon(file.name, false)}</div>
                            <div class="file-info">
                                <div class="file-name">${escapeHtml(file.name)}</div>
                                <div class="file-meta">${formatDate(file.mtime)}</div>
                            </div>
                            <div class="file-size">${formatSize(file.size)}</div>
                        </li>
                    `;
                });
                
                listEl.innerHTML = html;
                
                const dirCount = data.files.filter(f => f.is_dir).length;
                const fileCount = data.files.filter(f => !f.is_dir).length;
                document.getElementById('stats').textContent = 
                    `${dirCount} 个文件夹, ${fileCount} 个文件`;
                    
            } catch (err) {
                document.getElementById('fileList').innerHTML = 
                    `<div class="empty-state">❌ 加载失败: ${escapeHtml(err.message)}</div>`;
            }
        }
        
        async function previewFile(path, name) {
            try {
                const response = await fetch('/api/file?path=' + encodeURIComponent(path));
                const data = await response.json();
                
                document.getElementById('previewTitle').textContent = '📄 ' + name;
                document.getElementById('previewContent').textContent = data.content;
                document.getElementById('previewModal').classList.add('active');
            } catch (err) {
                alert('无法预览文件: ' + err.message);
            }
        }
        
        function closePreview() {
            document.getElementById('previewModal').classList.remove('active');
        }
        
        // 监听 hash 变化
        window.addEventListener('hashchange', () => {
            const path = window.location.hash.slice(1) || '';
            loadFiles(path);
        });
        
        // 初始化
        loadFiles(window.location.hash.slice(1) || '');
    </script>
</body>
</html>'''

class FileHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # 静默日志
    
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        
        if path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode('utf-8'))
            
        elif path == '/api/files':
            rel_path = query.get('path', [''])[0]
            full_path = os.path.join(WORKSPACE, rel_path.lstrip('/'))
            
            # 安全检查
            if not full_path.startswith(WORKSPACE):
                self.send_error(403, "Access denied")
                return
            
            try:
                files = []
                for entry in os.scandir(full_path):
                    stat = entry.stat()
                    files.append({
                        'name': entry.name,
                        'path': os.path.join(rel_path, entry.name).lstrip('/'),
                        'is_dir': entry.is_dir(),
                        'size': stat.st_size,
                        'mtime': stat.st_mtime
                    })
                
                files.sort(key=lambda x: (not x['is_dir'], x['name'].lower()))
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'files': files}).encode())
                
            except Exception as e:
                self.send_error(500, str(e))
                
        elif path == '/api/file':
            rel_path = query.get('path', [''])[0]
            full_path = os.path.join(WORKSPACE, rel_path.lstrip('/'))
            
            if not full_path.startswith(WORKSPACE):
                self.send_error(403, "Access denied")
                return
            
            try:
                with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'content': content}).encode())
                
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)

def run():
    server = HTTPServer(('0.0.0.0', PORT), FileHandler)
    print(f"🚀 文件浏览器已启动")
    print(f"📂 根目录: {WORKSPACE}")
    print(f"🌐 访问地址: http://localhost:{PORT}")
    print(f"   或: http://127.0.0.1:{PORT}")
    print("\n按 Ctrl+C 停止服务")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n已停止")
        server.shutdown()

if __name__ == '__main__':
    run()
