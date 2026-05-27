/**
 * Theme Manager - Dark/Light theme toggle
 *
 * Features:
 * - Persists preference in localStorage
 * - Respects system preference (prefers-color-scheme)
 * - Listens for system changes when no stored preference
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'blog-theme';
  const ATTR = 'data-theme';

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute(ATTR, theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleButton(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute(ATTR) || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function updateToggleButton(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? '切换到亮色模式' : '切换到深色模式');
  }

  function init() {
    const theme = getPreferredTheme();
    setTheme(theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);

    // Listen for system theme changes (only when no stored preference)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
