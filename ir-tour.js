/* Island Rides tours: share buttons and the guest/price panel on tour detail pages. */
(function () {
  function toast(msg) {
    var t = document.getElementById('ir-toast');
    if (!t) { t = document.createElement('div'); t.id = 'ir-toast'; t.className = 'ir-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  function copy(text, done) {
    var fallback = function () {
      try { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done(true); } catch (e) { done(false); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback); else fallback();
  }
  function shareUrl(btn) {
    var u = btn.getAttribute('data-share') || location.pathname;
    return new URL(u, location.href).href;
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-share]'); if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    var url = shareUrl(btn), title = btn.getAttribute('data-title') || document.title;
    var copied = function (ok) { toast(ok ? 'Link copied — paste it in WhatsApp, LINE or Facebook' : 'Copy this link: ' + url); };
    if (navigator.share) {
      navigator.share({ title: title, text: title, url: url }).catch(function (err) { if (err && err.name !== 'AbortError') copy(url, copied); });
    } else copy(url, copied);
  });

  /* ---------- price panel on a tour detail page ---------- */
  var dataEl = document.getElementById('ir-tours');
  if (!dataEl || !window.IRBook) return;
  var items = JSON.parse(dataEl.textContent);
  var panel = document.querySelector('[data-pricepanel]');
  var id = document.body.getAttribute('data-tour');
  var item = items.filter(function (x) { return x.id === id; })[0];
  var fmt = function (n) { return Number(n).toLocaleString('en-US'); };
  if (panel && item) {
    var h = '<div class="pp-row"><span>Adult</span><span><b>' + fmt(item.price) + '</b> THB</span></div>';
    if (item.child) h += '<div class="pp-row"><span>Child ' + (item.childLabel || '') + '</span><span><b>' + fmt(item.child) + '</b> THB</span></div>';
    panel.querySelector('.pp-body').innerHTML = h;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-req]'); if (!b) return;
    e.preventDefault();
    var key = b.getAttribute('data-req') || id, m = (window.IRPROGMAP || {})[key], note = b.getAttribute('data-note') || '';
    if (m) {
      var opt = m[1], r = /Route (\d\d)/.exec(note); if (r && m[0] === 'sea') opt = 'pn' + r[1];
      IRBook.openProg(m[0], opt);
    } else IRBook.openTour(items, key, { notes: note });
  });
})();
