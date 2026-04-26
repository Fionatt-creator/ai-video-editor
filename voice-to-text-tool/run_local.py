#!/usr/bin/env python3
"""
语音转文字工具 - 本地启动脚本
提供静态文件服务 + API 服务
"""

import http.server
import socketserver
import threading
import os
import sys

# 端口配置
API_PORT = 8000
WEB_PORT = 8080

def start_api_server():
    """启动 FastAPI 后端"""
    print(f"🚀 启动 API 服务: http://localhost:{API_PORT}")
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, 'backend')
    
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=API_PORT, log_level="info")

def start_web_server():
    """启动静态文件服务"""
    print(f"🌐 启动 Web 服务: http://localhost:{WEB_PORT}")
    
    os.chdir('frontend')
    
    class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            super().end_headers()
    
    with socketserver.TCPServer(("", WEB_PORT), MyHTTPRequestHandler) as httpd:
        httpd.serve_forever()

def main():
    print("=" * 50)
    print("🎙️ 语音转文字工具 - 本地启动器")
    print("=" * 50)
    print()
    
    # 检查依赖
    try:
        import fastapi
        import funasr
    except ImportError:
        print("❌ 缺少依赖，请先安装:")
        print("   cd backend && pip install -r requirements.txt")
        sys.exit(1)
    
    # 创建必要目录
    os.makedirs('exports', exist_ok=True)
    os.makedirs('uploads', exist_ok=True)
    
    print("📁 目录结构检查完成")
    print()
    
    # 启动 API 服务（在线程中）
    api_thread = threading.Thread(target=start_api_server, daemon=True)
    api_thread.start()
    
    # 等待 API 启动
    import time
    time.sleep(2)
    
    print()
    print("=" * 50)
    print("✅ 服务启动完成！")
    print()
    print(f"🌍 Web 界面: http://localhost:{WEB_PORT}")
    print(f"📡 API 地址: http://localhost:{API_PORT}")
    print(f"📚 API 文档: http://localhost:{API_PORT}/docs")
    print()
    print("按 Ctrl+C 停止服务")
    print("=" * 50)
    print()
    
    # 启动 Web 服务（阻塞）
    try:
        start_web_server()
    except KeyboardInterrupt:
        print("\n\n🛑 服务已停止")
        sys.exit(0)

if __name__ == "__main__":
    main()
