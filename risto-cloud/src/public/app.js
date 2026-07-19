/**
 * Risto Dashboard — Device List + Pilot Status
 * Polling cada 10s para la lista, cada 10s para el summary.
 */

const API_BASE = '/admin/api';
let pollTimer = null;
let pilotTimerInterval = null;

// Pilot state
const pilot = {
  firstSeen: null,       // timestamp del primer heartbeat o boot
  heartbeatCount: 0,
  reconnectCount: 0,
  restartCount: 0,
  lastRssi: '—',
  started: false,
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

function formatAgo(iso) {
  if (!iso) return 'never';
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

function renderDeviceList(devices) {
  const container = document.getElementById('deviceList');
  container.innerHTML = '';

  if (devices.length === 0) {
    container.innerHTML = '<div class="card text-muted text-sm">No devices registered yet.</div>';
    return;
  }

  for (const d of devices) {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = `/device.html?id=${encodeURIComponent(d.id)}`;

    const statusDot = d.isOnline ? '🟢' : '🔴';
    const ago = formatAgo(d.lastSeenAt);

    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${statusDot} ${d.hardwareId || d.id}</span>
        <span class="text-muted text-sm">${ago}</span>
      </div>
      <dl class="card-meta">
        <dt>Firmware</dt><dd>${d.firmwareVersion || '—'}</dd>
        <dt>RSSI</dt><dd>${d.lastRssi ?? '—'}</dd>
        <dt>IP</dt><dd>${d.lastIp || '—'}</dd>
        <dt>Uptime</dt><dd>${d.uptime != null ? `${d.uptime}s` : '—'}</dd>
      </dl>
    `;

    container.appendChild(card);
  }
}

function renderSummary(summary) {
  document.getElementById('totalDevices').textContent = summary.devices;
  document.getElementById('onlineCount').textContent = summary.online;
  document.getElementById('offlineCount').textContent = summary.offline;
  document.getElementById('pendingCmd').textContent = summary.pendingCommands;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

function updatePilotTimer() {
  if (!pilot.firstSeen) return;
  const elapsed = Math.floor((Date.now() - pilot.firstSeen) / 1000);
  document.getElementById('pilotTimer').textContent = formatDuration(elapsed);
}

function updatePilotBanner(devices) {
  const banner = document.getElementById('pilotBanner');

  // Find first online device with events
  const onlineDevice = devices.find(d => d.isOnline);
  if (!onlineDevice) {
    banner.style.display = 'none';
    return;
  }

  // Show banner
  banner.style.display = 'flex';

  // Update RSSI from device list data
  if (onlineDevice.lastRssi != null) {
    pilot.lastRssi = `${onlineDevice.lastRssi} dBm`;
    document.getElementById('pilotRssi').textContent = pilot.lastRssi;
  }

  // Fetch timeline events to count heartbeats, reconnects, restarts
  fetchJSON(`${API_BASE}/devices/${encodeURIComponent(onlineDevice.id)}/events?limit=500`)
    .then(events => {
      if (!Array.isArray(events)) return;

      let hbCount = 0;
      let reCount = 0;
      let rsCount = 0;

      for (const ev of events) {
        const type = (ev.type || ev.eventType || '').toLowerCase();
        if (type === 'heartbeat') hbCount++;
        if (type.includes('reconnect') || type.includes('reconnect')) reCount++;
        if (type === 'boot' || type === 'restart' || type.includes('boot')) rsCount++;
      }

      // If first time seeing this device, establish pilot start
      if (!pilot.started && hbCount > 0) {
        // Find the first event timestamp
        const sorted = [...events].sort((a, b) =>
          new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp)
        );
        const first = sorted[0];
        if (first && (first.createdAt || first.timestamp)) {
          pilot.firstSeen = new Date(first.createdAt || first.timestamp).getTime();
          pilot.started = true;
          updatePilotTimer();
          // Start timer interval
          if (pilotTimerInterval) clearInterval(pilotTimerInterval);
          pilotTimerInterval = setInterval(updatePilotTimer, 1000);
        }
      }

      pilot.heartbeatCount = hbCount;
      pilot.reconnectCount = reCount;
      pilot.restartCount = rsCount;

      document.getElementById('pilotHeartbeats').textContent = hbCount;
      document.getElementById('pilotReconnects').textContent = reCount;
      document.getElementById('pilotRestarts').textContent = rsCount;
    })
    .catch(err => {
      console.error('Pilot events fetch error:', err);
    });
}

async function refresh() {
  try {
    const [devices, summary] = await Promise.all([
      fetchJSON(`${API_BASE}/devices`),
      fetchJSON(`${API_BASE}/summary`),
    ]);
    renderDeviceList(devices);
    renderSummary(summary);
    updatePilotBanner(devices);
  } catch (err) {
    console.error('Poll error:', err);
    showToast('Failed to fetch devices', 'error');
  }
}

function startPolling() {
  refresh();
  pollTimer = setInterval(refresh, 10000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

document.addEventListener('DOMContentLoaded', startPolling);
window.addEventListener('beforeunload', stopPolling);
