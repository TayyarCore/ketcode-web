// Hero frame: the same site re-dressed for three businesses. Static for reduced motion.
(() => {
  const frame = document.querySelector('[data-frame]');
  if (!frame) return;
  const sites = [
    { name: 'مكتب الريادة العقاري', url: 'www.alriyada.sa', color: '#0F4C5C',
      line: 'شقق وفلل للبيع والإيجار في المدينة المنورة', kind: ['عقار للبيع', 'عقار للإيجار', 'طلب معاينة'] },
    { name: 'عيادة ابتسامة لطب الأسنان', url: 'www.ebtisama.sa', color: '#2E5FCC',
      line: 'احجز موعدك في دقيقة عبر واتساب', kind: ['تنظيف وتبييض', 'تقويم', 'حجز موعد'] },
    { name: 'صالون لمسة', url: 'www.lamsa.sa', color: '#8A3F6E',
      line: 'خدمات العناية والتجميل بمواعيد مرنة', kind: ['شعر', 'بشرة', 'باقات العروس'] },
  ];
  const $ = (s) => frame.querySelector(s);
  const typed = $('.typed'), url = $('.frame-url'), line = $('.fs-line'), tiles = frame.querySelectorAll('.fs-tiles span');
  const paint = (s) => {
    frame.style.setProperty('--site', s.color);
    url.textContent = s.url; line.textContent = s.line;
    tiles.forEach((t, i) => { t.textContent = s.kind[i] || ''; });
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { paint(sites[0]); typed.textContent = sites[0].name; $('.fs-caret')?.remove(); return; }
  let i = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function run() {
    for (;;) {
      const s = sites[i % sites.length];
      paint(s);
      for (let n = 1; n <= s.name.length; n++) { typed.textContent = s.name.slice(0, n); await wait(70); }
      await wait(2600);
      for (let n = s.name.length; n >= 0; n--) { typed.textContent = s.name.slice(0, n); await wait(28); }
      await wait(250);
      i++;
    }
  }
  let started = false;
  const start = () => { if (!started) { started = true; run(); } };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); io.disconnect(); } });
    io.observe(frame);
  } else start();
})();
