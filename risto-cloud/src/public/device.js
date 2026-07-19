/**
 * Risto Dashboard — Device Detail
 * Polling: info + heartbeats cada 2s, timeline cada 3s, commands history cada 5s.
 */

const API_BASE = '/admin/api';
let deviceId = null;

let detailTimer = null;
let timelineTimer = null;
let commandsTimer = null;

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

// ── Detail + Heartbeats (cada 2s) ─────────────────────────
async function refreshDetail() {
  if (!deviceId) return;
  try {
    const detail = await fetchJSON(`${API_BASE}/devices/${deviceId}`);

    document.getElementById('deviceName').textContent = detail.hardwareId || detail.id;
    document.getElementById('deviceId').textContent = detail.id;
    document.getElementById('hardwareId').textContent = detail.hardwareId || '—';
    document.getElementById('model').textContent = detail.model || '—';
    document.getElementById('firmwareVersion').textContent = detail.firmwareVersion || '—';
    document.getElementById('lastIp').textContent = detail.lastIp || '—';
    document.getElementById('lastRssi').textContent = detail.lastRssi != null ? `${detail.lastRssi} dBm` : '—';
    document.getElementById('uptime').textContent = detail.uptime != null ? `${detail.uptime}s` : '—';
    document.getElementById('lastSeenAt').textContent = formatAgo(detail.lastSeenAt);
    document.getElementById('createdAt').textContent = formatTime(detail.createdAt);

    // Status dot
    const statusEl = document.getElementById('deviceStatus');
    if (detail.isOnline) {
      statusEl.innerHTML = '<span class="status-dot online"></span> Online';
    } else {
      statusEl.innerHTML = '<span class="status-dot offline"></span> Offline';
    }

    // Heartbeats
    const hbBody = document.getElementById('heartbeatTable');
    hbBody.innerHTML = '';
    for (const hb of detail.recentHeartbeats || []) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatTime(hb.receivedAt)}</td>
        <td>${hb.sequence}</td>
        <td>${hb.rssi ?? '—'}</td>
        <td>${hb.ip || '—'}</td>
        <td>${hb.uptime != null ? `${hb.uptime}s` : '—'}</td>
      `;
      hbBody.appendChild(row);
    }
  } catch (err) {
    console.error('Detail poll error:', err);
  }
}

// ── Timeline (cada 3s) ────────────────────────────────────
async function refreshTimeline() {
  if (!deviceId) return;
  try {
    const events = await fetchJSON(`${API_BASE}/devices/${deviceId}/events?limit=50`);
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    for (const ev of events) {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="time">${formatTime(ev.timestamp)}</span>
        <span class="type ${ev.type}">${ev.type}</span>
        <span class="label">${ev.label}</span>
        <span class="detail">${ev.detail || ''}</span>
      `;
      timeline.appendChild(li);
    }
  } catch (err) {
    console.error('Timeline poll error:', err);
  }
}

// ── Command History (cada 5s) ─────────────────────────────
async function refreshCommands() {
  if (!deviceId) return;
  try {
    const commands = await fetchJSON(`${API_BASE}/devices/${deviceId}/commands?limit=20`);
    const cmdBody = document.getElementById('commandTable');
    cmdBody.innerHTML = '';

    for (const cmd of commands) {
      const row = document.createElement('tr');
      const statusClass = cmd.status === 'completed' ? '' :
                          cmd.status === 'failed' ? 'offline' : '';
      row.innerHTML = `
        <td>${formatTime(cmd.createdAt)}</td>
        <td>${cmd.type}</td>
        <td class="${statusClass}">${cmd.status}</td>
        <td class="text-muted">${cmd.error || '—'}</td>
      `;
      cmdBody.appendChild(row);
    }
  } catch (err) {
    console.error('Commands poll error:', err);
  }
}

// ── Command execution ─────────────────────────────────────
async function sendCommand(type) {
  if (!deviceId) return;
  const statusEl = document.getElementById('commandStatus');
  statusEl.textContent = `Sending ${type}...`;
  try {
    const res = await fetch(`${API_BASE}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, type, payload: {} }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const cmd = await res.json();
    statusEl.textContent = `Command ${type}: ${cmd.status} (${cmd.id.slice(0, 8)}...)`;
    showToast(`Command ${type} created`, 'success');
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    showToast(`Failed to send ${type}: ${err.message}`, 'error');
  }
}

// ── Polling control ───────────────────────────────────────
function startPolling() {
  refreshDetail();
  refreshTimeline();
  refreshCommands();

  detailTimer = setInterval(refreshDetail, 2000);
  timelineTimer = setInterval(refreshTimeline, 3000);
  commandsTimer = setInterval(refreshCommands, 5000);
}

function stopPolling() {
  if (detailTimer) clearInterval(detailTimer);
  if (timelineTimer) clearInterval(timelineTimer);
  if (commandsTimer) clearInterval(commandsTimer);
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  deviceId = params.get('id');

  if (!deviceId) {
    document.getElementById('deviceName').textContent = 'No device ID specified';
    return;
  }

  // Command buttons
  document.querySelectorAll('[data-command]').forEach((btn) => {
    btn.addEventListener('click', () => sendCommand(btn.dataset.command));
  });

  startPolling();
});

window.addEventListener('beforeunload', stopPolling);
