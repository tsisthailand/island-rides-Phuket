/* Island Rides booking: fill in the form, then WhatsApp opens with the details. The team confirms the booking by message. */
(function () {
  var WA = '66803140043';
  var APPS = {
    wa: { name: 'WhatsApp', label: 'WhatsApp number', type: 'tel', ph: '+44 7700 900123', url: function (m) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(m); } }
  };
  var MAIL = 'https://formsubmit.co/ajax/t.sisthailand@gmail.com';
  function app() { return APPS[st.c.app] || APPS.wa; }
  var LOWHEAD = ['1–6 days', '7–14 days', '15–29 days', '30+ days', '3+ months'];
  var st = { kind: null, step: 1, sent: false, err: {}, tour: {}, bike: {}, car: {}, c: { name: '', email: '', app: 'wa', wa: '', notes: '' }, mail: '' };
  var items = [], bike = null, car = null, back = null, lastFocus = null, prog = null;
  st.p = {}; st.c.contact = '';
  try { var saved = JSON.parse(sessionStorage.getItem('irbook') || 'null'); if (saved) { st.p = saved.p || {}; ['name', 'email', 'wa', 'contact'].forEach(function (k) { if (saved.c && saved.c[k]) st.c[k] = saved.c[k]; }); } } catch (x) {}
  function save() { try { sessionStorage.setItem('irbook', JSON.stringify({ p: st.p, c: { name: st.c.name, email: st.c.email, wa: st.c.wa, contact: st.c.contact } })); } catch (x) {} }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dmy(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  function today() { var t = new Date(); return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
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

  /* ---------- program forms (one per tour program, copied from the original page forms) ---------- */
  function pv() { return st.p[prog.key] || (st.p[prog.key] = {}); }
  function fieldOf(k) { for (var i = 0; i < prog.fields.length; i++) if (prog.fields[i].k === k) return prog.fields[i]; }
  function optOf() { var f = fieldOf('opt'); return f.options[Math.min(pv().opt || 0, f.options.length - 1)]; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function groupsOf() {
    var o = optOf(), f = fieldOf('pax'), g;
    if (o.groups) g = o.groups;
    else if (f && f.groups) g = f.groups;
    else {
      g = [{ k: 'adults', label: 'Adults', one: 'adult', many: 'adults', min: 1, price: o.price },
           { k: 'kids', label: o.childLabel || 'Children', one: 'child', many: 'children', kid: true, price: o.child }];
      if (o.infant) g.push({ k: 'inf', label: o.infant.label, one: o.infant.one, many: o.infant.many, kid: true, price: o.price ? 0 : undefined });
    }
    if (o.durations) { var d = curDur(); g = g.map(function (x, i) { var y = {}; for (var k in x) y[k] = x[k]; y.price = i === 0 ? d.d : d.p; return y; }); }
    return g.map(function (x) {
      var y = {}; for (var k in x) y[k] = x[k];
      if (y.sub == null && y.price != null) y.sub = y.price === 0 ? 'Free' : fmt(y.price) + ' THB ' + (y.unitLabel || 'each');
      return y;
    });
  }
  function curDur() { var o = optOf(); if (!o.durations) return null; return o.durations[Math.min(pv().dur || 0, o.durations.length - 1)]; }
  function gval(g) { var v = pv()[g.k]; return v == null ? (g.min ? (g.k === 'adults' ? 2 : 1) : 0) : v; }
  function kidsIn() { return groupsOf().some(function (g) { return g.kid && gval(g) > 0; }); }
  function units() { var f = fieldOf('units'); if (!f) return null; var v = pv().units; return v == null ? 1 : v; }
  function peopleTotal() { return groupsOf().reduce(function (s, g) { return s + gval(g); }, 0); }
  function peopleText() {
    var t = groupsOf().filter(function (g, i) { return i === 0 || gval(g) > 0; }).map(function (g) { return plural(gval(g), g.one, g.many); }).join(', ');
    var ages = String(pv().ages || '').trim();
    if (ages && kidsIn()) t += ' (' + ages + ')';
    return t;
  }
  /* price lines: quantity × unit price, then a total. Returns null when the page has no fixed price. */
  function priceLines() {
    var o = optOf(), L = [];
    if (o.unitPrice) {
      var uf = fieldOf('units'), q = uf ? units() : 1, un = uf ? uf.unit : (o.unit || ['unit', 'units']);
      L.push({ label: un[1].charAt(0).toUpperCase() + un[1].slice(1), qty: q, unit: o.unitPrice, sub: q * o.unitPrice, per: 'per ' + un[0] });
    } else {
      var gs = groupsOf();
      if (!gs.length || gs.some(function (g) { return g.price == null; })) return null;
      gs.forEach(function (g) { var q = gval(g); if (q > 0) L.push({ label: g.label, qty: q, unit: g.price, sub: q * g.price }); });
    }
    return { lines: L, total: L.reduce(function (s, l) { return s + l.sub; }, 0) };
  }
  /* capacity and tour rules checked live and before sending */
  function rules() {
    var o = optOf(), gs = groupsOf(), errs = [];
    gs.forEach(function (g) {
      if (g.maxOf) { var ref = gs.filter(function (x) { return x.k === g.maxOf; })[0]; if (ref && gval(g) > gval(ref)) errs.push(g.maxMsg); }
      if (g.max && gval(g) > g.max) errs.push('Online booking is for up to ' + g.max + ' ' + g.many + '. For a larger group please message us.');
    });
    var uf = fieldOf('units');
    if (uf) {
      var u = units(), ppl = peopleTotal();
      if (u > uf.max) errs.push('Online booking is for up to ' + uf.max + ' ' + uf.unit[1] + '. For a larger group please message us.');
      if (ppl > u * uf.perUnit) errs.push('Each ' + uf.unit[0] + ' takes up to ' + uf.perUnit + ' people. ' + ppl + ' people need at least ' + Math.ceil(ppl / uf.perUnit) + ' ' + uf.unit[1] + '.');
      if (ppl < u) errs.push('Each ' + uf.unit[0] + ' needs a rider. Add people or choose fewer ' + uf.unit[1] + '.');
    }
    if (o.cap && peopleTotal() > o.cap) errs.push('This boat takes up to ' + o.cap + ' guests. For more guests please message us.');
    var tf = fieldOf('time');
    if (tf && tf.rule && o[tf.rule] && o[tf.rule].indexOf(pv().time || 0) < 0) errs.push(tf.ruleMsg);
    return errs;
  }
  function bookingRef() {
    var v = pv();
    if (!v.ref) { var d = new Date(), r = ''; for (var i = 0; i < 4; i++) r += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32)); v.ref = 'IR-' + String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + r; save(); }
    return v.ref;
  }
  function progVal(f) {
    var v = pv();
    if (f.k === 'name' || f.k === 'contact') return st.c[f.k] || '';
    if (f.type === 'select') { var o = f.options[Math.min(v[f.k] || 0, f.options.length - 1)]; return o.value || o.text; }
    if (f.type === 'dyn') { var d = curDur(); return d ? d.t : ''; }
    if (f.type === 'combo') return f.parts.map(function (k) { return progVal(fieldOf(k)); }).filter(function (x) { return String(x).trim(); }).join(', ');
    if (f.type === 'date') return dmy(v[f.k]);
    if (f.type === 'people') return peopleText();
    return v[f.k] || '';
  }
  function progLines(withRef) {
    var L = [prog.intro];
    prog.msgOrder.forEach(function (k) { var f = fieldOf(k), val = progVal(f); L.push(f.msg + ': ' + (String(val).trim() ? val : (f.empty || ''))); });
    var pl = priceLines(), o = optOf();
    if (pl && pl.lines.length) {
      pl.lines.forEach(function (l) { L.push(l.label + ': ' + l.qty + ' × ' + (l.unit ? fmt(l.unit) + ' THB' : 'free') + ' = ' + fmt(l.sub) + ' THB'); });
      L.push('Total: ' + fmt(pl.total) + ' THB');
    } else if (o.fromPrice) L.push('Price: from ' + fmt(o.fromPrice) + ' THB (we confirm the total)');
    if (withRef !== false) L.push('Booking ref: ' + bookingRef());
    if (String(st.c.email || '').trim()) L.push('Email: ' + String(st.c.email).trim());
    return L;
  }
  function summaryBox() {
    var pl = priceLines(), o = optOf(), h = '<div class="rdm-sumbox"><b>Booking summary</b>';
    if (pl && pl.lines.length) {
      h += '<table>' + pl.lines.map(function (l) { return '<tr><td>' + esc(l.label) + '</td><td class="n">' + l.qty + ' × ' + (l.unit ? fmt(l.unit) : 'free') + '</td><td class="n">' + fmt(l.sub) + '</td></tr>'; }).join('') +
        '<tr class="tot"><td>Total</td><td></td><td class="n">' + fmt(pl.total) + ' THB</td></tr></table>';
    } else if (o.fromPrice) h += '<p>From ' + fmt(o.fromPrice) + ' THB. We confirm the total by message.</p>';
    else h += '<p>We confirm the price by message.</p>';
    h += '<p class="rdm-avail">' + esc(peopleText()) + (units() ? ' · ' + plural(units(), fieldOf('units').unit[0], fieldOf('units').unit[1]) : '') + '. Availability is checked by our team before your booking is confirmed.</p></div>';
    return h;
  }
  function progForm() {
    var h = '', v = pv(), live = rules();
    prog.fields.forEach(function (f) {
      var e = st.err[f.k];
      if (f.type === 'combo') return;
      if (f.type === 'select' || f.type === 'dyn') {
        var opts = f.type === 'dyn' ? (optOf()[f.from] || []).map(function (d) { return { text: d.t }; }) : f.options;
        if (!opts.length || (f.type === 'dyn' && opts.length === 1 && false)) return;
        if (f.type === 'dyn' && !optOf()[f.from]) return;
        var cur = Math.min(v[f.k] || 0, opts.length - 1);
        h += '<label class="rd-fld' + (e ? ' bad' : '') + '"><span>' + esc(f.label) + '</span><select id="rdm-' + f.k + '" data-k="' + f.k + '"' + (opts.length === 1 ? ' disabled' : '') + '>' + opts.map(function (o, i) { return '<option value="' + i + '"' + (i === cur ? ' selected' : '') + '>' + esc(o.text) + '</option>'; }).join('') + '</select>' + (e ? '<span class="err">' + esc(e) + '</span>' : '') + '</label>';
        if (f.k === 'opt') {
          var o = f.options[cur];
          if (o.price) h += '<div class="rdm-info"><b>Price per person</b><span>Adult ' + fmt(o.price) + ' THB · ' + esc(o.childLabel) + ' ' + fmt(o.child) + ' THB' + (o.infant ? ' · ' + esc(o.infant.label) + ' free' : '') + '</span></div>';
          else if (o.info) h += '<div class="rdm-info"><b>Price</b><span>' + esc(o.info) + '</span></div>';
        }
        if (f.type === 'select' && opts[cur].info) h += '<p class="rdm-note" style="margin:-6px 0 0">' + esc(opts[cur].info) + '</p>';
      } else if (f.type === 'units') {
        h += '<div class="rd-fld"><span>' + esc(f.label) + '</span>' + cnt('units', f.unit[1].charAt(0).toUpperCase() + f.unit[1].slice(1), fmt(optOf().unitPrice) + ' THB per ' + f.unit[0] + ' · up to ' + f.perUnit + ' people each', units(), 1, f.max) + '</div>';
      } else if (f.type === 'people') {
        h += '<div class="rd-fld' + (e || live.length ? ' bad' : '') + '"><span>' + esc(f.label) + '</span>';
        var gs0 = groupsOf();
        gs0.forEach(function (g) { var hi = g.max || 40; if (g.maxOf) { var rf = gs0.filter(function (x) { return x.k === g.maxOf; })[0]; if (rf) hi = Math.min(hi, gval(rf)); } h += cnt(g.k, g.label, g.sub || '', gval(g), g.min || 0, hi); });
        if (kidsIn()) h += fld('ages', "Children's ages (optional)", 'text', v.ages || '', 'e.g. 6, 9');
        if (f.hint) h += '<p class="rdm-note" style="margin:2px 0 0">' + esc(f.hint) + '</p>';
        live.forEach(function (m) { h += '<span class="err" role="alert">' + esc(m) + '</span>'; });
        h += '</div>';
      } else if (f.k === 'name' || f.k === 'contact') {
        h += fld(f.k, f.label, f.type, st.c[f.k], f.ph, f.k === 'name' ? ' autocomplete="name"' : ' autocomplete="tel"');
        if (f.k === 'contact') h += fld('email', 'Email (optional)', 'email', st.c.email, 'you@example.com', ' autocomplete="email"');
      } else h += fld(f.k, f.label, f.type, v[f.k] || '', f.ph);
    });
    h += summaryBox();
    h += payBox();
    h += '<div class="rdm-acts"><button type="button" class="rd-btn rd-btn-wa grow" data-act="send">Send via WhatsApp</button></div><p class="rdm-note" style="text-align:center">' + esc(prog.note) + ' WhatsApp opens with your message ready. Your booking is confirmed only when our team replies.</p>' +
      '<p class="rdm-note" style="text-align:center;margin:0"><button type="button" class="rdm-link" data-act="reset" data-opt="' + (pv().opt || 0) + '">Clear form and start again</button></p>';
    return h;
  }
  function progValidate() {
    var e = {}, v = pv();
    prog.fields.forEach(function (f) {
      if (!f.req || f.type === 'select' || f.type === 'people') return;
      var val = (f.k === 'name' || f.k === 'contact') ? st.c[f.k] : v[f.k];
      if (!String(val || '').trim()) e[f.k] = f.type === 'date' ? 'Choose a date.' : 'Please fill in ' + f.label.toLowerCase() + '.';
    });
    var em = String(st.c.email || '').trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) e.email = 'Check the email address, or leave it empty.';
    var r = rules(); if (r.length) e.pax = r[0];
    return e;
  }

  /* ---------- summary + message ---------- */
  function summary() {
    if (st.kind === 'prog') { var o = optOf(), f = fieldOf('opt'); return [[f.msg, o.value || o.text]]; }
    if (st.kind === 'bike') {
      var b = st.bike, q = bikeQuote();
      return [['Motorbike', bike.name + (q.v && bike[q.se].length > 1 ? ' — ' + q.v.name : '')], ['Pickup date', dmy(b.pick) || '—'], ['Return date', dmy(b.ret) || '—'], ['Days', q.days ? String(q.days) : '—'], ['Pickup', b.method === 'delivery' ? 'Delivery to ' + (b.addr || '—') : 'Collect at our shop in Chalong']];
    }
    if (st.kind === 'car') {
      var c = st.car, cq = carQuote();
      return [['Car', car.name], ['Pickup date', dmy(c.pick) || '—'], ['Return date', dmy(c.ret) || '—'], ['Days', cq.days ? String(cq.days) : '—'], ['Pickup', c.method === 'delivery' ? 'Delivery / airport: ' + (c.addr || '—') : 'Collect at our shop in Chalong']];
    }
    var t = tourOf(), s = st.tour;
    return [['Tour', t.title], ['Date', dmy(s.date) || '—'], ['Guests', s.adults + ' adult' + (s.adults > 1 ? 's' : '') + (t.child ? ', ' + s.kids + ' child' + (s.kids === 1 ? '' : 'ren') : '')], ['Hotel / pickup', s.hotel || '—']];
  }
  function message() {
    if (st.kind === 'prog') return progLines().join('\n');
    var L = ["Hi Island Rides! I'd like to book:"];
    summary().forEach(function (r) { L.push(r[0] + ': ' + r[1]); });
    L.push('Estimate shown: ' + quote().txt);
    if (st.kind === 'tour') { L.push('Name: ' + st.c.name); if (st.c.email.trim()) L.push('Email: ' + st.c.email.trim()); L.push('WhatsApp: ' + st.c.wa); }
    else L.push('Name: ' + st.c.name, 'Email: ' + st.c.email, 'WhatsApp: ' + st.c.wa);
    if (st.c.notes) L.push('Notes: ' + st.c.notes);
    L.push('Please confirm my booking.');
    return L.join('\n');
  }

  /* ---------- views ---------- */
  function fld(key, label, type, val, ph, extra) {
    var e = st.err[key];
    if (type === 'date') return '<label class="rd-fld' + (e ? ' bad' : '') + '"><span>' + label + '</span><div class="rd-date"><input id="rdm-' + key + '" data-k="' + key + '" type="date" min="' + today() + '" value="' + esc(val) + '" aria-label="' + esc(label) + ' (day/month/year)"><span class="rd-date-v' + (val ? '' : ' ph') + '" aria-hidden="true">' + (val ? dmy(val) : 'dd/mm/yyyy') + '</span></div>' + (e ? '<span class="err">' + esc(e) + '</span>' : '') + '</label>';
    return '<label class="rd-fld' + (e ? ' bad' : '') + '"><span>' + label + '</span><input id="rdm-' + key + '" data-k="' + key + '" type="' + type + '" value="' + esc(val) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + (extra || '') + '>' + (e ? '<span class="err">' + esc(e) + '</span>' : '') + '</label>';
  }
  function cnt(key, label, sub, val, min, max) {
    return '<div class="rdm-cnt"><div><b>' + label + '</b><small>' + sub + '</small></div><div class="c"><button type="button" data-cnt="' + key + ':-1" aria-label="Fewer ' + label.toLowerCase() + '"' + (min != null && val <= min ? ' disabled' : '') + '>−</button><output aria-live="polite">' + val + '</output><button type="button" data-cnt="' + key + ':1" aria-label="More ' + label.toLowerCase() + '"' + (max != null && val >= max ? ' disabled' : '') + '>+</button></div></div>';
  }
  function step1() {
    if (st.kind === 'prog') return progForm();
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
      if (t.child) h += cnt('kids', 'Children', fmt(t.child) + ' THB each' + (t.childLabel ? ' · ' + esc(t.childLabel) : ''), s.kids);
      h += fld('hotel', 'Hotel / pickup point', 'text', s.hotel, 'Hotel name or area');
    }
    var q = quote();
    h += '<div class="rdm-est"><span>Estimate</span><b>' + esc(q.txt) + '</b></div>' + (q.note ? '<p class="rdm-note">' + esc(q.note) + '</p>' : '');
    h += fld('name', 'Full name', 'text', st.c.name, 'Your name', ' autocomplete="name"');
    h += fld('email', st.kind === 'tour' ? 'Email (optional)' : 'Email', 'email', st.c.email, 'you@example.com', ' autocomplete="email"');
    h += fld(st.c.app, app().label, app().type, st.c[st.c.app], app().ph, st.c.app === 'wa' ? ' autocomplete="tel"' : '');
    h += '<label class="rd-fld"><span>Notes (optional)</span><textarea id="rdm-notes" data-k="notes" rows="2" placeholder="Anything we should know">' + esc(st.c.notes) + '</textarea></label>';
    h += payBox();
    h += '<div class="rdm-acts"><button type="button" class="rd-btn rd-btn-wa grow" data-act="send">Send booking via WhatsApp</button></div><p class="rdm-note" style="text-align:center">We get your booking by email, and WhatsApp opens with your details filled in. We confirm your booking on WhatsApp.</p>';
    return h;
  }
  function payBox() {
    var extra = st.kind === 'car' ? '<li>Deposit for this car: ' + esc(car.dep) + '. Refunded within 24–72 hours after return if there is no damage.</li>' + (st.car.method === 'delivery' ? '<li>We confirm delivery or airport pick-up details by message.</li>' : '') : st.kind === 'bike' ? '<li>Deposit: cash or passport, refunded within 24 hours after return if there is no damage.</li>' + (st.bike.method === 'delivery' ? '<li>Delivery fee depends on the area and bike size. We tell you by message.</li>' : '') : '';
    return '<div class="rdm-fee"><b>Payment</b><ul><li>Cash, bank transfer or Wise: no extra fee</li><li>Credit card: +5%</li><li>USDT: +3%</li>' + extra + '<li>You pay after we confirm your booking by message.</li></ul></div>';
  }
  function mailNote() {
    if (st.kind === 'bike' || st.kind === 'car') {
      return st.mail === 'ok' ? '✓ Your booking details were also sent to our team by email.' : st.mail === 'fail' ? '' : 'Sending your booking to our team by email…';
    }
    return st.mail === 'ok' ? '✓ A copy of your booking details was also emailed to our team.' : st.mail === 'fail' ? '' : 'Sending your booking to our team by email…';
  }
  function done() {
    if (st.kind === 'bike' || st.kind === 'car') {
      return '<div class="rdm-send" role="status"><div class="rdm-send-i" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 20.5 22 12 2.5 3.5l.02 6.6L16 12 2.52 13.9z"/></svg></div><div><h3>One more step: tap Send in WhatsApp</h3><p>Your booking is typed in WhatsApp but <b>not sent yet</b>. Tap the green <b>Send ➤</b> button there so we can reply to you quickly.</p></div></div>' +
        '<p class="rdm-note" id="rdm-mail" aria-live="polite" style="margin:0">' + mailNote() + '</p>' +
        '<div class="rdm-acts"><button type="button" class="rd-btn rd-btn-wa grow" data-act="send">Open WhatsApp again</button></div>' +
        '<p class="rdm-note" style="margin-top:10px">Our team confirms your booking on WhatsApp. You pay after we confirm. WhatsApp didn\'t open? Message us at <b>+66 80 314 0043</b> and paste the text below.</p><div class="rdm-msg" id="rdm-msg">' + esc(message()) + '</div><div class="rdm-acts"><button type="button" class="rd-btn rd-btn-l" data-act="copy">Copy message</button><button type="button" class="rd-btn rd-btn-l" data-act="to1">Edit details</button><button type="button" class="rd-btn rd-btn-n grow" data-act="close">Done</button></div>';
    }
    return (st.kind === 'prog' ? '<p class="rdm-ref">Booking request <b>' + esc(bookingRef()) + '</b></p>' : '') + '<div class="rdm-send" role="status"><div class="rdm-send-i" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 20.5 22 12 2.5 3.5l.02 6.6L16 12 2.52 13.9z"/></svg></div><div><h3>Not booked yet: tap Send in WhatsApp</h3><p>Opening WhatsApp does <b>not</b> send your message or confirm your booking. Tap the green <b>Send ➤</b> button in WhatsApp. Your booking is confirmed only when our team replies.</p></div></div>' + (st.kind === 'prog' ? summaryBox() : '') +
      '<p class="rdm-note" id="rdm-mail" aria-live="polite" style="margin:0">' + mailNote() + '</p>' +
      '<div class="rdm-acts"><button type="button" class="rd-btn rd-btn-wa grow" data-act="send">Open WhatsApp again</button></div>' +
      '<p class="rdm-note" style="margin-top:10px">Our team confirms your booking on WhatsApp. You pay after we confirm. WhatsApp didn\'t open? Message us at <b>+66 80 314 0043</b> and paste the text below.</p><div class="rdm-msg" id="rdm-msg">' + esc(message()) + '</div><div class="rdm-acts"><button type="button" class="rd-btn rd-btn-l" data-act="copy">Copy message</button><button type="button" class="rd-btn rd-btn-l" data-act="to1">Edit details</button><button type="button" class="rd-btn rd-btn-n grow" data-act="close">Done</button></div>' +
      '<p class="rdm-note" style="text-align:center;margin:0"><button type="button" class="rdm-link" data-act="reset"' + (st.kind === 'prog' ? ' data-opt="' + (pv().opt || 0) + '"' : '') + '>Start a new booking</button></p>';
  }
  function sendMail(msg) {
    if (st.mailed === msg) return;
    st.mailed = msg; st.mail = 'sending';
    var item = summary()[0];
    var body = { _subject: (st.kind === 'prog' ? 'New booking ' + bookingRef() + ': ' : 'New booking: ') + item[1] + ' — ' + st.c.name, _template: 'table', _captcha: 'false', _replyto: st.c.email, Booking: item[0] + ': ' + item[1], Name: st.c.name, Email: st.c.email, WhatsApp: st.kind === 'prog' ? st.c.contact : st.c.wa, Details: msg };
    var upd = function (r) { st.mail = r; var n = back && back.querySelector('#rdm-mail'); if (n) n.textContent = mailNote(); };
    try {
      fetch(MAIL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body), keepalive: true })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { upd(r.ok && String(j.success) !== 'false' ? 'ok' : 'fail'); }); }, function () { upd('fail'); });
    } catch (x) { upd('fail'); }
  }
  function render(focusFirst) {
    if (!back) return;
    if (st.kind === 'tour') { try { document.dispatchEvent(new CustomEvent('irbook:tour', { detail: { id: st.tour.id, adults: st.tour.adults, kids: st.tour.kids } })); } catch (x) {} }
    if (st.kind === 'prog') { save(); try { document.dispatchEvent(new CustomEvent('irbook:tour', { detail: { id: optOf().id, adults: pv().adults || 1, kids: pv().kids || 0 } })); } catch (x) {} }
    var title = st.kind === 'bike' ? 'Book: ' + bike.name : st.kind === 'car' ? 'Book: ' + car.name : st.kind === 'prog' ? prog.title : 'Book a tour';
    back.querySelector('.rdm').innerHTML = '<div class="rdm-h"><h2 id="rdm-title">' + esc(title) + '</h2><button type="button" class="rdm-x" data-act="close" aria-label="Close">×</button></div><div class="rdm-b">' + (st.sent ? done() : step1()) + '</div>';
    if (focusFirst) { var el = back.querySelector('.rd-fld.bad input, .rd-fld.bad select') || back.querySelector('.rdm-b input, .rdm-b select, .rdm-b .rd-btn'); if (el) el.focus({ preventScroll: !!st.sent }); }
    if (focusFirst && st.sent) { back.scrollTop = 0; }
  }
  function validate() {
    if (st.kind === 'prog') return progValidate();
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
    if (st.kind !== 'tour' || st.c.email.trim()) { if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(st.c.email.trim())) e.email = st.kind === 'tour' ? 'Check the email address, or leave it empty.' : 'Enter a valid email address.'; }
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
    if (k === 'name' || k === 'email' || k === 'wa' || k === 'notes' || (k === 'contact' && st.kind === 'prog')) st.c[k] = v;
    else if (st.kind === 'prog') pv()[k] = v;
    else if (st.kind === 'bike') st.bike[k] = v; else if (st.kind === 'car') st.car[k] = v; else st.tour[k] = v;
  }
  function onInput(e) {
    var k = e.target.dataset && e.target.dataset.k; if (!k) return;
    setVal(k, e.target.value); if (st.kind === 'prog') save();
    if (e.target.type === 'date') { var dv = e.target.nextElementSibling; if (dv) { dv.textContent = dmy(e.target.value) || 'dd/mm/yyyy'; dv.classList.toggle('ph', !e.target.value); } }
    if (st.err[k]) { delete st.err[k]; var f = e.target.closest('.rd-fld'); if (f) { f.classList.remove('bad'); var m = f.querySelector('.err'); if (m) m.remove(); } }
  }
  function onChange(e) {
    var k = e.target.dataset && e.target.dataset.k; if (!k) return;
    if (k === 'tid') { st.tour.id = e.target.value; render(); return; }
    if (st.kind === 'prog' && e.target.tagName === 'SELECT') { pv()[k] = +e.target.value; if (k === 'opt') pv().dur = 0; delete st.err[k]; render(); var se = back.querySelector('#rdm-' + k); if (se) se.focus(); return; }
    if (k === 'pick' || k === 'ret' || k === 'variant') { setVal(k, e.target.value); delete st.err[k]; render(); var el = back.querySelector('#rdm-' + k); if (el) el.focus(); }
  }
  function onClick(e) {
    if (e.target === back) { close(); return; }
    if (e.target.type === 'date' && e.target.showPicker) { try { e.target.showPicker(); } catch (x) {} return; }
    var btn = e.target.closest('button'); if (!btn) return;
    var d = btn.dataset;
    if (d.cnt && st.kind === 'prog') {
      var pp = d.cnt.split(':'), step = Number(pp[1]), gs = groupsOf(), uf = fieldOf('units');
      if (pp[0] === 'units' && uf) pv().units = Math.max(1, Math.min(uf.max, units() + step));
      else {
        var gg = gs.filter(function (x) { return x.k === pp[0]; })[0];
        if (gg) {
          var hi = gg.max || 40;
          if (gg.maxOf && step > 0) { var ref = gs.filter(function (x) { return x.k === gg.maxOf; })[0]; if (ref) hi = Math.min(hi, gval(ref)); }
          pv()[gg.k] = Math.max(gg.min || 0, Math.min(hi, gval(gg) + step));
          gs.forEach(function (x) { if (x.maxOf === gg.k && gval(x) > gval(gg)) pv()[x.k] = gval(gg); });
        }
      }
      delete st.err.pax; render();
      var again = back.querySelector('[data-cnt="' + d.cnt + '"]'); if (again) again.focus();
      return;
    }
    if (d.cnt) { var p = d.cnt.split(':'), k = p[0], min = k === 'adults' ? 1 : 0; st.tour[k] = Math.max(min, Math.min(30, (st.tour[k] || 0) + Number(p[1]))); render(); return; }
    if (d.method) { (st.kind === 'car' ? st.car : st.bike).method = d.method; render(); return; }
    var a = d.act; if (!a) return;
    if (a === 'close') { close(); return; }
    if (a === 'to1') { st.sent = false; render(true); return; }
    if (a === 'reset') {
      st.p = {}; st.c.name = ''; st.c.email = ''; st.c.wa = ''; st.c.contact = ''; st.c.notes = ''; st.tour = { id: st.tour.id, adults: 2, kids: 0 }; st.err = {}; st.sent = false; st.mailed = null; st.mail = '';
      try { sessionStorage.removeItem('irbook'); } catch (x) {}
      if (st.kind === 'prog') { var keepOpt = btn.getAttribute('data-opt'); pv().adults = 2; if (keepOpt != null) pv().opt = +keepOpt; }
      render(true); return;
    }
    if (a === 'send') {
      if (!st.sent) { st.err = validate(); if (Object.keys(st.err).length) { render(true); return; } }
      var msg = message();
      window.open(app().url(msg), '_blank', 'noopener');
      sendMail(msg);
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
  function selectMsg() { var m = back.querySelector('#rdm-msg'); if (!m) return; var r = document.createRange(); r.selectNodeContents(m); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }

  window.IRBook = {
    openTour: function (list, id, guests) {
      items = list; if (st.kind !== 'tour') { st.step = 1; st.sent = false; }
      st.kind = 'tour'; st.err = {};
      st.tour.id = id || st.tour.id || list[0].id; if (!st.tour.adults) st.tour.adults = 2; if (st.tour.kids == null) st.tour.kids = 0;
      if (guests) { st.tour.adults = Math.max(1, guests.adults || 1); st.tour.kids = guests.kids || 0; }
      if (guests && guests.notes && !st.c.notes) st.c.notes = guests.notes;
      if (st.sent) { st.sent = false; }
      open();
    },
    openProg: function (key, optId, guests) {
      var cfg = window.IRPROGS && window.IRPROGS[key]; if (!cfg) return;
      prog = cfg; prog.key = key; st.kind = 'prog'; st.err = {}; st.sent = false;
      var v = pv();
      if (optId != null) { var f = fieldOf('opt'); for (var i = 0; i < f.options.length; i++) if (f.options[i].id === optId) { v.opt = i; v.dur = 0; } }
      if (guests) { if (guests.adults) v.adults = guests.adults; if (guests.kids != null) v.kids = guests.kids; }
      open();
    },
    openProgIndex: function (key, idx) {
      var cfg = window.IRPROGS && window.IRPROGS[key]; if (!cfg) return;
      prog = cfg; prog.key = key; if (idx != null) { pv().opt = idx; pv().dur = 0; }
      IRBook.openProg(key, null);
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
