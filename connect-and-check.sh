#!/bin/bash

# Script to connect to server and check configuration
SERVER="jcrowe@164.92.66.82"
PASSWORD="Jcrowe85!"

echo "🔍 Connecting to server and checking configuration..."
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "📦 Installing sshpass (needed for password authentication)..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install hudochenkov/sshpass/sshpass
        else
            echo "❌ Please install sshpass: brew install hudochenkov/sshpass/sshpass"
            exit 1
        fi
    else
        # Linux
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

echo "📡 Connecting to server..."
echo ""

# Run commands on remote server
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" << 'ENDSSH'
echo "=========================================="
echo "Server Configuration Check"
echo "=========================================="
echo ""

echo "📦 Node.js:"
if command -v node &> /dev/null; then
    echo "  ✅ $(node -v)"
else
    echo "  ❌ Not installed"
fi

echo ""
echo "📦 npm:"
if command -v npm &> /dev/null; then
    echo "  ✅ $(npm -v)"
else
    echo "  ❌ Not installed"
fi

echo ""
echo "🔄 PM2:"
if command -v pm2 &> /dev/null; then
    echo "  ✅ Installed: $(pm2 -v)"
    echo ""
    echo "  Current PM2 apps:"
    pm2 list
else
    echo "  ❌ Not installed"
fi

echo ""
echo "🌐 Nginx:"
if command -v nginx &> /dev/null; then
    echo "  ✅ Installed"
    echo ""
    echo "  Active sites:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "^total" || echo "  No sites enabled"
else
    echo "  ❌ Not installed"
fi

echo ""
echo "🔌 Ports in use (3000-3010):"
netstat -tuln 2>/dev/null | grep -E ':(300[0-9]|3010)' || echo "  No apps on ports 3000-3010"

echo ""
echo "📁 Current directory:"
pwd

echo ""
echo "📁 Home directory contents:"
ls -la ~ | head -20

echo ""
echo "✅ Check complete!"
ENDSSH

echo ""
echo "✅ Server check complete!"

