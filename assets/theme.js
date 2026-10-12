(() => {
  document.documentElement.classList.add('js');
  try {
    const theme = localStorage.getItem('horizon-theme');
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  } catch { /* Storage is optional, including in privacy modes. */ }
})();
