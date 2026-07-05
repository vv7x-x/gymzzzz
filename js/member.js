import { supabase } from './supabase.js';
import { getSubscriptionStatus, formatDate, calculateDaysRemaining, getMemberPhotoUrl, generateQR, downloadQR, printQR, sanitize } from './utils.js';

export async function loadMember(id) {
  if (!id) return null;
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export function renderMemberProfile(member) {
  if (!member) return;

  const status = getSubscriptionStatus(member.end_date);
  const days = calculateDaysRemaining(member.end_date);
  const isActive = status === 'active';
  const photo = getMemberPhotoUrl(member.photo_url);
  const initials = member.full_name
    ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const container = document.getElementById('profileContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="profile-container anim-fade-up">
      <div class="profile-card">
        <div class="profile-cover" role="presentation"></div>
        <div class="profile-header">
          <div class="profile-photo">
            ${member.photo_url
              ? `<img src="${sanitize(photo)}" alt="${sanitize(member.full_name)}" loading="lazy">`
              : `<div class="profile-photo-fallback" aria-hidden="true">${initials}</div>`}
          </div>
          <div class="profile-heading">
            <h1>${sanitize(member.full_name)}</h1>
            <div class="member-id">${sanitize(member.member_id || '')}</div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
              <span class="badge ${isActive ? 'badge-active' : 'badge-expired'} badge-lg">
                ${isActive ? 'Active' : 'Expired'}
              </span>
              ${days > 0 ? `<span class="badge badge-info badge-lg">${days} day${days !== 1 ? 's' : ''} left</span>` : ''}
            </div>
          </div>
        </div>

        <div class="profile-body">
          <div class="profile-info-grid">
            <div class="profile-info-item"><span class="label">Age</span><span class="value">${member.age || '-'}</span></div>
            <div class="profile-info-item"><span class="label">Phone</span><span class="value">${sanitize(member.phone) || '-'}</span></div>
            <div class="profile-info-item"><span class="label">Gender</span><span class="value">${sanitize(member.gender) || '-'}</span></div>
            <div class="profile-info-item"><span class="label">Weight</span><span class="value">${member.weight ? member.weight + ' kg' : '-'}</span></div>
            <div class="profile-info-item"><span class="label">Height</span><span class="value">${member.height ? member.height + ' cm' : '-'}</span></div>
            <div class="profile-info-item"><span class="label">Member Since</span><span class="value">${formatDate(member.created_at)}</span></div>
          </div>

          ${member.notes ? `
            <div class="profile-section">
              <h3><i class="bi bi-sticky" aria-hidden="true"></i> Notes</h3>
              <p style="font-size:var(--text-sm);color:var(--text-secondary);background:var(--bg-hover);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--border)">${sanitize(member.notes)}</p>
            </div>` : ''}

          <div class="profile-section">
            <h3><i class="bi bi-qr-code" aria-hidden="true"></i> QR Code</h3>
            <div class="qr-display" id="qrContainer"></div>
            <div class="qr-actions">
              <button class="btn btn-outline btn-sm" id="downloadQR"><i class="bi bi-download"></i> Download</button>
              <button class="btn btn-outline btn-sm" id="printQR"><i class="bi bi-printer"></i> Print</button>
            </div>
          </div>

          <div class="profile-actions">
            <a href="edit-member.html?id=${encodeURIComponent(member.id)}" class="btn btn-primary"><i class="bi bi-pencil"></i> Edit</a>
            <a href="members.html" class="btn btn-ghost"><i class="bi bi-arrow-left"></i> Back to Members</a>
          </div>
        </div>
      </div>
    </div>`;

  setupQRCode(member);
  setupEventListeners(member);
}

function setupQRCode(member) {
  const qrContainer = document.getElementById('qrContainer');
  if (qrContainer) {
    const qrData = member.member_id || member.id;
    generateQR(qrContainer, qrData);
  }
}

function setupEventListeners(member) {
  const qrContainer = document.getElementById('qrContainer');

  document.getElementById('downloadQR')?.addEventListener('click', () => {
    const canvas = qrContainer?.querySelector('canvas');
    downloadQR(canvas, `QR-${member.member_id || member.id}.png`);
  });

  document.getElementById('printQR')?.addEventListener('click', () => {
    const canvas = qrContainer?.querySelector('canvas');
    printQR(canvas);
  });
}
