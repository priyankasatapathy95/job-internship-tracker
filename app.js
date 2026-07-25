const API = '/api/applications';

let currentStatus = 'All';
let currentSearch = '';
let editingId = null;

const tableBody = document.getElementById('appTableBody');
const emptyState = document.getElementById('emptyState');
const statsEl = document.getElementById('stats');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const appForm = document.getElementById('appForm');

// ---- Fetch + render ----
async function loadApplications() {
  const params = new URLSearchParams();
  if (currentStatus !== 'All') params.set('status', currentStatus);
  if (currentSearch) params.set('search', currentSearch);

  const res = await fetch(`${API}?${params.toString()}`);
  const apps = await res.json();
  renderTable(apps);
  loadStats();
}

async function loadStats() {
  const res = await fetch('/api/stats');
  const { total, byStatus } = await res.json();

  const statuses = ['Applied', 'OA/Test', 'Interview', 'Offer', 'Rejected'];
  const counts = Object.fromEntries(statuses.map(s => [s, 0]));
  byStatus.forEach(row => counts[row.status] = row.count);

  statsEl.innerHTML = `
    <div class="stat-card" style="border-left-color: var(--ink)">
      <span class="num">${total}</span>
      <span class="label">Total</span>
    </div>
    ${statuses.map(s => `
      <div class="stat-card" style="border-left-color: var(--status-${s.replace('/', '\\/')})">
        <span class="num">${counts[s]}</span>
        <span class="label">${s}</span>
      </div>
    `).join('')}
  `;
}

function renderTable(apps) {
  if (apps.length === 0) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tableBody.innerHTML = apps.map(app => `
    <tr>
      <td data-label="Company"><strong>${escapeHtml(app.company)}</strong></td>
      <td data-label="Role">${escapeHtml(app.role)}</td>
      <td data-label="Status"><span class="status-pill status-${app.status.replace('/', '\\/')}">${app.status}</span></td>
      <td data-label="Date">${app.date_applied || '-'}</td>
      <td data-label="Link">${app.link ? `<a href="${escapeHtml(app.link)}" target="_blank" rel="noopener">View</a>` : '-'}</td>
      <td class="row-actions">
        <button onclick="openEditModal(${app.id})">Edit</button>
        <button onclick="deleteApp(${app.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Filters & search ----
document.getElementById('filters').addEventListener('click', (e) => {
  if (!e.target.classList.contains('filter-btn')) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  currentStatus = e.target.dataset.status;
  loadApplications();
});

let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = e.target.value.trim();
    loadApplications();
  }, 250);
});

// ---- Modal ----
document.getElementById('openAddModal').addEventListener('click', () => openAddModal());
document.getElementById('cancelModal').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Add Application';
  appForm.reset();
  document.getElementById('dateApplied').value = new Date().toISOString().split('T')[0];
  modalOverlay.classList.add('open');
}

async function openEditModal(id) {
  const res = await fetch(`${API}/${id}`);
  const app = await res.json();
  editingId = id;
  modalTitle.textContent = 'Edit Application';
  document.getElementById('company').value = app.company;
  document.getElementById('role').value = app.role;
  document.getElementById('status').value = app.status;
  document.getElementById('dateApplied').value = app.date_applied;
  document.getElementById('link').value = app.link || '';
  document.getElementById('notes').value = app.notes || '';
  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

appForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    company: document.getElementById('company').value,
    role: document.getElementById('role').value,
    status: document.getElementById('status').value,
    date_applied: document.getElementById('dateApplied').value,
    link: document.getElementById('link').value,
    notes: document.getElementById('notes').value,
  };

  if (editingId) {
    await fetch(`${API}/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } else {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  closeModal();
  loadApplications();
});

async function deleteApp(id) {
  if (!confirm('Delete this application?')) return;
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  loadApplications();
}

loadApplications();
