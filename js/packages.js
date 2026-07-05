import { supabase } from './supabase.js';
import { showToast, sanitize } from './utils.js';
import { getLang, t } from './i18n.js';

export async function loadPackages() {
  try {
    const { data, error } = await supabase.from('plans').select('*').order('duration_days');
    if (error) { showToast(error.message, 'error'); return []; }
    return data || [];
  } catch (e) {
    showToast('Failed to load plans', 'error');
    return [];
  }
}

export async function savePackage(pkg) {
  try {
    if (pkg.id) {
      const { error } = await supabase.from('plans').update(pkg).eq('id', pkg.id);
      if (error) { showToast(error.message, 'error'); return false; }
    } else {
      const { error } = await supabase.from('plans').insert(pkg);
      if (error) { showToast(error.message, 'error'); return false; }
    }
    showToast(t('plans.saved') || 'Plan saved successfully');
    return true;
  } catch (e) {
    showToast(e.message || 'Error saving plan', 'error');
    return false;
  }
}

export async function deletePackage(id) {
  try {
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return false; }
    showToast(t('plans.deleted') || 'Plan deleted');
    return true;
  } catch (e) {
    showToast('Error deleting plan', 'error');
    return false;
  }
}

export function renderPackageTable(packages, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const lang = getLang();

  if (!packages || packages.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-muted text-center">${t('plans.noPlans') || 'No plans yet'}</td></tr>`;
    return;
  }

  tbody.innerHTML = packages.map(p => `
    <tr>
      <td>${sanitize(p.name)}</td>
      <td>${p.duration_days} ${lang === 'ar' ? 'يوم' : 'days'}</td>
      <td>${Number(p.price).toFixed(2)}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-ghost edit-pkg-btn"
            data-id="${p.id}"
            data-name="${sanitize(p.name)}"
            data-days="${p.duration_days}"
            data-price="${p.price}"
            aria-label="Edit ${sanitize(p.name)}">
            <i class="bi bi-pencil" aria-hidden="true"></i>
          </button>
          <button class="btn btn-sm btn-ghost delete-pkg-btn"
            data-id="${p.id}"
            aria-label="Delete ${sanitize(p.name)}"
            style="color:var(--danger)">
            <i class="bi bi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}
