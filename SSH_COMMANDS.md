# SSH Commands to Run on Your Server

Run these commands on your server to check settings and set up the app.

## 1. First, Check Your Current Setup

```bash
# Check Node.js version
node -v
npm -v

# Check PM2 and current apps
pm2 list

# Check Nginx status
sudo systemctl status nginx
ls -la /etc/nginx/sites-enabled/

# Check what ports are in use
netstat -tuln | grep -E ':(300[0-9]|3010)'

# Check current directory and where you want to install
pwd
ls -la
```

## 2. Upload the Project

You can either:

**Option A: Clone from Git (if you have a repo)**
```bash
cd ~  # or wherever you keep your apps
git clone <your-repo-url> handandstone-suspended
cd handandstone-suspended
```

**Option B: Upload via SCP from your local machine**
```bash
# From your LOCAL machine, run:
scp -r /Users/joshuacrowe/Desktop/web-projects/handandstone-suspended jcrowe@164.92.66.82:~/
```

**Option C: Use SFTP or upload manually**

## 3. Once Project is Uploaded, Run Setup

```bash
cd ~/handandstone-suspended  # or wherever you uploaded it
chmod +x setup-remote.sh
./setup-remote.sh
```

## 4. Check PM2 After Setup

```bash
pm2 list
pm2 logs handandstone-app
```

## 5. Set Up DuckDNS (if not already done)

```bash
# Create DuckDNS update script
mkdir -p ~/duckdns
cd ~/duckdns
nano duck.sh
```

Paste this (replace YOUR_DOMAIN and YOUR_TOKEN):
```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=YOUR_DOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod +x duck.sh
./duck.sh  # Test it
cat ~/duckdns/duck.log  # Should say "OK"

# Add to crontab
crontab -e
# Add this line:
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

## 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/handandstone
```

Paste this (replace `handandstone.duckdns.org` with your actual DuckDNS domain):
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
# Enable the site
sudo ln -s /etc/nginx/sites-available/handandstone /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 7. Set Up SSL

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d handandstone.duckdns.org
```

## 8. Verify Everything Works

```bash
# Check PM2
pm2 list
pm2 logs handandstone-app --lines 50

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Test the app
curl http://localhost:3001/api/auth/login
```

## Quick Troubleshooting

**If port 3001 is in use:**
```bash
# Find what's using it
sudo lsof -i :3001

# Change port in .env file
nano .env
# Change PORT=3001 to PORT=3002 (or another available port)
# Then update Nginx config and restart
pm2 restart handandstone-app
sudo systemctl reload nginx
```

**If PM2 app won't start:**
```bash
cd ~/handandstone-suspended
node server/index.js  # Test directly to see errors
```

**View logs:**
```bash
pm2 logs handandstone-app
tail -f logs/pm2-error.log
tail -f logs/pm2-out.log
```

