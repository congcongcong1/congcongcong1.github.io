const browser = document.getElementById('shelf-browser');
if (browser) {
  const links = Array.from(browser.querySelectorAll<HTMLAnchorElement>('[data-shelf-kind]'));
  const buttons = Array.from(browser.querySelectorAll<HTMLButtonElement>('[data-shelf-view]'));
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-shelf-section]'));
  const count = document.getElementById('shelf-result-count')!;
  const empty = document.getElementById('shelf-empty-state')!;
  let kind = '全部';
  let view = 'recent';

  function render() {
    let total = 0;
    sections.forEach(section => {
      const items = Array.from(section.querySelectorAll<HTMLElement>('[data-shelf-item]'));
      items.sort((a, b) => (view === 'favorites' ? Number(b.dataset.rating) - Number(a.dataset.rating) : 0) || Number(b.dataset.date) - Number(a.dataset.date));
      let visible = 0;
      items.forEach(item => {
        item.hidden = (kind !== '全部' && kind !== section.dataset.shelfSection)
          || (view === 'favorites' && Number(item.dataset.rating) < 9)
          || (view === 'now' && !['在看', '在听', '在玩'].includes(item.dataset.status || ''));
        if (!item.hidden) visible++;
        item.parentElement!.append(item);
      });
      const label = section.querySelector<HTMLElement>('[data-section-count]');
      if (label) label.textContent = `${section.dataset.shelfSection} — ${visible}${visible !== Number(label.dataset.total) ? ` / ${label.dataset.total}` : ''} ${label.dataset.unit}`;
      section.hidden = visible === 0;
      total += visible;
    });
    links.forEach(link => {
      if (link.dataset.shelfKind === kind) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shelfView === view)));
    count.textContent = `${kind} · ${total} 条记录`;
    empty.hidden = total > 0;
  }

  function readURL() {
    const url = new URL(location.href);
    const requestedKind = url.searchParams.get('kind');
    kind = links.some(link => link.dataset.shelfKind === requestedKind) ? requestedKind! : '全部';
    const requestedView = url.searchParams.get('view');
    view = ['favorites', 'now'].includes(requestedView || '') ? requestedView! : 'recent';
    render();
  }

  function update() {
    const url = new URL(location.href);
    kind === '全部' ? url.searchParams.delete('kind') : url.searchParams.set('kind', kind);
    view === 'recent' ? url.searchParams.delete('view') : url.searchParams.set('view', view);
    url.hash = '';
    history.pushState(null, '', url);
    render();
  }
  links.forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    kind = link.dataset.shelfKind!;
    update();
  }));
  buttons.forEach(button => button.addEventListener('click', () => {
    view = button.dataset.shelfView!;
    update();
  }));
  document.getElementById('shelf-reset')!.addEventListener('click', () => {
    kind = '全部'; view = 'recent'; update();
  });
  window.addEventListener('popstate', readURL);
  window.addEventListener('pageshow', readURL);
  document.getElementById('shelf-filter-controls')!.hidden = false;
  readURL();
}
