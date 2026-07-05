import { getPref, setPref } from './prefs.js';
import { t, getLang, setLang } from './i18n.js';

export function getTheme() {
  return getPref('theme', 'dark');
}

export function setTheme(theme) {
  setPref('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initThemeUI() {
  const themeBtn = document.getElementById('themeToggle');
  const langBtn = document.getElementById('langToggle');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      toggleTheme();
      updateThemeIcon(themeBtn);
    });
    updateThemeIcon(themeBtn);
  }

  if (langBtn) {
    langBtn.addEventListener('click', () => {
      setLang(getLang() === 'ar' ? 'en' : 'ar');
      updateLangBtn(langBtn);
      window.location.reload();
    });
    updateLangBtn(langBtn);
  }
}

function updateThemeIcon(btn) {
  const theme = getTheme();
  btn.innerHTML = theme === 'dark'
    ? '<i class="bi bi-sun"></i>'
    : '<i class="bi bi-moon"></i>';
  btn.title = 'Toggle theme';
}

function updateLangBtn(btn) {
  if (btn) btn.textContent = getLang() === 'ar' ? 'EN' : 'AR';
}

export function applySavedTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  const lang = getLang();
  document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('data-lang', lang);
}
