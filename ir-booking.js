/* Island Rides booking: fill in the form, then WhatsApp opens with the details. The team confirms the booking by message. */
(function () {
  var WA = '66803140043';
  var APPS = {
    wa: { name: 'WhatsApp', label: 'WhatsApp number', type: 'tel', ph: '+44 7700 900123', url: function (m) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(m); } },
    line: { name: 'LINE', label: 'LINE ID or phone number', type: 'text', ph: 'LINE ID, or phone with country code', url: function () { return 'https://line.me/ti/p/~islandrides'; } },
    tg: { name: 'Telegram', label: 'Telegram username or phone number', type: 'text', ph: '@username, or phone with country code', url: function () { return 'https://t.me/islandrides_phuket'; } }
  };
  function app() { return APPS[st.c.app] || APPS.wa; }
  var LOWHEAD = ['1–6 days', '7–14 days', '15–29 days', '30+ days', '3+ months'];
  var st = { kind: null, step: 1, sent: false, err: {}, tour: {}, bike: {}, car: {}, c: { name: '', email: '', app: 'wa', wa: '', line: '', tg: '', notes: '' } };
  var items = [], bike = null, car = null, back = null, lastFocus = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function num(s) { return parseInt(String(s).replace(/[^\d]/g, ''), 10); }
  function seasonOf(d) { var m = new Date(d + 'T00:00:00').getMonth() + 1; return (m >= 5 && m <= 10) ? 'low' : 'high'; }
  var check = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';

  /* ---------- prices ---------- */
  function tourOf() { for (var i = 0; i < items.length; i++) if (items[i].id === st.tour.id) return items[i]; return items[0]; }
  function tierList(v, se) {
    if (se === 'high') return v.h.map(function (h, i) { var n = h.match(/\d+/g).map(Number); return { a: n[0], b: /\+/.test(h) ? null : (n[1] || n[0]), p: num(v.r[i]) }; });
    return [{ a: 1, b: 6, p: num(v.r[0]) }, { a: 7, b: 14, p: num(v.r[1]) }, { a: 15, b: 29, p: num(v.r[2]) }];
  }
  function bikeQuote() {
    var b = st.bike;
    if (!b.pick || !b.ret) return { ok: false, txt: 'Choose your dates', note: '' };
    var d = Math.round((new Date(b.ret) - new Date(b.pick)) / 864e5);
    if (d < 1) return { ok: false, txt: 'Check the dates', note: 'The return date must be after the pickup date.' };
    var se = seasonOf(b.pick), vs = bike[se].filter(function (v) { return !v.ask; });
    if (!vs.length) return { ok: true, days: d, se: se, txt: 'Ask us', note: 'We send the rate for this bike by message.' };
    var v = vs.filter(function (x) { return x.name === b.variant; })[0] || vs[0];
    if (se === 'high' && d < v.min) return { ok: false, days: d, se: se, txt: 'Minimum ' + v.min + ' days', note: 'In high season the minimum rental for this bike is ' + v.min + ' days.' };
    if (se === 'low' && d >= 30) return { ok: true, days: d, se: se, v: v, txt: v.month + ' THB/month', note: '30+ days use the monthly rate. We confirm the exact total by message.' };
    var T = tierList(v, se), rate = function (x) { for (var i = 0; i < T.length; i++) if (x >= T[i].a && (T[i].b == null || x <= T[i].b)) return T[i].p; return T[T.length - 1].p; };
    var best = d * rate(d), capped = false;
    if (se === 'high') for (var x = d + 1; x <= d + 30; x++) { var c = x * rate(x); if (c < best) { best = c; capped = true; } }
    return { ok: true, days: d, se: se, v: v, txt: fmt(best) + ' THB', note: d + ' days × ' + fmt(rate(d)) + ' THB/day' + (capped ? ' = ' + fmt(d * rate(d)) + ' THB. A longer rental costs less, so you pay the lower price.' : '') + ' · ' + se + ' season · deposit ' + v.dep };
  }
  function tourQuote() {
    var t = tourOf(), a = st.tour.adults, k = st.tour.kids;
    if (t.from) return { txt: 'from ' + fmt(t.price) + ' THB', note: 'Price ' + t.unit + '. We confirm the exact option and total by message.' };
    if (t.child) return { txt: fmt(a * t.price + k * t.child) + ' THB', note: a + ' × ' + fmt(t.price) + ' (adult)' + (k ? ' + ' + k + ' × ' + fmt(t.child) + ' (child)' : '') + '. We confirm the total by message.' };
    return { txt: fmt(t.price) + ' THB', note: 'Price ' + t.unit + '.' };
  }
  function carQuote() {
    var b = st.car;
    if (!b.pick || !b.ret) return { ok: false, txt: 'Choose your dates', note: '' };
    var d = Math.round((new Date(b.ret) - new Date(b.pick)) / 864e5);
    if (d < 1) return { ok: false, txt: 'Check the dates', note: 'The return date must be after the pickup date.' };
    var se = seasonOf(b.pick), r = car[se];
    if (d < 3) return { ok: false, days: d, se: se, txt: 'Minimum 3 days', note: 'The minimum car rental is 3 days.' };
    if (d >= 30) return { ok: true, days: d, se: se, txt: r.month + ' THB/month', note: d + ' days · ' + se + ' season monthly rate. We confirm the exact total by message. Deposit: ' + car.dep + '.' };
    if (d >= 7) return { ok: true, days: d, se: se, txt: r.week + ' THB/week', note: d + ' days · ' + se + ' season weekly rate. We confirm the exact total by message. Deposit: ' + car.dep + '.' };
    return { ok: true, days: d, se: se, txt: fmt(d * num(r.day)) + ' THB', note: d + ' days × ' + r.day + ' THB/day · ' + se + ' season · deposit ' + car.dep };
  }
  function quote() { return st.kind === 'bike' ? bikeQuote() : st.kind === 'car' ? carQuote() : tourQuote(); }

  /* ---------- summary + message ---------- */
  function summary() {
    if (st.kind === 'bike') {
      var b = st.bike, q = bikeQuote();
      return [['Motorbike', bike.name + (q.v && bike[q.se].length > 1 ? ' — ' + q.v.name : '')], ['Pickup date', b.pick || '—'], ['Return date', b.ret || '—'], ['Days', q.days ? String(q.days) : '—'], ['Pickup', b.method === 'delivery' ? 'Delivery to ' + (b.addr || '—') : 'Collect at our shop in Chalong']];
    }
    if (st.kind === 'car') {
      var c = st.car, cq = carQuote();
      return [['Car', car.name], ['Pickup date', c.pick || '—'], ['Return date', c.ret || '—'], ['Days', cq.days ? String(cq.days) : '—'], ['Pickup', c.method === 'delivery' ? 'Delivery / airport: ' + (c.addr || '—') : 'Collect at our shop in Chalong']];
    }
    var t = tourOf(), s = st.tour;
    return [['Tour', t.title], ['Date', s.date || '—'], ['Guests', s.adults + ' adult' + (s.adults > 1 ? 's' : '') + (t.child ? ', ' + s.kids + ' child' + (s.kids === 1 ? '' : 'ren') : '')], ['Hotel / pickup', s.hotel || '—']];
  }
  function message() {
    var L = ["Hi Island Rides! I'd like to book:"];
    summary().forEach(function (r) { L.push(r[0] + ': ' + r[1]); });
    L.push('Estimate shown: ' + quote().txt);
    L.push('Name: ' + st.c.name, 'Email: ' + st.c.email, 'Contact me on ' + app().name + ': ' + st.c[st.c.app]);
    if (st.c.notes) L.push('Notes: ' + st.c.notes);
    L.push('Please confirm my booking.');
    return L.join('\n');
  }

  /* ---------- views ---------- */
  function fld(key, label, type, val, ph, extra) {
    var e = st.err[key];
    return '<label class="rd-fld' + (e ? ' bad' : '') + '"><span>' + label + '</span><input id="rdm-' + key + '" data-k="' + key + '" type="' + type + '" value="' + esc(val) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + (extra || '') + '>' + (e ? '<span class="err">' + esc(e) + '</span>' : '') + '</label>';
  }
  function cnt(key, label, sub, val) {
    return '<div class="rdm-cnt"><div><b>' + label + '</b><small>' + sub + '</small></div><div class="c"><button type="button" data-cnt="' + key + ':-1" aria-label="Fewer ' + label.toLowerCase() + '">−</button><output>' + val + '</output><button type="button" data-cnt="' + key + ':1" aria-label="More ' + label.toLowerCase() + '">+</button></div></div>';
  }
  function step1() {
    var h = '';
    if (st.kind === 'bike') {
      var b = st.bike, se = b.pick ? seasonOf(b.pick) : (new Date().getMonth() + 1 >= 5 && new Date().getMonth() + 1 <= 10 ? 'low' : 'high');
      var vs = bike[se].filter(function (v) { return !v.ask; });
      h += '<div class="rdm-pair">' + fld('pick', 'Pickup date', 'date', b.pick) + fld('ret', 'Return date', 'date', b.ret) + '</div>';
      if (vs.length > 1) h += '<label class="rd-fld"><span>Model year</span><select id="rdm-variant" data-k="variant">' + vs.map(function (v) { return '<option' + (b.variant === v.name ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join('') + '</select></label>';
      h += '<div class="rdm-tog" role="group" aria-label="Pickup"><button type="button" data-method="shop" aria-pressed="' + (b.method !== 'delivery') + '">Collect at shop</button><button type="button" data-method="delivery" aria-pressed="' + (b.method === 'delivery') + '">Delivery (extra fee)</button></div>';
      if (b.method === 'delivery') h += fld('addr', 'Delivery address or hotel', 'text', b.addr, 'Hotel name or address');
    } else if (st.kind === 'car') {
      var c = st.car;
      h += '<div class="rdm-pair">' + fld('pick', 'Pickup date', 'date', c.pick) + fld('ret', 'Return date', 'date', c.ret) + '</div>';
      h += '<div class="rdm-tog" role="group" aria-label="Pickup"><button type="button" data-method="shop" aria-pressed="' + (c.method !== 'delivery') + '">Collect at shop</button><button type="button" data-method="delivery" aria-pressed="' + (c.method === 'delivery') + '">Delivery or airport</button></div>';
      if (c.method === 'delivery') h += fld('addr', 'Hotel, address or flight', 'text', c.addr, 'Hotel name, address or flight number');
    } else {
      var t = tourOf(), s = st.tour;
      h += '<label class="rd-fld"><span>Tour</span><select id="rdm-tid" data-k="tid">' + items.map(function (x) { return '<option value="' + x.id + '"' + (x.id === s.id ? ' selected' : '') + '>' + esc(x.title) + '</option>'; }).join('') + '</select></label>';
      h += fld('date', 'Tour date', 'date', s.date);
      h += cnt('adults', 'Adults', t.child ? fmt(t.price) + ' THB each' : esc(t.unit.replace(/^per /, 'priced per ')), s.adults);
      if (t.child) h += cnt('kids', 'Children', fmt(t.child) + ' THB each' + (t.childLabel ? ' · ' + t.childLabel : ''), s.kids);
      h += fld('hotel', 'Hotel / pickup point', 'text', s.hotel, 'Hotel name or area');
    }
    var q = quote();
    h += '<div class="rdm-est"><span>Estimate</span><b>' + esc(q.txt) + '</b></div>' + (q.note ? '<p class="rdm-note">' + esc(q.note) + '</p>' : '');
    h += fld('name', 'Full name', 'text', st.c.name, 'Your name', ' autocomplete="name"');
    h += fld('email', 'Email', 'email', st.c.email, 'you@example.com', ' autocomplete="email"');
    h += '<div class="rd-fld"><span>Contact me on</span><div class="rdm-tog three" role="group" aria-label="Contact app">' + ['wa', 'line', 'tg'].map(function (k) { return '<button type="button" data-app="' + k + '" aria-pressed="' + (st.c.app === k) + '">' + APPS[k].name + '</button>'; }).join('') + '</div></div>';
    h += fld(st.c.app, app().label, app().type, st.c[st.c.app], app().ph, st.c.app === 'wa' ? ' autocomplete="tel"' : '');
    h += '<label class="rd-fld"><span>Notes (optional)</span><textarea id="rdm-notes" data-k="notes" rows="2" placeholder="Anything we should know">' + esc(st.c.notes) + '</textarea></label>';
    h += payBox();
    h += '<div class="rdm-acts"><button type="button" class="rd-btn rd-btn-wa grow" data-act="send">' + (st.c.app === 'wa' ? 'Send booking via WhatsApp' : 'Copy booking & open ' + app().name) + '</button></div><p class="rdm-note" style="text-align:center">' + (st.c.app === 'wa' ? 'WhatsApp opens with your details filled in.' : 'Your booking is copied. Paste it in our ' + app().name + ' chat and send.') + ' We confirm your booking there.</p>';
    return h;
  }
  function payBox() {
    var extra = st.kind === 'car' ? '<li>Deposit for this car: ' + esc(car.dep) + '. Refunded within 24–72 hours after return if there is no damage.</li>' + (st.car.method === 'delivery' ? '<li>We confirm delivery or airport pick-up details by message.</li>' : '') : st.kind === 'bike' ? '<li>Deposit: cash or passport, refunded within 24 hours after return if there is no damage.</li>' + (st.bike.method === 'delivery' ? '<li>Delivery fee depends on the area and bike size. We tell you by message.</li>' : '') : '';
    return '<div class="rdm-fee"><b>Payment</b><ul><li>Cash, bank transfer or Wise: no extra fee</li><li>Credit card: +5%</li><li>USDT: +3%</li>' + extra + '<li>You pay after we confirm your booking by message.</li></ul></div>';
  }
  function done() {
    var A = app(), wa = st.c.app === 'wa';
    var head = wa ? 'One more step: tap Send in WhatsApp' : 'One more step: paste and send in ' + A.name;
    var body = wa ? 'Your booking is typed in WhatsApp but <b>not sent yet</b>. Tap the green <b>Send ➤</b> button there. We only see your booking after you send it.'
      : 'Your booking is <b>copied</b>. In the ' + A.name + ' chat with Island Rides, tap the message box, choose <b>Paste</b>, then tap <b>Send ➤</b>. If you are new to our ' + A.name + ', add us first. We only see your booking after you send it.';
    var alt = wa ? 'WhatsApp didn\'t open? Message us at <b>+66 80 314 0043</b>' : A.name + ' didn\'t open? Find us on ' + A.name + ' at <b>' + (st.c.app === 'line' ? 'islandrides' : '@islandrides_phuket') + '</b>';
    return '<div class="rdm-send" role="status"><div class="rdm-send-i" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 20.5 22 12 2.5 3.5l.02 6.6L16 12 2.52 13.9z"/></svg></div><div><h3>' + head + '</h3><p>' + body + '</p></div></div>' +
      '<div class="rdm-acts"><button type="button" class="rd-btn rd-btn-wa grow" data-act="send">Open ' + A.name + ' again</button></div>' +
      '<p class="rdm-note" style="margin-top:10px">Our team confirms your booking by message. You pay after we confirm. ' + alt + ' and paste the text below.</p><div class="rdm-msg" id="rdm-msg">' + esc(message()) + '</div><div class="rdm-acts"><button type="button" class="rd-btn rd-btn-l" data-act="copy">Copy message</button><button type="button" class="rd-btn rd-btn-l" data-act="to1">Edit details</button><button type="button" class="rd-btn rd-btn-n grow" data-act="close">Done</button></div>';
  }
  function render(focusFirst) {
    if (!back) return;
    var title = st.kind === 'bike' ? 'Book: ' + bike.name : st.kind === 'car' ? 'Book: ' + car.name : 'Book a tour';
    back.querySelector('.rdm').innerHTML = '<div class="rdm-h"><h2 id="rdm-title">' + esc(title) + '</h2><button type="button" class="rdm-x" data-act="close" aria-label="Close">×</button></div><div class="rdm-b">' + (st.sent ? done() : step1()) + '</div>';
    if (focusFirst) { var el = back.querySelector('.rd-fld.bad input, .rd-fld.bad select') || back.querySelector('.rdm-b input, .rdm-b select, .rdm-b .rd-btn'); if (el) el.focus({ preventScroll: !!st.sent }); }
    if (focusFirst && st.sent) { back.scrollTop = 0; }
  }
  function validate() {
    var e = {};
    if (st.kind === 'bike') {
      var q = bikeQuote();
      if (!st.bike.pick) e.pick = 'Choose a pickup date.';
      if (!st.bike.ret) e.ret = 'Choose a return date.'; else if (!q.ok) e.ret = q.note || 'Check the dates.';
      if (st.bike.method === 'delivery' && !String(st.bike.addr || '').trim()) e.addr = 'Enter where we should deliver the bike.';
    } else if (st.kind === 'car') {
      var cq = carQuote();
      if (!st.car.pick) e.pick = 'Choose a pickup date.';
      if (!st.car.ret) e.ret = 'Choose a return date.'; else if (!cq.ok) e.ret = cq.note || 'Check the dates.';
      if (st.car.method === 'delivery' && !String(st.car.addr || '').trim()) e.addr = 'Enter your hotel, address or flight.';
    } else {
      if (!st.tour.date) e.date = 'Choose a tour date.';
      if (!String(st.tour.hotel || '').trim()) e.hotel = 'Enter your hotel or pickup point.';
    }
    if (!st.c.name.trim()) e.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(st.c.email.trim())) e.email = 'Enter a valid email address.';
    var ck = st.c.app, cv = String(st.c[ck] || '').trim();
    if (ck === 'wa' && !/^\+?[\d\s()-]{8,}$/.test(cv)) e.wa = 'Enter a WhatsApp number with country code, e.g. +44 7700 900123.';
    if (ck !== 'wa' && cv.length < 2) e[ck] = 'Enter your ' + app().name + ' ID or phone number (with country code).';
    return e;
  }
  function open() {
    lastFocus = document.activeElement;
    if (!back) {
      back = document.createElement('div'); back.className = 'rdm-back';
      back.innerHTML = '<div class="rdm" role="dialog" aria-modal="true" aria-labelledby="rdm-title"></div>';
      document.body.appendChild(back);
      back.addEventListener('click', onClick); back.addEventListener('input', onInput); back.addEventListener('change', onChange);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && back && !back.hidden) close(); });
    }
    back.hidden = false; document.body.classList.add('rdm-open'); render(true);
  }
  function close() { if (!back) return; back.hidden = true; document.body.classList.remove('rdm-open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function setVal(k, v) {
    if (k === 'name' || k === 'email' || k === 'wa' || k === 'line' || k === 'tg' || k === 'notes') st.c[k] = v;
    else if (st.kind === 'bike') st.bike[k] = v; else if (st.kind === 'car') st.car[k] = v; else st.tour[k] = v;
  }
  function onInput(e) {
    var k = e.target.dataset && e.target.dataset.k; if (!k) return;
    setVal(k, e.target.value);
    if (st.err[k]) { delete st.err[k]; var f = e.target.closest('.rd-fld'); if (f) { f.classList.remove('bad'); var m = f.querySelector('.err'); if (m) m.remove(); } }
  }
  function onChange(e) {
    var k = e.target.dataset && e.target.dataset.k; if (!k) return;
    if (k === 'tid') { st.tour.id = e.target.value; render(); return; }
    if (k === 'pick' || k === 'ret' || k === 'variant') { setVal(k, e.target.value); delete st.err[k]; render(); var el = back.querySelector('#rdm-' + k); if (el) el.focus(); }
  }
  function onClick(e) {
    if (e.target === back) { close(); return; }
    var btn = e.target.closest('button'); if (!btn) return;
    var d = btn.dataset;
    if (d.cnt) { var p = d.cnt.split(':'), k = p[0], min = k === 'adults' ? 1 : 0; st.tour[k] = Math.max(min, Math.min(30, (st.tour[k] || 0) + Number(p[1]))); render(); return; }
    if (d.app) { st.c.app = d.app; delete st.err.wa; delete st.err.line; delete st.err.tg; render(); var ai = back.querySelector('#rdm-' + d.app); if (ai) ai.focus(); return; }
    if (d.method) { (st.kind === 'car' ? st.car : st.bike).method = d.method; render(); return; }
    var a = d.act; if (!a) return;
    if (a === 'close') { close(); return; }
    if (a === 'to1') { st.sent = false; render(true); return; }
    if (a === 'send') {
      if (!st.sent) { st.err = validate(); if (Object.keys(st.err).length) { render(true); return; } }
      var msg = message();
      if (st.c.app !== 'wa') copyText(msg);
      window.open(app().url(msg), '_blank', 'noopener');
      if (!st.sent) { st.sent = true; render(true); }
      return;
    }
    if (a === 'copy') {
      var txt = message();
      var done = function () { btn.textContent = 'Copied'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { selectMsg(); });
      else selectMsg();
    }
  }
  function copyText(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).catch(fallbackCopy); return; } } catch (x) {}
    fallbackCopy();
    function fallbackCopy() { try { var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } catch (x) {} }
  }
  function selectMsg() { var m = back.querySelector('#rdm-msg'); if (!m) return; var r = document.createRange(); r.selectNodeContents(m); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }

  window.IRBook = {
    openTour: function (list, id) {
      items = list; if (st.kind !== 'tour') { st.step = 1; st.sent = false; }
      st.kind = 'tour'; st.err = {};
      st.tour.id = id || st.tour.id || list[0].id; if (!st.tour.adults) st.tour.adults = 2; if (st.tour.kids == null) st.tour.kids = 0;
      if (st.sent) { st.sent = false; }
      open();
    },
    openBike: function (b) {
      if (st.kind !== 'bike' || !bike || bike.id !== b.id) { st.step = 1; st.sent = false; st.bike = { pick: st.bike.pick || '', ret: st.bike.ret || '', variant: '', method: st.bike.method || 'shop', addr: st.bike.addr || '' }; }
      bike = b; st.kind = 'bike'; st.err = {};
      if (st.sent) { st.sent = false; }
      open();
    },
    openCar: function (c) {
      if (st.kind !== 'car' || !car || car.id !== c.id) { st.sent = false; st.car = { pick: st.car.pick || '', ret: st.car.ret || '', method: st.car.method || 'shop', addr: st.car.addr || '' }; }
      car = c; st.kind = 'car'; st.err = {}; st.sent = false;
      open();
    }
  };
})();
