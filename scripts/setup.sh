#!/usr/bin/env bash
set -e

echo "Updating apt package index..."
sudo apt-get update

echo "Installing base packages..."
sudo apt-get install -y nginx redis-server coturn curl gnupg ca-certificates lsb-release

echo "Installing Node.js 20.x from NodeSource..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs npm

echo "Installing PM2 globally..."
sudo npm install -g pm2

echo "Enabling coturn service toggle..."
sudo sed -i 's/^#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn || true
sudo sed -i 's/^TURNSERVER_ENABLED=0/TURNSERVER_ENABLED=1/' /etc/default/coturn || true

echo "Copying coturn config template..."
echo "Reminder: edit scripts/coturn.conf and set external-ip/static-auth-secret before using in production."
sudo cp scripts/coturn.conf /etc/turnserver.conf

echo "Creating 1GB swap at /swapfile..."
if [ ! -f /swapfile ]; then
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
fi
if ! grep -q "^/swapfile " /etc/fstab; then
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo "Applying sysctl tuning..."
sudo tee /etc/sysctl.d/99-unitalks.conf >/dev/null <<'EOF'
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
EOF
sudo sysctl --system

echo "Setting file descriptor limits..."
if ! grep -q "^\* soft nofile 65535" /etc/security/limits.conf; then
  echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf >/dev/null
fi
if ! grep -q "^\* hard nofile 65535" /etc/security/limits.conf; then
  echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf >/dev/null
fi

echo "Enabling and starting services..."
sudo systemctl enable redis-server coturn nginx
sudo systemctl restart redis-server
sudo systemctl restart coturn
sudo systemctl restart nginx

echo "Installing PM2 log rotation module..."
pm2 install pm2-logrotate || true

echo
echo "Setup complete."
echo "Run: cd server && npm install && npm run build && pm2 start ../pm2.config.js && pm2 save && pm2 startup"

