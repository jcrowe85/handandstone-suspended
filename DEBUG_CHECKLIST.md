# Debug Checklist - Run These Commands on Your Server

## Step 1: Verify File Structure
```bash
cd ~/handandstone-suspended
pwd  # Should be /home/jcrowe85/handandstone-suspended

# Check these files exist:
ls -la dist/index.html
ls -la server/index.js
ls -la server/data/
ls -la .env
```

## Step 2: Check Environment Variables
```bash
cat .env
# Should show:
# PORT=3001
# NODE_ENV=production
```

## Step 3: Verify Node.js Version
```bash
node -v
# Should be v20.x.x
```

## Step 4: Check Dependencies
```bash
npm list sqlite3 express
# Should show versions, not errors
```

## Step 5: Check PM2 Status
```bash
pm2 list
# handandstone-app should be "online"
pm2 logs handandstone-app --lines 5
# Should show "Server running on port 3001" without errors
```

## Step 6: Test Server Directly (Bypass PM2)
```bash
# Stop PM2 app
pm2 stop handandstone-app

# Run server directly to see errors
node server/index.js
# Leave this running, open another terminal

# In another terminal, test:
curl http://localhost:3001
# Press Ctrl+C in the first terminal to stop
```

## Step 7: Check Server Code
```bash
# Verify the catch-all route exists
cat server/index.js | grep -A 10 "Catch-all"
# Should show the catch-all handler
```

## Step 8: Test File Path
```bash
# Check if the path resolves correctly
node -e "
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const indexPath = join(__dirname, 'dist/index.html');
console.log('Path:', indexPath);
console.log('Exists:', existsSync(indexPath));
"
```

## Step 9: Check What's Actually Running
```bash
# See what process is listening on port 3001
sudo lsof -i :3001
# Should show node process
```

## Step 10: Test API Routes
```bash
# Test if API routes work
curl http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'
# Should return authentication error, not route error
```

## Common Issues Found:
- [ ] dist/index.html doesn't exist → Run `npm run build`
- [ ] sqlite3 not installed → Run `npm install`
- [ ] Wrong Node.js version → Use `nvm use 20`
- [ ] PM2 using wrong Node.js → Restart PM2 after Node.js upgrade
- [ ] .env file missing → Create it with PORT=3001
- [ ] Server code not updated → Check `git pull` worked

