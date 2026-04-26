#!/bin/bash

# 语音转文字工具 - 启动脚本

set -e

echo "🎙️ 语音转文字工具 - 启动脚本"
echo "=============================="

# 检查 Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        echo "   安装指南: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    echo "✅ Docker 检查通过"
}

# 启动服务
start_service() {
    echo ""
    echo "🚀 正在启动服务..."
    
    # 创建必要的目录
    mkdir -p exports uploads
    
    # 构建并启动
    docker-compose up --build -d
    
    echo ""
    echo "⏳ 等待服务启动..."
    sleep 5
    
    # 检查健康状态
    echo "🔍 检查服务状态..."
    if curl -s http://localhost:8080/health > /dev/null; then
        echo ""
        echo "✅ 服务启动成功！"
        echo ""
        echo "📱 访问地址:"
        echo "   • Web 界面: http://localhost:8080"
        echo "   • API 文档: http://localhost:8080/docs"
        echo ""
        echo "🛑 停止服务: docker-compose down"
        echo "📊 查看日志: docker-compose logs -f"
    else
        echo ""
        echo "⚠️ 服务可能还在启动中，请稍后再试"
        echo "📊 查看日志: docker-compose logs -f"
    fi
}

# 停止服务
stop_service() {
    echo "🛑 正在停止服务..."
    docker-compose down
    echo "✅ 服务已停止"
}

# 显示帮助
show_help() {
    echo "用法: ./start.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start   启动服务（默认）"
    echo "  stop    停止服务"
    echo "  restart 重启服务"
    echo "  logs    查看日志"
    echo "  status  查看状态"
    echo ""
}

# 查看状态
show_status() {
    echo "📊 服务状态:"
    docker-compose ps
    echo ""
    
    if curl -s http://localhost:8080/health > /dev/null; then
        echo "✅ API 服务运行正常"
    else
        echo "❌ API 服务未响应"
    fi
}

# 查看日志
show_logs() {
    docker-compose logs -f
}

# 主逻辑
case "${1:-start}" in
    start)
        check_docker
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        sleep 2
        check_docker
        start_service
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "未知命令: $1"
        show_help
        exit 1
        ;;
esac
