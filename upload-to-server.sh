#!/bin/bash

# Upload script to transfer project to server
# Run this from your local machine

SERVER="jcrowe@164.92.66.82"
REMOTE_DIR="~/handandstone-suspended"

echo "📤 Uploading Hand & Stone project to server..."
echo "Server: $SERVER"
echo ""

# Create a temporary directory excluding node_modules and dist
echo "📦 Preparing files for upload..."

# Use rsync to upload (excludes node_modules, dist, .git, etc.)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '*.log' \
  --exclude 'server/data/*.db' \
  --exclude '.DS_Store' \
  ./ $SERVER:$REMOTE_DIR/

echo ""
echo "✅ Upload complete!"
echo ""
echo "Next steps:"
echo "1. SSH into your server: ssh $SERVER"
echo "2. Navigate to: cd $REMOTE_DIR"
echo "3. Run: chmod +x setup-remote.sh && ./setup-remote.sh"
echo ""

