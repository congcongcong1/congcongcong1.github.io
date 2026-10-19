const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.toc-link'));
const headings = Array.from(document.querySelectorAll<HTMLElement>('.notes-article h2[id], .notes-article h3[id]'));
const menus = Array.from(document.querySelectorAll<HTMLDetailsElement>('.reading-nav details'));
menus.forEach(menu => menu.addEventListener('toggle', () => {
  if (menu.open) menus.filter(other => other !== menu).forEach(other => { other.open = false; });
}));
links.forEach(link => link.addEventListener('click', event => {
  const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
  if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  menus.forEach(menu => { menu.open = false; });
  history.pushState(null, '', link.hash);
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}));
let pending = false;
function update() {
  pending = false;
  const offset = document.querySelector('.reading-nav')?.getBoundingClientRect().height || 0;
  let current = headings[0];
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= 100 + offset) current = heading;
  }
  links.forEach(link => {
    if (current && decodeURIComponent(link.hash.slice(1)) === current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (!pending) { pending = true; requestAnimationFrame(update); }
}, { passive: true });
update();
