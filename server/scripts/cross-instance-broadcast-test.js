#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');

const ROOT = path.resolve(__dirname, '..');
const ROOM_ID = `room-${Date.now()}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(port, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`http://localhost:${port}/health`);
      if (res.ok) return;
    } catch (_err) {
      // retry
    }
    await wait(500);
  }
  throw new Error(`Server on port ${port} did not become healthy`);
}

async function getToken(port) {
  const response = await fetch(`http://localhost:${port}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Token fetch failed for :${port} with status ${response.status}`);
  }
  const data = await response.json();
  if (!data.token) {
    throw new Error(`Missing token in response for :${port}`);
  }
  return data.token;
}

function connectClient(port, token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws?token=${encodeURIComponent(token)}`);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function startInstance(port, instanceId) {
  return spawn('npm', ['run', 'dev'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      INSTANCE_ID: instanceId,
      JWT_SECRET: process.env.JWT_SECRET || 'change-me-dev-secret',
      TURN_SECRET: process.env.TURN_SECRET || 'change-me-turn-secret',
    },
    stdio: 'inherit',
  });
}

async function run() {
  const instanceA = startInstance(8080, 'itest-a');
  const instanceB = startInstance(8081, 'itest-b');
  const children = [instanceA, instanceB];

  try {
    await waitForHealth(8080);
    await waitForHealth(8081);

    const tokenA = await getToken(8080);
    const tokenB = await getToken(8081);

    const clientA = await connectClient(8080, tokenA);
    const clientB = await connectClient(8081, tokenB);

    const received = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for cross-instance broadcast')), 5000);
      clientB.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'test-broadcast' && msg.data === 'hello-from-a') {
          clearTimeout(timer);
          resolve();
        }
      });
    });

    clientA.send(JSON.stringify({ type: 'test-join-room', roomId: ROOM_ID }));
    clientB.send(JSON.stringify({ type: 'test-join-room', roomId: ROOM_ID }));
    await wait(200);
    clientA.send(JSON.stringify({ type: 'test-broadcast', roomId: ROOM_ID, data: 'hello-from-a' }));

    await received;
    console.log('Cross-instance broadcast test passed.');

    clientA.close();
    clientB.close();
  } finally {
    for (const child of children) {
      child.kill('SIGTERM');
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
