#!/bin/bash

# Interactive setup script - run this and it will guide you through SSH connection
SERVER="jcrowe@164.92.66.82"

echo "🚀 Hand & Stone Server Setup"
echo "=============================="
echo ""
echo "This script will help you set up the application on your server."
echo "You'll need to enter your SSH password when prompted."
echo ""
read -p "Press Enter to continue..."

echo ""
echo "📤 Step 1: Uploading project files to server..."
echo ""

# Upload files using rsync (will prompt for password)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '*.log' \
  --exclude 'server/data/*.db' \
  --exclude '.DS_Store' \
  ./ "$SERVER:~/handandstone-suspended/"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Files uploaded successfully!"
    echo ""
    echo "📡 Step 2: Connecting to server to run setup..."
    echo ""
    
    # Connect and run setup commands
    ssh "$SERVER" << 'ENDSSH'
cd ~/handandstone-suspended

echo "=========================================="
echo "Server Configuration"
echo "=========================================="
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    echo "  ✅ Node.js: $(node -v)"
    echo "  ✅ npm: $(npm -v)"
else
    echo "  ❌ Node.js not installed"
    exit 1
fi

# Check PM2
echo ""
echo "🔄 Checking PM2..."
if command -v pm2 &> /dev/null; then
    echo "  ✅ PM2 installed: $(pm2 -v)"
    echo ""
    echo "  Current PM2 apps:"
    pm2 list
else
    echo "  ❌ PM2 not installed"
    exit 1
fi

# Check ports
echo ""
echo "🔌 Checking ports..."
netstat -tuln 2>/dev/null | grep -E ':(300[0-9]|3010)' || echo "  ✅ Ports 3000-3010 are available"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo ""
echo "🔨 Building frontend..."
npm run build

# Create directories
echo ""
echo "📁 Creating directories..."
mkdir -p server/data
mkdir -p logs
chmod 755 server/data

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOF
PORT=3001
NODE_ENV=production
EOF
fi

# Start with PM2
echo ""
echo "🚀 Starting application with PM2..."
if pm2 list | grep -q "handandstone-app"; then
    echo "  App already exists, restarting..."
    pm2 restart handandstone-app
else
    chmod +x setup-remote.sh
    pm2 start ecosystem.config.js
    pm2 save
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 PM2 Status:"
pm2 list | grep handandstone-app

echo ""
echo "📋 Next steps:"
echo "1. Configure Nginx (see DEPLOYMENT_DUCKDNS.md)"
echo "2. Set up DuckDNS domain"
echo "3. Configure SSL"
ENDSSH

else
    echo ""
    echo "❌ Upload failed. Please check your SSH connection."
    exit 1
fi

echo ""
echo "✅ All done!"

