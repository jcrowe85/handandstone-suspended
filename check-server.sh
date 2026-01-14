#!/bin/bash

# Server Check Script
# Run this on your server to check current configuration

echo "🔍 Checking Server Configuration"
echo "=================================="
echo ""

# Check Node.js
echo "📦 Node.js:"
if command -v node &> /dev/null; then
    echo "  ✅ Installed: $(node -v)"
else
    echo "  ❌ Not installed"
fi

# Check npm
echo ""
echo "📦 npm:"
if command -v npm &> /dev/null; then
    echo "  ✅ Installed: $(npm -v)"
else
    echo "  ❌ Not installed"
fi

# Check PM2
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

# Check Nginx
echo ""
echo "🌐 Nginx:"
if command -v nginx &> /dev/null; then
    echo "  ✅ Installed: $(nginx -v 2>&1)"
    echo ""
    echo "  Active sites:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "  No sites enabled"
else
    echo "  ❌ Not installed"
fi

# Check ports in use
echo ""
echo "🔌 Ports in use (3000-3010):"
netstat -tuln | grep -E ':(300[0-9]|3010)' || echo "  No apps on ports 3000-3010"

# Check current directory structure
echo ""
echo "📁 Current directory:"
pwd
echo ""
echo "📁 Contents:"
ls -la

# Check if app directory exists
echo ""
echo "🔍 Checking for handandstone-suspended:"
if [ -d "handandstone-suspended" ]; then
    echo "  ✅ Directory exists"
    cd handandstone-suspended
    echo "  📁 Location: $(pwd)"
    echo "  📦 Has package.json: $([ -f package.json ] && echo 'Yes' || echo 'No')"
    echo "  📦 Has server/: $([ -d server ] && echo 'Yes' || echo 'No')"
else
    echo "  ❌ Directory not found"
    echo "  💡 You may need to upload/clone the project first"
fi

echo ""
echo "✅ Check complete!"

