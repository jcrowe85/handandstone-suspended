# Deployment Guide for Ubuntu Digital Ocean VPS

This guide will help you deploy the Hand & Stone Suspended Members application to your Ubuntu Digital Ocean VPS.

## Prerequisites

- Ubuntu server (20.04 or later)
- Node.js 18+ and npm installed
- Domain name (optional, for production)
- Basic knowledge of Linux commands

## Step 1: Install Node.js

If Node.js is not installed:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

## Step 2: Clone/Upload Your Project

```bash
# If using git
git clone <your-repo-url>
cd handandstone-suspended

# Or upload files via SFTP/SCP
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Build the Frontend

```bash
npm run build
```

This creates the `dist` folder with production-ready frontend files.

## Step 5: Set Up Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
nano .env
```

Set the following:
```
PORT=3001
NODE_ENV=production
```

## Step 6: Set Up PM2 (Process Manager)

Install PM2 globally:
```bash
sudo npm install -g pm2
```

Create a PM2 ecosystem file (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'handandstone-app',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 7: Set Up Nginx (Reverse Proxy)

Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

Create Nginx configuration (`/etc/nginx/sites-available/handandstone`):

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/handandstone /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Set Up SSL (Optional but Recommended)

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

## Step 9: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 10: Database Location

The SQLite database will be created at:
```
server/data/handandstone.db
```

Make sure this directory exists and has proper permissions:
```bash
mkdir -p server/data
chmod 755 server/data
```

## Maintenance Commands

- View logs: `pm2 logs handandstone-app`
- Restart app: `pm2 restart handandstone-app`
- Stop app: `pm2 stop handandstone-app`
- View status: `pm2 status`

## Troubleshooting

1. **Port already in use**: Change PORT in `.env` file
2. **Database errors**: Check file permissions on `server/data/`
3. **API connection errors**: Verify `VITE_API_URL` matches your server URL
4. **Nginx 502 errors**: Check if the Node.js app is running (`pm2 status`)

## Updating the Application

```bash
# Pull latest changes
git pull

# Install new dependencies
npm install

# Rebuild frontend
npm run build

# Restart application
pm2 restart handandstone-app
```

## Backup Database

The database is located at `server/data/handandstone.db`. To backup:

```bash
cp server/data/handandstone.db server/data/handandstone.db.backup
```

Or set up automated backups with cron.

