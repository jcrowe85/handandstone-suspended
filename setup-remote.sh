#!/bin/bash

# Remote Server Setup Script for Hand & Stone App
# Run this script on your server to set up the application

set -e

echo "🚀 Hand & Stone Deployment Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Please don't run as root. Use a regular user with sudo privileges."
   exit 1
fi

# Get current directory
APP_DIR=$(pwd)
echo "📁 Application directory: $APP_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 is not installed globally. Installing..."
    npm install -g pm2
else
    echo "✅ PM2 is installed"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo ""
echo "🔨 Building frontend..."
npm run build

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p server/data
mkdir -p logs
chmod 755 server/data

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOF
PORT=3001
NODE_ENV=production
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Check if app is already running in PM2
if pm2 list | grep -q "handandstone-app"; then
    echo ""
    echo "⚠️  App is already running in PM2"
    read -p "Restart it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 restart handandstone-app
        echo "✅ App restarted"
    fi
else
    echo ""
    echo "🚀 Starting app with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    echo "✅ App started and saved to PM2"
fi

# Display PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 list | grep handandstone-app || echo "App not found in PM2 list"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure Nginx (see DEPLOYMENT_DUCKDNS.md)"
echo "2. Set up DuckDNS domain"
echo "3. Configure SSL with Let's Encrypt"
echo ""
echo "Useful commands:"
echo "  pm2 logs handandstone-app    - View logs"
echo "  pm2 restart handandstone-app  - Restart app"
echo "  pm2 stop handandstone-app     - Stop app"
echo ""

