/* Island Rides booking request — 3 steps: fill in → check → send on WhatsApp.
   Nothing is booked or charged here: the last step opens WhatsApp with the request and the team confirms. */
(function () {
  var WA = '66803140043';
  var LOWHEAD = ['1–6 days', '7–14 days', '15–29 days', '30+ days', '3+ months'];
  var st = { kind: null, step: 1, sent: false, err: {}, tour: {}, bike: {}, c: { name: '', wa: '', notes: '' } };
  var items = [], bike = null, back = null, lastFocus = null;

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
    if (!vs.length) return { ok: true, days: d, se: se, txt: 'Ask us', note: 'We send the rate for this bike on WhatsApp.' };
    var v = vs.filter(function (x) { return x.name === b.variant; })[0] || vs[0];
    if (se === 'high' && d < v.min) return { ok: false, days: d, se: se, txt: 'Minimum ' + v.min + ' days', note: 'In high season the minimum rental for this bike is ' + v.min + ' days.' };
    if (se === 'low' && d >= 30) return { ok: true, days: d, se: se, v: v, txt: v.month + ' THB/month', note: '30+ days use the monthly rate. We confirm the exact total on WhatsApp.' };
    var T = tierList(v, se), rate = function (x) { for (var i = 0; i < T.length; i++) if (x >= T[i].a && (T[i].b == null || x <= T[i].b)) return T[i].p; return T[T.length - 1].p; };
    var best = d * rate(d), capped = false;
    if (se === 'high') for (var x = d + 1; x <= d + 30; x++) { var c = x * rate(x); if (c < best) { best = c; capped = true; } }
    return { ok: true, days: d, se: se, v: v, txt: fmt(best) + ' THB', note: d + ' days × ' + fmt(rate(d)) + ' THB/day' + (capped ? ' = ' + fmt(d * rate(d)) + ' THB. A longer rental costs less, so you pay the lower price.' : '') + ' · ' + se + ' season · deposit ' + v.dep };
  }
  function tourQuote() {
    var t = tourOf(), a = st.tour.adults, k = st.tour.kids;
    if (t.from) return { txt: 'from ' + fmt(t.price) + ' THB', note: 'Price ' + t.unit + '. We confirm the exact option and total on WhatsApp.' };
    if (t.child) return { txt: fmt(a * t.price + k * t.child) + ' THB', note: a + ' × ' + fmt(t.price) + ' (adult)' + (k ? ' + ' + k + ' × ' + fmt(t.child) + ' (child)' : '') + '. We confirm the total on WhatsApp.' };
    return { txt: fmt(t.price) + ' THB', note: 'Price ' + t.unit + '.' };
  }
  function quote() { return st.kind === 'bike' ? bikeQuote() : tourQuote(); }

  /* ---------- summary + message ---------- */
  function summary() {
    if (st.kind === 'bike') {
      var b = st.bike, q = bikeQuote();
      return [['Motorbike', bike.name + (q.v && bike[q.se].length > 1 ? ' — ' + q.v.name : '')], ['Pickup date', b.pick || '—'], ['Return date', b.ret || '—'], ['Days', q.days ? String(q.days) : '—'], ['Pickup', b.method === 'delivery' ? 'Delivery to ' + (b.addr || '—') : 'Collect at our shop in Chalong']];
    }
    var t = tourOf(), s = st.tour;
    return [['Tour', t.title], ['Date', s.date || '—'], ['Guests', s.adults + ' adult' + (s.adults > 1 ? 's' : '') + (t.child ? ', ' + s.kids + ' child' + (s.kids === 1 ? '' : 'ren') : '')], ['Hotel / pickup', s.hotel || '—']];
  }
  function message() {
    var L = ["Hi Island Rides! I'd like to send a booking request."];
    summary().forEach(function (r) { L.push(r[0] + ': ' + r[1]); });
    L.push('Estimate shown: ' + quote().txt);
    L.push('Name: ' + st.c.name, 'WhatsApp: ' + st.c.wa);
    if (st.c.notes) L.push('Notes: ' + st.c.notes);
    L.push('Please confirm the price and details.');
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
    h += fld('wa', 'WhatsApp number', 'tel', st.c.wa, '+66 …', ' autocomplete="tel"');
    h += '<label class="rd-fld"><span>Notes (optional)</span><textarea id="rdm-notes" data-k="notes" rows="2" placeholder="Anything we should know">' + esc(st.c.notes) + '</textarea></label>';
    h += '<div class="rdm-acts"><button type="button" class="rd-btn rd-btn-o grow" data-act="to2">Check my request</button></div>';
    return h;
  }
  function feeBox() {
    var q = quote(), list = '<li>Estimate: <b>' + esc(q.txt) + '</b></li>' + (q.note ? '<li>' + esc(q.note) + '</li>' : '');
    if (st.kind === 'bike') {
      list += '<li>Card payment +5% · USDT +3% · cash, bank transfer or Wise: no extra fee</li><li>Deposit (cash or passport) is refunded within 24 hours after return if there is no damage.</li>' + (st.bike.method === 'delivery' ? '<li>Delivery fee depends on the area and bike size. We quote it on WhatsApp.</li>' : '');
    } else {
      list += '<li>We confirm the final price, payment method and any payment fee on WhatsApp before you pay.</li>';
    }
    list += '<li>Nothing is charged until our team confirms.</li>';
    return '<div class="rdm-fee"><b>Price and fees</b><ul>' + list + '</ul></div>';
  }
  function step2() {
    var cells = summary().concat([['Name', st.c.name], ['WhatsApp', st.c.wa]]);
    if (st.c.notes) cells.push(['Notes', st.c.notes]);
    return '<p class="rdm-note" style="font-size:14px">Check your request. Nothing has been sent yet.</p><div class="rdm-sum">' + cells.map(function (c) { return '<div><small>' + esc(c[0]) + '</small><b>' + esc(c[1]) + '</b></div>'; }).join('') + '</div>' + feeBox() +
      '<div class="rdm-acts"><button type="button" class="rd-btn rd-btn-l" data-act="to1">Edit details</button><button type="button" class="rd-btn rd-btn-o grow" data-act="to3">Continue</button></div>';
  }
  function step3() {
    if (st.sent) return '<div class="rdm-status" role="status"><h3>Request sent to WhatsApp — waiting for our confirmation</h3><p style="margin:6px 0 0">Your booking is <b>not confirmed yet</b>. Our team replies on WhatsApp with the final price and details. Nothing is charged until we confirm.</p><p class="rdm-note" style="margin-top:8px">WhatsApp didn\'t open? Message us at <b>+66 80 314 0043</b> and paste the message below.</p></div><div class="rdm-msg" id="rdm-msg">' + esc(message()) + '</div><div class="rdm-acts"><button type="button" class="rd-btn rd-btn-l" data-act="copy">Copy message</button><button type="button" class="rd-btn rd-btn-l" data-act="to2">Edit request</button><button type="button" class="rd-btn rd-btn-n grow" data-act="close">Done</button></div>';
    return '<p style="margin:0">This message opens in WhatsApp. Our team replies to confirm the price and details. Your booking is not confirmed until we reply.</p><div class="rdm-msg" id="rdm-msg" aria-label="Message preview">' + esc(message()) + '</div>' +
      '<div class="rdm-acts"><button type="button" class="rd-btn rd-btn-l" data-act="to2">Back</button><button type="button" class="rd-btn rd-btn-wa grow" data-act="send">Send booking request</button></div>';
  }
  function render(focusFirst) {
    if (!back) return;
    var labels = ['Fill in details', 'Check', 'Send via WhatsApp'];
    var steps = '<ol class="rdm-steps" aria-label="Booking progress">' + labels.map(function (l, i) { var n = i + 1, cls = (n < st.step || (st.sent && n === 3)) ? 'done' : (n === st.step ? 'now' : ''); return '<li class="' + cls + '"' + (n === st.step ? ' aria-current="step"' : '') + '><span class="d">' + (cls === 'done' ? check : n) + '</span><span>' + l + '</span></li>'; }).join('') + '</ol>';
    var title = st.kind === 'bike' ? 'Request: ' + bike.name : 'Tour booking request';
    back.querySelector('.rdm').innerHTML = '<div class="rdm-h"><h2 id="rdm-title">' + esc(title) + '</h2><button type="button" class="rdm-x" data-act="close" aria-label="Close">×</button></div><div class="rdm-b">' + steps + (st.step === 1 ? step1() : st.step === 2 ? step2() : step3()) + '</div>';
    if (focusFirst) { var el = back.querySelector('.rd-fld.bad input, .rd-fld.bad select') || back.querySelector('.rdm-b input, .rdm-b select, .rdm-b .rd-btn'); if (el) el.focus(); }
  }
  function validate() {
    var e = {};
    if (st.kind === 'bike') {
      var q = bikeQuote();
      if (!st.bike.pick) e.pick = 'Choose a pickup date.';
      if (!st.bike.ret) e.ret = 'Choose a return date.'; else if (!q.ok) e.ret = q.note || 'Check the dates.';
      if (st.bike.method === 'delivery' && !String(st.bike.addr || '').trim()) e.addr = 'Enter where we should deliver the bike.';
    } else {
      if (!st.tour.date) e.date = 'Choose a tour date.';
      if (!String(st.tour.hotel || '').trim()) e.hotel = 'Enter your hotel or pickup point.';
    }
    if (!st.c.name.trim()) e.name = 'Enter your name.';
    if (!/^\+?[\d\s()-]{8,}$/.test(st.c.wa.trim())) e.wa = 'Enter a WhatsApp number with country code, e.g. +44 7700 900123.';
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
    if (k === 'name' || k === 'wa' || k === 'notes') st.c[k] = v;
    else if (st.kind === 'bike') st.bike[k] = v; else st.tour[k] = v;
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
    if (d.method) { st.bike.method = d.method; render(); return; }
    var a = d.act; if (!a) return;
    if (a === 'close') { close(); return; }
    if (a === 'to1') { st.step = 1; st.sent = false; render(true); return; }
    if (a === 'to2') { if (st.step === 1) { st.err = validate(); if (Object.keys(st.err).length) { render(true); return; } } st.step = 2; st.sent = false; render(true); return; }
    if (a === 'to3') { st.step = 3; st.sent = false; render(true); return; }
    if (a === 'send') {
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(message()), '_blank', 'noopener');
      st.sent = true; render(true); return;
    }
    if (a === 'copy') {
      var txt = message();
      var done = function () { btn.textContent = 'Copied'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { selectMsg(); });
      else selectMsg();
    }
  }
  function selectMsg() { var m = back.querySelector('#rdm-msg'); if (!m) return; var r = document.createRange(); r.selectNodeContents(m); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }

  window.IRBook = {
    openTour: function (list, id) {
      items = list; if (st.kind !== 'tour') { st.step = 1; st.sent = false; }
      st.kind = 'tour'; st.err = {};
      st.tour.id = id || st.tour.id || list[0].id; if (!st.tour.adults) st.tour.adults = 2; if (st.tour.kids == null) st.tour.kids = 0;
      if (st.step === 3 && st.sent) { st.step = 1; st.sent = false; }
      open();
    },
    openBike: function (b) {
      if (st.kind !== 'bike' || !bike || bike.id !== b.id) { st.step = 1; st.sent = false; st.bike = { pick: st.bike.pick || '', ret: st.bike.ret || '', variant: '', method: st.bike.method || 'shop', addr: st.bike.addr || '' }; }
      bike = b; st.kind = 'bike'; st.err = {};
      if (st.step === 3 && st.sent) { st.step = 1; st.sent = false; }
      open();
    }
  };
})();
