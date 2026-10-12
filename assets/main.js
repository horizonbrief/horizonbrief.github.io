(() => {
  const themeButton = document.querySelector('.theme-switch');
  const dark = () => document.documentElement.dataset.theme === 'dark' ||
    (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const updateThemeButton = () => {
    themeButton?.setAttribute('aria-pressed', String(dark()));
    themeButton?.setAttribute('aria-label', dark() ? 'Switch to light theme' : 'Switch to dark theme');
  };
  updateThemeButton();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);
  themeButton?.addEventListener('click', () => {
    const next = dark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('horizon-theme', next); } catch { /* Optional preference. */ }
    updateThemeButton();
  });
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Open navigation');
  };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav?.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', async () => {
    const status = button.parentElement.querySelector('[role="status"]');
    try {
      await navigator.clipboard.writeText(document.querySelector('link[rel="canonical"]')?.href || location.href);
      if (status) status.textContent = 'Article link copied.';
    } catch {
      if (status) status.textContent = 'Copy is unavailable. Select the URL from your address bar.';
    }
  }));
  const input = document.querySelector('#search-input');
  if (!input) return;
  const status = document.querySelector('#search-status');
  const target = document.querySelector('#search-results');
  let index = [], state = 'loading';
  const query = new URL(location.href).searchParams.get('q');
  if (query) input.value = query.slice(0, 160);
  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  };
  const render = () => {
    target.replaceChildren();
    if (state !== 'ready') {
      status.textContent = state === 'loading' ? 'Loading the archive…' : 'Search is unavailable. Browse the article archive or reload to try again.';
      return;
    }
    const q = input.value.slice(0, 160).trim().toLowerCase();
    if (!q) { status.textContent = 'Start typing to find an article.'; return; }
    const words = q.split(/\s+/).filter(Boolean);
    const matches = index.filter(p => words.every(w => `${p.title} ${p.description} ${p.body || ''} ${p.category} ${p.source_label} ${(p.tags || []).join(' ')}`.toLowerCase().includes(w)));
    status.textContent = matches.length ? `${matches.length} ${matches.length === 1 ? 'result' : 'results'} for “${input.value.trim()}”${matches.length > 60 ? ' · Showing the first 60' : ''}` : 'No matching articles. Try another search.';
    matches.slice(0, 60).forEach(p => {
      if (!/^articles\/[a-z0-9-]+\/index\.html$/.test(p.url)) return;
      const card = create('a', 'story-card', '');
      card.href = new URL(p.url, new URL(input.dataset.index, location.href)).href;
      card.append(create('span', 'story-type', `${p.category}${p.demo ? ' · SAMPLE' : ''}`),
        create('h2', 'search-title', p.title), create('p', '', p.description),
        create('span', 'source-label', p.source_label));
      const bottom = create('div', 'story-bottom', '');
      const date = create('time', '', p.date_formatted);
      date.dateTime = p.date;
      bottom.append(date, create('span', '', `${p.reading_minutes} MIN READ`));
      card.append(bottom);
      target.append(card);
    });
  };
  input.addEventListener('input', () => {
    const url = new URL(location.href);
    const value = input.value.slice(0, 160);
    if (value) url.searchParams.set('q', value); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    render();
  });
  render();
  fetch(input.dataset.index).then(response => {
    if (!response.ok) throw Error('Search request failed');
    return response.json();
  }).then(data => {
    if (!Array.isArray(data) || data.some(p => !p || ['title', 'description', 'category', 'source_label', 'url'].some(k => typeof p[k] !== 'string') || (p.tags && (!Array.isArray(p.tags) || p.tags.some(t => typeof t !== 'string'))))) throw Error('Invalid search index');
    index = data.filter(p => /^articles\/[a-z0-9-]+\/index\.html$/.test(p.url));
    state = 'ready';
    render();
  }).catch(() => { state = 'error'; render(); });
})();
