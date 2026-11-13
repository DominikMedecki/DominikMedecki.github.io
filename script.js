(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  $('#year').textContent = new Date().getFullYear();

  /* Header shadow once scrolled */
  var header = $('#siteHeader');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Mobile menu */
  var toggle = $('#navToggle'), nav = $('#siteNav');
  function setMenu(open) { nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });

  /* Why Us panel */
  var why = $('#why'), learn = $('#learnMore');
  function setWhy(open) {
    why.hidden = !open;
    learn.setAttribute('aria-expanded', String(open));
    learn.textContent = open ? 'Show Less' : 'Learn More';
  }
  learn.addEventListener('click', function () { setWhy(why.hidden); });

  /* Smooth in-page links */
  function goTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
  }
  $$('[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var id = (a.getAttribute('href') || '').slice(1);
      if (a.hasAttribute('data-why')) setWhy(true);
      setMenu(false);
      goTo(id);
    });
  });

  /* Active link while scrolling */
  var links = {};
  $$('.nav a.link').forEach(function (a) { links[a.dataset.target] = a; });
  function setActive(id) {
    $$('.nav a.link').forEach(function (a) { a.classList.toggle('active', a.dataset.target === id); });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting && links[en.target.id]) setActive(en.target.id); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    ['home', 'services', 'about', 'work', 'contact'].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* Overlay helpers: scroll lock, Escape, focus handling */
  var openOverlay = null, lastFocus = null;
  function focusables(root) {
    return $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', root).filter(function (n) { return n.offsetParent !== null; });
  }
  function showOverlay(el, focusEl) {
    lastFocus = document.activeElement;
    openOverlay = el; el.classList.add('open'); document.body.classList.add('locked');
    setTimeout(function () { (focusEl || focusables(el)[0] || el).focus(); }, 30);
  }
  function hideOverlay() {
    if (!openOverlay) return;
    openOverlay.classList.remove('open'); document.body.classList.remove('locked'); openOverlay = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('.overlay').forEach(function (ov) {
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) hideOverlay(); });
    $$('[data-close]', ov).forEach(function (b) { b.addEventListener('click', hideOverlay); });
  });
  document.addEventListener('keydown', function (e) {
    if (!openOverlay) { if (e.key === 'Escape') setMenu(false); return; }
    if (e.key === 'Escape') { hideOverlay(); return; }
    if (openOverlay.id === 'lbOverlay') {
      if (e.key === 'ArrowLeft') { step(-1); return; }
      if (e.key === 'ArrowRight') { step(1); return; }
    }
    if (e.key === 'Tab') {
      var f = focusables(openOverlay); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Quote form */
  var qOverlay = $('#quoteOverlay'), form = $('#quoteForm'), done = $('#quoteDone');
  function resetForm() {
    form.hidden = false; done.hidden = true;
    $$('.err', form).forEach(function (n) { n.textContent = ''; });
    $$('[aria-invalid]', form).forEach(function (n) { n.removeAttribute('aria-invalid'); });
  }
  $$('[data-quote]').forEach(function (b) {
    b.addEventListener('click', function () {
      setMenu(false); resetForm();
      var t = b.getAttribute('data-type');
      if (t) { $('#qType').value = t; }
      showOverlay(qOverlay, $('#qName'));
    });
  });
  function fail(id, msg) { var inp = $('#' + id); $('#' + id + 'E').textContent = msg; inp.setAttribute('aria-invalid', 'true'); return inp; }
  function clear(id) { $('#' + id + 'E').textContent = ''; $('#' + id).removeAttribute('aria-invalid'); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ['qName', 'qEmail', 'qPhone', 'qType'].forEach(clear);
    var firstBad = null;
    var name = $('#qName').value.trim(), email = $('#qEmail').value.trim(), phone = $('#qPhone').value.trim(), type = $('#qType').value;
    if (!name) firstBad = firstBad || fail('qName', 'Enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) firstBad = firstBad || fail('qEmail', 'Enter a valid email address.');
    if (phone && phone.replace(/\D/g, '').length < 7) firstBad = firstBad || fail('qPhone', 'Enter at least 7 digits.');
    if (!type) firstBad = firstBad || fail('qType', 'Choose a project type.');
    if (firstBad) { firstBad.focus(); return; }
    $('#doneName').textContent = name.split(' ')[0];
    $('#doneText').textContent = 'Your ' + type.toLowerCase() + ' enquiry is ready, and we would reply to ' + email + ' within one working day.';
    form.hidden = true; done.hidden = false; form.reset();
    $('#doneText').scrollIntoView({ block: 'nearest' });
  });
  ['qName', 'qEmail', 'qPhone', 'qType'].forEach(function (id) { $('#' + id).addEventListener('input', function () { clear(id); }); });

  /* Project gallery */
  var cards = $$('.p-card'), lb = $('#lbOverlay'), idx = 0;
  function render() {
    var c = cards[idx];
    $('#lbImg').src = $('img', c).src; $('#lbImg').alt = $('img', c).alt;
    $('#lbTitle').textContent = c.dataset.title;
    $('#lbMeta').textContent = c.dataset.loc + '  ·  ' + (idx + 1) + ' of ' + cards.length;
  }
  function step(d) { idx = (idx + d + cards.length) % cards.length; render(); }
  cards.forEach(function (c, i) { c.addEventListener('click', function () { idx = i; render(); showOverlay(lb, $('#lbNext')); }); });
  $('#viewAll').addEventListener('click', function () { idx = 0; render(); showOverlay(lb, $('#lbNext')); });
  $('#lbPrev').addEventListener('click', function () { step(-1); });
  $('#lbNext').addEventListener('click', function () { step(1); });

  /* Copy contact details */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.dataset.copy;
      function ok() { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); }
      function fallback() {
        var a = b.previousElementSibling, r = document.createRange();
        r.selectNodeContents(a); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        b.textContent = 'Selected'; setTimeout(function () { b.textContent = 'Copy'; }, 1600);
      }
      try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (e) { fallback(); }
    });
  });
})();
