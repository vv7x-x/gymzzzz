import { supabase } from './supabase.js';


export async function loadDashboardStats() {
  try {
    const { data: members, error } = await supabase.from('members').select('*');
    if (error) { console.error('Failed to load dashboard stats:', error.message); return; }

    const total = members.length;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const addedThisMonth = members.filter(m => {
      const d = new Date(m.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    animateNumber('statTotal', total);
    animateNumber('statNewMonth', addedThisMonth);
  } catch (e) {
    console.error('Dashboard stats error:', e);
  }
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const duration = 800;
  const start = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(target * eased);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
