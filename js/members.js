import { supabase } from './supabase.js';
import { getSubscriptionStatus, formatDate, calculateDaysRemaining, deletePhoto, getMemberPhotoUrl, sanitize, showToast, showConfirm } from './utils.js';

let allMembers = [];

export async function loadMembers() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { showToast(error.message, 'error'); return []; }
    allMembers = data || [];
    return allMembers;
  } catch (e) {
    showToast('Failed to load members', 'error');
    return [];
  }
}

export function getCachedMembers() {
  return allMembers;
}

export function renderMembers(members) {
  const container = document.getElementById('membersContainer');
  if (!container) return;

  if (!members || members.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-people"></i>
        <h3>No members found</h3>
        <p>Try a different search term or add your first member.</p>
        <a href="add-member.html" class="btn btn-primary">
          <i class="bi bi-person-plus"></i> Add Member
        </a>
      </div>`;
    return;
  }

  container.innerHTML = members.map((m, i) => {
    const status = getSubscriptionStatus(m.end_date);
    const days = calculateDaysRemaining(m.end_date);
    const photo = getMemberPhotoUrl(m.photo_url);
    const initials = m.full_name
      ? m.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : '?';
    const isActive = status === 'active';
    const statusLabel = isActive
      ? `${days} day${days !== 1 ? 's' : ''} left`
      : 'Expired';

    return `
      <div class="member-card anim-fade-up" style="animation-delay:${i * 0.05}s">
        <div class="member-card-top">
          <img src="${sanitize(photo)}"
               alt="${sanitize(m.full_name)}"
               loading="lazy"
               onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name || 'U')}&background=1e3a5f&color=fff&size=80'">
          <div class="member-card-info">
            <h4><a href="member.html?id=${encodeURIComponent(m.id)}" style="color:var(--text-primary)">${sanitize(m.full_name)}</a></h4>
            <span>${sanitize(m.member_id || '')}</span>
          </div>
          <span class="badge ${isActive ? 'badge-active' : 'badge-expired'}">${statusLabel}</span>
        </div>
        <div class="member-card-body">
          <div class="member-card-row"><span class="label">Phone</span><span class="value">${sanitize(m.phone) || '-'}</span></div>
          <div class="member-card-row"><span class="label">Age</span><span class="value">${m.age || '-'}</span></div>
          ${m.weight ? `<div class="member-card-row"><span class="label">Weight</span><span class="value">${m.weight} kg</span></div>` : ''}
          ${m.height ? `<div class="member-card-row"><span class="label">Height</span><span class="value">${m.height} cm</span></div>` : ''}
          <div class="member-card-row"><span class="label">End Date</span><span class="value">${m.end_date ? formatDate(m.end_date) : '-'}</span></div>
        </div>
        <div class="member-card-actions">
          <a href="member.html?id=${encodeURIComponent(m.id)}" class="btn btn-sm btn-ghost"><i class="bi bi-eye"></i> View</a>
          <a href="edit-member.html?id=${encodeURIComponent(m.id)}" class="btn btn-sm btn-ghost"><i class="bi bi-pencil"></i> Edit</a>
          <button class="btn btn-sm btn-ghost delete-member" data-id="${m.id}" data-name="${sanitize(m.full_name)}" style="color:var(--danger)" aria-label="Delete ${sanitize(m.full_name)}"><i class="bi bi-trash"></i></button>
        </div>
      </div>`;
  }).join('');

  attachMemberEvents();
}

function attachMemberEvents() {
  document.querySelectorAll('.delete-member').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const confirmed = await showConfirm(
        'Delete Member',
        `Are you sure you want to delete "${name}"? This cannot be undone.`
      );
      if (!confirmed) return;

      try {
        const member = allMembers.find(m => m.id === id);
        if (member?.photo_url) {
          await deletePhoto(member.photo_url).catch(() => {});
        }
        await supabase.from('members').delete().eq('id', id);
        showToast('Member deleted successfully');
        allMembers = allMembers.filter(m => m.id !== id);
        applyFilters();
      } catch (e) {
        showToast('Failed to delete member', 'error');
      }
    });
  });
}

export function applyFilters() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('statusFilter')?.value || 'all';

  let filtered = [...allMembers];

  if (search) {
    filtered = filtered.filter(m =>
      (m.full_name || '').toLowerCase().includes(search) ||
      (m.phone || '').includes(search) ||
      (m.member_id || '').toLowerCase().includes(search)
    );
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter(m => {
      const status = getSubscriptionStatus(m.end_date);
      if (statusFilter === 'active') return status === 'active' || status === 'expiring_soon';
      if (statusFilter === 'expiring_soon') return status === 'expiring_soon';
      if (statusFilter === 'expired') return status === 'expired';
      return true;
    });
  }

  renderMembers(filtered);
}
