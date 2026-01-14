# Deployment Guide with DuckDNS

This guide is specifically for deploying to an existing Ubuntu server with PM2 already running, using DuckDNS for the domain name.

## Prerequisites

- Ubuntu server with PM2 already installed and running other apps
- DuckDNS account and domain (e.g., `yourapp.duckdns.org`)
- SSH access to your server
- Node.js 18+ installed

## Step 1: Set Up DuckDNS Domain

1. Go to https://www.duckdns.org/ and sign in
2. Create a new domain (e.g., `handandstone`)
3. Your full domain will be: `handandstone.duckdns.org`
4. Note your token (you'll need it for the update script)

## Step 2: Configure DuckDNS Update Script

The DuckDNS update script keeps your domain pointing to your server's IP.

Create/update the DuckDNS update script:

```bash
# Create directory if it doesn't exist
mkdir -p ~/duckdns
cd ~/duckdns

# Create update script
nano duck.sh
```

Add this content (replace `YOUR_DOMAIN` and `YOUR_TOKEN`):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=YOUR_DOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

Make it executable:
```bash
chmod +x duck.sh
```

Test it:
```bash
./duck.sh
cat ~/duckdns/duck.log
```

If it says "OK", it's working!

## Step 3: Set Up Cron Job for DuckDNS Updates

```bash
crontab -e
```

Add this line to update DuckDNS every 5 minutes:
```
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

## Step 4: Upload Your Application

```bash
# Navigate to your apps directory (or wherever you keep your apps)
cd /path/to/your/apps  # Adjust this path

# Clone or upload your project
# If using git:
git clone <your-repo-url> handandstone-suspended
cd handandstone-suspended

# Or upload via SFTP/SCP to this location
```

## Step 5: Install Dependencies

```bash
cd handandstone-suspended
npm install
```

## Step 6: Build Frontend

```bash
npm run build
```

## Step 7: Create Environment File

```bash
nano .env
```

Add:
```
PORT=3001
NODE_ENV=production
```

## Step 8: Ensure Database Directory Exists

```bash
mkdir -p server/data
chmod 755 server/data
```

## Step 9: Add to PM2 (Safe - Won't Affect Other Apps)

The ecosystem.config.js is already configured to be isolated. To add this app to PM2:

```bash
cd /path/to/handandstone-suspended
pm2 start ecosystem.config.js
pm2 save
```

This will:
- Add the app with a unique name (`handandstone-app`)
- Not interfere with your existing PM2 apps
- Use its own log files in the project directory

Verify it's running:
```bash
pm2 list
pm2 logs handandstone-app
```

## Step 10: Configure Nginx (DuckDNS Specific)

If you don't have Nginx installed:
```bash
sudo apt update
sudo apt install nginx
```

Create a new Nginx configuration file (this won't affect existing configs):

```bash
sudo nano /etc/nginx/sites-available/handandstone
```

Add this configuration (replace `handandstone.duckdns.org` with your domain):

```nginx
server {
    listen 80;
    server_name handandstone.duckdns.org;

    # Increase body size limit for CSV uploads
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
        
        # Timeouts for large CSV uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/handandstone /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 11: Set Up SSL with Let's Encrypt (Recommended)

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

Get SSL certificate for DuckDNS domain:
```bash
sudo certbot --nginx -d handandstone.duckdns.org
```

Follow the prompts. Certbot will automatically update your Nginx config.

## Step 12: Configure Firewall (If Not Already Done)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

## Step 13: Update Frontend API URL (If Needed)

If your frontend needs to know the API URL, create/update `.env` in the project root:

```bash
nano .env
```

Add:
```
VITE_API_URL=https://handandstone.duckdns.org/api
```

Then rebuild:
```bash
npm run build
pm2 restart handandstone-app
```

## Verification

1. Check PM2: `pm2 list` - should see `handandstone-app`
2. Check Nginx: `sudo nginx -t` - should be OK
3. Check domain: Visit `https://handandstone.duckdns.org` in browser
4. Check logs: `pm2 logs handandstone-app`

## Troubleshooting

### PM2 Issues
- View logs: `pm2 logs handandstone-app`
- Restart: `pm2 restart handandstone-app`
- Stop: `pm2 stop handandstone-app`
- Remove: `pm2 delete handandstone-app`

### Nginx Issues
- Test config: `sudo nginx -t`
- Check error log: `sudo tail -f /var/log/nginx/error.log`
- Reload: `sudo systemctl reload nginx`

### Port Conflicts
If port 3001 is already in use, change it in `.env`:
```
PORT=3002
```
Then update Nginx config to use the new port.

### DuckDNS Not Updating
- Check cron: `crontab -l`
- Manually run: `~/duckdns/duck.sh`
- Check log: `cat ~/duckdns/duck.log`

## Maintenance Commands

```bash
# View app logs
pm2 logs handandstone-app

# Restart app
pm2 restart handandstone-app

# View all PM2 apps (to verify it's isolated)
pm2 list

# Backup database
cp server/data/handandstone.db server/data/handandstone.db.backup

# Update application
git pull
npm install
npm run build
pm2 restart handandstone-app
```

## Important Notes

- This setup is **isolated** - it won't affect your existing PM2 apps
- The app runs on port 3001 (change if needed)
- Database is at `server/data/handandstone.db`
- Logs are in `logs/` directory within the project
- DuckDNS updates automatically every 5 minutes

