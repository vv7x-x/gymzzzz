const STORAGE_KEY = 'gymos_prefs';

export function getPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences:', e);
  }
}

export function getPref(key, fallback) {
  const prefs = getPrefs();
  return prefs[key] !== undefined ? prefs[key] : fallback;
}

export function setPref(key, value) {
  const prefs = getPrefs();
  prefs[key] = value;
  savePrefs(prefs);
}

export function getTheme() {
  return getPref('theme', 'dark');
}

export function setTheme(theme) {
  setPref('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}
