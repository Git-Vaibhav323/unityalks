#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYSCTL_CONF="${ROOT_DIR}/scripts/sysctl-production.conf"

echo "[1/4] Configuring open file limits..."
if [[ -w /etc/security/limits.conf ]]; then
  if ! rg -n "nofile" /etc/security/limits.conf >/dev/null 2>&1; then
    {
      echo "* soft nofile 65536"
      echo "* hard nofile 65536"
    } | sudo tee -a /etc/security/limits.conf >/dev/null
  fi
  echo "limits.conf updated (or already configured)."
else
  echo "Skipping /etc/security/limits.conf (no write access in this environment)."
fi

echo "[2/4] Applying sysctl production profile..."
if [[ -f "${SYSCTL_CONF}" ]]; then
  sudo sysctl -p "${SYSCTL_CONF}"
else
  echo "Missing ${SYSCTL_CONF}"
  exit 1
fi

echo "[3/4] Raising shell ulimit for current session..."
ulimit -n 65536 || true
echo "Current ulimit -n: $(ulimit -n)"

echo "[4/4] Reminder: set systemd and nginx limits..."
cat <<'EOF'
- In your systemd service:
  [Service]
  LimitNOFILE=65536

- In nginx.conf top-level:
  worker_rlimit_nofile 65536;
EOF
