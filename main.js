// JS cliente sin dependencias: menú, cabecera, sección activa, idioma, reveal y formulario.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Recordar idioma elegido */
  $$('[data-lang]').forEach((a) =>
    a.addEventListener('click', () => { try { localStorage.setItem('lang', a.dataset.lang); } catch {} })
  );
  // Mantener la sección actual al cambiar de idioma
  $$('.lang a, .footer-col a[data-lang]').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (location.hash) { e.preventDefault(); location.href = a.getAttribute('href') + location.hash; }
    })
  );

  /* Cabecera */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 12);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* Menú móvil */
  const btn = $('.menu-btn'), nav = $('#site-nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? btn.dataset.close : btn.dataset.open);
    document.body.style.overflow = open ? 'hidden' : '';
    $('path', btn).setAttribute('d', open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16');
  };
  btn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); btn.focus(); } });
  window.matchMedia('(min-width:1021px)').addEventListener('change', (m) => m.matches && setMenu(false));

  /* Sección activa en el menú */
  const links = new Map($$('[data-nav]').map((a) => [a.dataset.nav, a]));
  const secs = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { links.forEach((a) => a.removeAttribute('aria-current')); links.get(e.target.id)?.setAttribute('aria-current', 'true'); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => spy.observe(s));

    /* Reveal */
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal').forEach((el) => io.observe(el));
  } else { $$('.reveal').forEach((el) => el.classList.add('is-in')); }

  /* Formulario */
  const form = $('#contact-form'); if (!form) return;
  const d = form.dataset;
  const errBox = $('#form-error'), ok = $('#form-success'), submit = $('button[type=submit]', form);
  const rules = {
    name: (v) => (!v.trim() ? d.eNameRequired : ''),
    email: (v) => (!v.trim() ? d.eEmailRequired : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? d.eEmailInvalid : ''),
    message: (v) => (!v.trim() ? d.eMessageRequired : v.trim().length < 10 ? d.eMessageShort : ''),
  };
  const check = (name) => {
    const input = form.elements[name], field = input.closest('.field'), msg = rules[name](input.value);
    field.classList.toggle('has-error', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    $('.err', field).textContent = msg;
    return !msg;
  };
  Object.keys(rules).forEach((n) => {
    const i = form.elements[n];
    i.addEventListener('blur', () => i.value && check(n));
    i.addEventListener('input', () => i.closest('.field').classList.contains('has-error') && check(n));
  });
  const showError = (m) => { errBox.textContent = m; errBox.hidden = false; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); errBox.hidden = true;
    const valid = Object.keys(rules).map(check).every(Boolean);
    if (!valid) { showError(d.eSummary); form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    if (form.elements._gotcha.value) return; // bot
    if (!d.endpoint) { showError(d.unavailable); return; } // nunca se simula un envío
    submit.disabled = true; submit.firstChild.textContent = d.sending + ' ';
    try {
      const data = Object.fromEntries(new FormData(form));
      delete data._gotcha; data.language = d.lang;
      const res = await fetch(d.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(String(res.status));
      form.hidden = true; ok.hidden = false; ok.querySelector('h3').setAttribute('tabindex', '-1'); ok.querySelector('h3').focus();
    } catch { showError(d.failure); }
    finally { submit.disabled = false; submit.firstChild.textContent = submit.dataset.label + ' '; }
  });
  $('#form-again')?.addEventListener('click', () => { form.reset(); form.hidden = false; ok.hidden = true; $$('.has-error', form).forEach((f) => f.classList.remove('has-error')); form.elements.name.focus(); });
})();
