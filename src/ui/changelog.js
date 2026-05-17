// src/ui/changelog.js

const ACCENT_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#9b59b6',
  '#e67e22', '#1abc9c', '#f39c12', '#e91e63',
];

let entries = [];

export async function loadChangelog() {
  try {
    const resp = await fetch('/changelog.json');
    entries = await resp.json();
    renderChangelog();
  } catch (e) {
    console.error('Failed to load changelog:', e);
  }
}

function renderChangelog() {
  const container = document.getElementById('changelog-entries');
  if (!container) return;

  container.innerHTML = '';

  const visible = entries.slice(-10).reverse();

  for (const entry of visible) {
    const color = ACCENT_COLORS[(entry.version - 1) % ACCENT_COLORS.length];
    const div = document.createElement('div');
    div.className = 'changelog-entry';
    div.style.borderLeftColor = color;
    div.innerHTML = `
      <span class="version">#${entry.version}</span>
      <span class="name"> — ${entry.name}:</span><br>
      <span class="desc">${entry.description}</span>
    `;
    container.appendChild(div);
  }
}
