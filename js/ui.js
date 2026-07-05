import { signOut } from './auth.js';
import { t, getLang, setLang } from './i18n.js';
import { getPrefs, savePrefs } from './prefs.js';

export function getTheme() {
  return getPrefs().theme || 'dark';
}

export function setTheme(theme) {
  const prefs = getPrefs();
  prefs.theme = theme;
  savePrefs(prefs);
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcons();
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function updateThemeIcons() {
  const theme = getTheme();
  document.querySelectorAll('.theme-toggle-icon').forEach(el => {
    el.className = `bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'} theme-toggle-icon`;
  });
}

export function initTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
}

export function initMobileToggle() {
  const toggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.addEventListener('click', () => sidebar.classList.remove('open'));
      document.body.appendChild(overlay);
    }
    overlay.classList.toggle('open');
  });
}

export function initSidebarCollapse() {
  const btn = document.getElementById('sidebarCollapseBtn');
  const sidebar = document.getElementById('sidebar');
  const main = document.querySelector('.main-content');
  if (!btn || !sidebar) return;

  const saved = localStorage.getItem('sidebar-collapsed') === 'true';
  if (saved) {
    sidebar.classList.add('collapsed');
    if (main) main.classList.add('sidebar-collapsed');
    btn.innerHTML = '<i class="bi bi-chevron-right"></i>';
  }

  btn.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    if (main) main.classList.toggle('sidebar-collapsed', isCollapsed);
    btn.innerHTML = isCollapsed ? '<i class="bi bi-chevron-right"></i>' : '<i class="bi bi-chevron-left"></i>';
    localStorage.setItem('sidebar-collapsed', isCollapsed);
  });
}

export function initLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      await signOut();
    } catch {
      // proceed
    }
    window.location.href = 'login.html';
  });
}

export function initTopbar(title) {
  const h2 = document.querySelector('.topbar-left h2');
  if (h2 && title) h2.textContent = title;
  initMobileToggle();
}

export function initThemeToggle() {
  const btns = document.querySelectorAll('.theme-toggle-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
  updateThemeIcons();
}

export function renderSidebar(activePage) {
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;

  nav.innerHTML = getSidebarHtml(activePage);
  initMobileToggle();
  initLogout();

  const footer = document.getElementById('sidebarFooter');
  if (footer) {
    footer.innerHTML = `
      <div class="sidebar-user">
        <div class="sidebar-user-avatar" id="sidebarUserAvatar">A</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name" id="sidebarUserName">Admin</div>
          <div class="sidebar-user-role">Owner</div>
        </div>
      </div>
      <div class="sidebar-footer-actions">
        <button class="btn-ghost-icon lang-toggle-btn" title="${t('nav.lang')}" aria-label="${t('nav.lang')}">
          <i class="bi bi-translate" aria-hidden="true"></i>
        </button>
        <button class="btn-ghost-icon theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme">
          <i class="bi bi-moon theme-toggle-icon" aria-hidden="true"></i>
        </button>
        <button class="btn-ghost-icon sidebar-collapse-btn" id="sidebarCollapseBtn" title="Collapse sidebar" aria-label="Collapse sidebar">
          <i class="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
      </div>`;
  }
  initLangToggle();
  initThemeToggle();
  initSidebarCollapse();
}

function getSidebarHtml(activePage) {
  const sections = [
    { label: 'Main Menu' },
    { id: 'dashboard', icon: 'bi-grid-1x2', label: () => t('nav.dashboard'), href: 'dashboard.html' },
    { id: 'members', icon: 'bi-people', label: () => t('nav.members'), href: 'members.html' },
    { id: 'plans', icon: 'bi-boxes', label: () => t('nav.plans'), href: 'plans.html' },
    { id: 'services', icon: 'bi-gear', label: () => t('nav.services'), href: 'services.html' },
    { id: 'scan', icon: 'bi-qr-code-scan', label: () => t('nav.scan'), href: 'scan.html' },
    { label: 'Finance' },
    { id: 'revenue', icon: 'bi-currency-dollar', label: () => t('nav.revenue'), href: 'revenue.html' },
    { id: 'reports', icon: 'bi-file-earmark-bar-graph', label: () => t('nav.reports'), href: 'reports.html' },
    { label: 'System' },
    { id: 'settings', icon: 'bi-sliders', label: () => t('nav.settings'), href: 'settings.html' },
  ];

  return sections.map(s => {
    if (s.label && !s.id) {
      return `<div class="nav-label" aria-hidden="true">${s.label}</div>`;
    }
    const active = s.id === activePage ? 'active' : '';
    const ariaCurrent = s.id === activePage ? ' aria-current="page"' : '';
    return `<a href="${s.href}" class="${active}"${ariaCurrent}><i class="bi ${s.icon}" aria-hidden="true"></i><span class="nav-text">${s.label()}</span></a>`;
  }).join('');
}

export function pageTransition() {
  const els = document.querySelectorAll('.page-content > *');
  els.forEach((el, i) => {
    el.style.animation = `fadeUp 0.5s ease ${i * 0.05}s both`;
  });
}

export function skeletonLoader(container, count, type) {
  if (!container) return;
  const n = count || 3;
  const t = type || 'card';

  if (t === 'card') {
    container.innerHTML = Array(n).fill(`
      <div class="member-card" aria-hidden="true">
        <div class="member-card-top">
          <div class="skeleton skeleton-avatar"></div>
          <div class="member-card-info">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
          </div>
        </div>
        <div class="member-card-body">
          ${Array(3).fill('<div class="skeleton skeleton-text" style="width:70%"></div>').join('')}
        </div>
      </div>`).join('');
  } else if (t === 'table') {
    container.innerHTML = `
      <div class="table-container" aria-hidden="true">
        <div class="table-wrapper">
          <table class="table">
            <thead><tr>${Array(6).fill('<th><div class="skeleton skeleton-text"></div></th>').join('')}</tr></thead>
            <tbody>${Array(n).fill(`<tr>${Array(6).fill('<td><div class="skeleton skeleton-text"></div></td>').join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
  } else if (t === 'stat') {
    container.innerHTML = Array(n).fill('<div class="stat-card" aria-hidden="true"><div class="stat-icon skeleton" style="width:48px;height:48px;border-radius:12px"></div><div class="stat-info"><div class="skeleton skeleton-title" style="width:50%"></div><div class="skeleton skeleton-text" style="width:30%"></div></div></div>').join('');
  }
}

export function initLangToggle() {
  const btns = document.querySelectorAll('.lang-toggle-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = getLang() === 'ar' ? 'en' : 'ar';
      setLang(newLang);
      window.location.reload();
    });
  });
}

export function applyI18nToPage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (key) {
      const translated = t(key);
      if (translated !== key) {
        el.textContent = translated;
      }
    }
  });
}
