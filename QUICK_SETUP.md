# Quick Setup Guide for Existing PM2 Server

This is a quick reference for setting up on your existing server without disrupting other apps.

## Prerequisites Checklist

- [ ] DuckDNS domain created (e.g., `handandstone.duckdns.org`)
- [ ] DuckDNS token noted
- [ ] SSH access to server
- [ ] Node.js 18+ installed
- [ ] PM2 already running (you have this!)

## Quick Setup Steps

### 1. Upload Project to Server

```bash
# On your server, navigate to where you keep apps
cd /path/to/your/apps
# Upload project here (git clone, SFTP, or SCP)
```

### 2. Run Setup Script

```bash
cd handandstone-suspended
chmod +x setup-remote.sh
./setup-remote.sh
```

This will:
- Install dependencies
- Build the frontend
- Create necessary directories
- Start the app with PM2 (isolated from your other apps)

### 3. Set Up DuckDNS Auto-Update

```bash
# Create DuckDNS update script
mkdir -p ~/duckdns
cd ~/duckdns
nano duck.sh
```

Paste (replace YOUR_DOMAIN and YOUR_TOKEN):
```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=YOUR_DOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x duck.sh
./duck.sh  # Test it

# Add to crontab
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/handandstone
```

Paste (replace `handandstone.duckdns.org` with your domain):
```nginx
server {
    listen 80;
    server_name handandstone.duckdns.org;
    client_max_body_size 10M;

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

```bash
sudo ln -s /etc/nginx/sites-available/handandstone /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Set Up SSL

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d handandstone.duckdns.org
```

### 6. Verify

```bash
# Check PM2
pm2 list  # Should see handandstone-app

# Check logs
pm2 logs handandstone-app

# Visit your domain
# https://handandstone.duckdns.org
```

## Port Configuration

The app runs on **port 3001** by default. If this conflicts with another app:

1. Edit `.env` file:
   ```
   PORT=3002  # or any available port
   ```

2. Update Nginx config to use the new port

3. Restart:
   ```bash
   pm2 restart handandstone-app
   sudo systemctl reload nginx
   ```

## Isolated PM2 Configuration

The app uses its own PM2 config (`ecosystem.config.js`) and won't interfere with your existing apps:
- Unique name: `handandstone-app`
- Own log files in project directory
- Independent restart/stop commands

## Common Commands

```bash
# View logs
pm2 logs handandstone-app

# Restart app
pm2 restart handandstone-app

# Stop app
pm2 stop handandstone-app

# View all apps (verify isolation)
pm2 list

# Backup database
cp server/data/handandstone.db server/data/handandstone.db.backup
```

## Troubleshooting

**App won't start:**
```bash
pm2 logs handandstone-app  # Check error logs
cd /path/to/handandstone-suspended
node server/index.js  # Test directly
```

**Nginx 502 error:**
```bash
pm2 list  # Verify app is running
sudo nginx -t  # Check Nginx config
sudo tail -f /var/log/nginx/error.log  # Check Nginx errors
```

**Port already in use:**
- Change PORT in `.env`
- Update Nginx config
- Restart both

## Need Help?

If you want me to help directly with SSH access, I can:
1. Connect and run the setup script
2. Configure Nginx
3. Set up DuckDNS
4. Verify everything works

Just provide SSH credentials and I'll handle it!

