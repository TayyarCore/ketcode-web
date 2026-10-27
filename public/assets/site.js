// Shared behaviour for every KetCode page: year, language toggle, reveal on scroll.

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Language toggle — each page sets data-title-en / data-title-ar on <html>
function setLang(lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';

  const title = html.dataset[lang === 'ar' ? 'titleAr' : 'titleEn'];
  if (title) document.title = title;

  ['en', 'ar'].forEach((l) => {
    const btn = document.getElementById('btn-' + l);
    if (!btn) return;
    btn.classList.toggle('is-active', lang === l);
    btn.classList.toggle('text-ink', lang === l);
    btn.classList.toggle('text-mute', lang !== l);
    btn.setAttribute('aria-pressed', String(lang === l));
  });

  try { localStorage.setItem('ketcode-lang', lang); } catch {}
}

let savedLang = null;
try { savedLang = localStorage.getItem('ketcode-lang'); } catch {}
const lockedArabicTemplate = location.pathname.startsWith('/templates/');
setLang((lockedArabicTemplate ? 'ar' : savedLang) || document.documentElement.dataset.defaultLang ||
  (navigator.language?.startsWith('ar') ? 'ar' : 'en'));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) document.documentElement.classList.add('motion-ready');

// Stagger related items without delaying initial layout or reduced-motion users.
document.querySelectorAll('.industry-grid, .template-grid, .service-list').forEach((group) => {
  group.querySelectorAll('.reveal').forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 70}ms`);
  });
});

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// One-time brand equation merge.
const brandMerge = document.querySelector('.brand-merge');
if (brandMerge && !reduceMotion) {
  requestAnimationFrame(() => requestAnimationFrame(() => brandMerge.classList.add('is-merging')));
}

// Booking chat plays once when it reaches the viewport.
const chatDemo = document.querySelector('[data-chat-demo]');
if (chatDemo && !reduceMotion && 'IntersectionObserver' in window) {
  const chatObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    chatDemo.classList.add('is-playing');
    chatObserver.disconnect();
  }, { threshold: 0.35 });
  chatObserver.observe(chatDemo);
}

// Desktop-only cursor glow in the hero.
const hero = document.querySelector('.hero');
if (hero && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--cursor-x', `${event.clientX - rect.left}px`);
    hero.style.setProperty('--cursor-y', `${event.clientY - rect.top}px`);
  }, { passive: true });
}

// WhatsApp links — one number for the whole site
const WA_NUMBER = '966544008827';
function setWhatsAppLink(a) {
  const text = a.dataset.wa || 'السلام عليكم، أريد نموذج موقع مجاني لنشاطي: ';
  a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  a.target = '_blank';
  a.rel = 'noopener';
}
window.setWhatsAppLink = setWhatsAppLink;
document.querySelectorAll('[data-wa]').forEach(setWhatsAppLink);

// Name equation: plays once when half visible; the replay button runs it again.
const nameAnim = document.querySelector('.name-anim');
if (nameAnim && !reduceMotion && 'IntersectionObserver' in window) {
  nameAnim.classList.add('is-ready');
  const play = () => {
    nameAnim.classList.remove('is-playing', 'is-done');
    void nameAnim.offsetWidth;
    nameAnim.classList.add('is-playing');
    setTimeout(() => nameAnim.classList.add('is-done'), 4600);
  };
  const nameObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    play();
    nameObserver.disconnect();
  }, { threshold: 0.5 });
  nameObserver.observe(nameAnim);
  nameAnim.querySelector('.ns-replay')?.addEventListener('click', play);
} else if (nameAnim) {
  nameAnim.classList.add('is-done');
}

// Back to top — added to the end of every page's footer, inheriting its colours.
const pageFooter = document.querySelector('footer');
if (pageFooter) {
  const style = document.createElement('style');
  style.textContent = `
    .back-to-top { display: flex; justify-content: center; padding: 28px 16px 8px; }
    .back-to-top a { display: inline-flex; align-items: center; gap: 10px; color: inherit;
      font-size: 14px; font-weight: 600; text-decoration: none; }
    .back-to-top a:hover, .back-to-top a:focus-visible { text-decoration: underline; text-underline-offset: 4px; }
    .back-to-top span.arrow { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%;
      border: 1px solid currentColor; transition: transform .25s ease; }
    .back-to-top a:hover span.arrow { transform: translateY(-3px); }
    @media (prefers-reduced-motion: reduce) { .back-to-top a:hover span.arrow { transform: none; } }`;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'back-to-top';
  const arabicOnly = lockedArabicTemplate;
  const label = arabicOnly
    ? 'العودة للأعلى'
    : '<span data-lang="ar">العودة للأعلى</span><span data-lang="en">Back to top</span>';
  wrap.innerHTML = `<a href="#top" aria-label="${arabicOnly ? 'العودة للأعلى' : 'Back to top / العودة للأعلى'}">`
    + `<span class="arrow" aria-hidden="true">↑</span>${label}</a>`;
  wrap.querySelector('a').addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    (document.querySelector('header a, a') || document.body).focus?.({ preventScroll: true });
  });
  pageFooter.appendChild(wrap);
}

// Keep externally hosted demo photography graceful when a preview is offline.
document.querySelectorAll('img[src^="https://images.unsplash.com"]').forEach((img) => {
  const markUnavailable = () => {
    img.hidden = true;
    img.closest('.t-image')?.classList.add('image-unavailable');
  };
  img.addEventListener('error', markUnavailable, { once: true });
  if (img.complete && img.naturalWidth === 0) markUnavailable();
});

// Load the sales assistant only on KetCode's sales pages, not demos or legal pages.
const assistantPaths = new Set(['/', '/index.html', '/websites', '/websites/', '/websites/index.html']);
if (assistantPaths.has(location.pathname)) {
  const assistantStyles = document.createElement('link');
  assistantStyles.rel = 'stylesheet';
  assistantStyles.href = '/assets/chat-widget.css';
  document.head.appendChild(assistantStyles);

  const assistantScript = document.createElement('script');
  assistantScript.src = '/assets/chat-widget.js';
  assistantScript.defer = true;
  document.body.appendChild(assistantScript);
}

