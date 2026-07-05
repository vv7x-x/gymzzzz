import { supabase } from './supabase.js';
import { STORAGE_BUCKET } from './config.js';

const STORAGE_KEY = 'gymos_prefs';

function getPrefs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function getUILang() {
  return getPrefs().lang || 'en';
}

export function sanitize(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export function escapeHtml(str) {
  return sanitize(str);
}

export function formatDate(dateStr, lang) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const l = lang || getUILang();
  return d.toLocaleDateString(l === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export function formatDateISO(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function formatCurrency(amount, currency) {
  const curr = currency || getPrefs().currency || 'EGP';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 2
  }).format(amount || 0);
}

export function calculateEndDate(startDate, durationDays) {
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + (durationDays || 0));
  return d.toISOString().split('T')[0];
}

export function calculateDaysRemaining(endDate) {
  if (!endDate) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  if (isNaN(end.getTime())) return 0;
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

export function getSubscriptionStatus(endDate) {
  const days = calculateDaysRemaining(endDate);
  if (days <= 0) return 'expired';
  if (days <= 7) return 'expiring_soon';
  return 'active';
}

export function getStatus(endDate) {
  return getSubscriptionStatus(endDate);
}

export function getStatusLabel(status) {
  const labels = {
    active: 'Active',
    expiring_soon: 'Expiring Soon',
    expired: 'Expired'
  };
  return labels[status] || status || 'Unknown';
}

export function getStatusBadgeClass(status) {
  const classes = {
    active: 'badge-active',
    expiring_soon: 'badge-expiring',
    expired: 'badge-expired'
  };
  return classes[status] || 'badge-info';
}

export function generateMemberId() {
  const prefix = 'GYM';
  const num = String(Math.floor(100000 + Math.random() * 900000));
  return `${prefix}${num}`;
}

export function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getMemberPhotoUrl(url) {
  return url || `https://ui-avatars.com/api/?name=U&background=1e3a5f&color=fff&size=200`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export async function uploadPhoto(file) {
  if (!file) return null;
  try {
    const ext = file.name.split('.').pop();
    const path = `photos/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return publicUrl;
  } catch (e) {
    console.error('Upload failed:', e.message);
    return null;
  }
}

export async function deletePhoto(url) {
  if (!url) return;
  try {
    const parts = url.split('/');
    const path = parts.slice(parts.indexOf(STORAGE_BUCKET) + 1).join('/');
    if (path) {
      const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      if (error) console.error('Failed to delete photo:', error.message);
    }
  } catch (e) {
    console.error('Delete photo failed:', e.message);
  }
}

export function getPhotoFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) return null;
  if (file.size > 5 * 1024 * 1024) {
    showToast('Photo must be less than 5MB', 'error');
    return null;
  }
  return file;
}

export function showToast(message, type) {
  if (!message) return;
  const t = type || 'success';
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(container);
  }
  const icons = {
    success: 'bi-check-circle',
    error: 'bi-exclamation-circle',
    warning: 'bi-exclamation-triangle',
    info: 'bi-info-circle'
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${t}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<i class="bi ${icons[t] || icons.info}"></i> ${sanitize(message)}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

export function showLoading(btn, text) {
  if (!btn) return '';
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> ${sanitize(text || 'Loading...')}`;
  return original;
}

export function hideLoading(btn, originalHtml) {
  if (!btn) return;
  btn.disabled = false;
  if (originalHtml) btn.innerHTML = originalHtml;
}

export function showConfirm(title, message, type) {
  const t = type || 'danger';
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', title);
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-body">
          <div class="confirm-dialog ${t}">
            <i class="bi ${t === 'danger' ? 'bi-exclamation-triangle' : 'bi-question-circle'}" aria-hidden="true"></i>
            <h3>${sanitize(title)}</h3>
            <p>${sanitize(message)}</p>
            <div class="confirm-actions">
              <button class="btn btn-ghost" id="confirmCancel" type="button">Cancel</button>
              <button class="btn ${t === 'danger' ? 'btn-danger' : 'btn-primary'}" id="confirmOk" type="button">Confirm</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const cancelBtn = overlay.querySelector('#confirmCancel');
    const okBtn = overlay.querySelector('#confirmOk');
    const cleanup = (result) => { overlay.remove(); resolve(result); };
    cancelBtn.addEventListener('click', () => cleanup(false));
    okBtn.addEventListener('click', () => cleanup(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { cleanup(false); document.removeEventListener('keydown', handler); }
    });
    okBtn.focus();
  });
}

export function showModal(title, contentHtml, options) {
  const opts = options || {};
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', title);
  overlay.innerHTML = `
    <div class="modal ${opts.large ? 'modal-lg' : ''}">
      <div class="modal-header">
        <h3 id="modalTitle">${sanitize(title)}</h3>
        <button class="modal-close" id="modalCloseBtn" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">${contentHtml}</div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { overlay.remove(); if (opts.onClose) opts.onClose(); };
  overlay.querySelector('#modalCloseBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
  });
  const firstInput = overlay.querySelector('input, select, textarea, button');
  if (firstInput) firstInput.focus();
  return { overlay, close };
}

export function debounce(fn, delay) {
  let timer;
  const d = delay || 300;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), d);
  };
}

export function generateQR(container, data, size) {
  if (!container || !data) return;
  const s = size || 180;
  if (typeof QRCode !== 'undefined') {
    container.innerHTML = '';
    new QRCode(container, {
      text: String(data),
      width: s,
      height: s,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

export function downloadQR(canvas, filename) {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename || 'qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function printQR(canvas) {
  if (!canvas) return;
  const win = window.open('');
  if (win) {
    win.document.write(`<img src="${canvas.toDataURL('image/png')}" onload="window.print();window.close()">`);
  }
}

export function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  if (!phone) return false;
  return /^[+\d\s\-()]{7,20}$/.test(phone);
}

export function validateRequired(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function getErrorMessage(error) {
  if (!error) return 'An unexpected error occurred';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return 'An unexpected error occurred';
}

export function safeAsync(fn, fallback) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error('[GYMOS] Error:', e);
      if (typeof fallback === 'function') return fallback(e);
      return fallback;
    }
  };
}
