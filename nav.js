document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('header.site');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('nav.site');
  if (!header || !toggle || !nav) return;

  // Mobile styles: labelled Menu button + quick links strip
  var css = document.createElement('style');
  css.textContent =
    '.qnav{display:none}' +
    '@media (max-width:860px){' +
    'header.site{padding:8px 12px!important;gap:8px!important;flex-wrap:wrap}.logo{font-size:15.5px!important}.logo a{gap:8px!important}.logo img{width:36px!important;height:36px!important}' +
    '.nav-toggle{display:flex!important;align-items:center;gap:5px;background:var(--orange,#F2790F)!important;color:#fff;font-size:14px!important;font-weight:700;border-radius:999px;padding:7px 12px!important;font-family:inherit;margin-left:auto}' +
    '.nav-toggle .ic{font-size:18px;line-height:1}' +
    '.qnav{display:flex;width:100%;gap:6px;overflow-x:auto;padding:8px 0 2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
    '.qnav::-webkit-scrollbar{display:none}' +
    '.qnav a{flex:0 0 auto;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.12);white-space:nowrap}' +
    '.qnav a.on{background:var(--orange,#F2790F)}' +
    'nav.site.open~.qnav{display:none}' +
    '}';
  document.head.appendChild(css);

  function setBtn(open) {
    toggle.innerHTML = open ? '<span class="ic">&times;</span> Close' : '<span class="ic">&#9776;</span> Menu';
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  setBtn(false);

  // Quick links strip built from the main menu
  var q = document.createElement('div');
  q.className = 'qnav';
  q.setAttribute('aria-label', 'Quick links');
  var short = { 'Motorcycle': '🛵 Motorbike', 'Car Rental': '🚗 Car', 'Tours': '🏝️ Tours', 'Visa': '🛂 Visa', 'Driver License': '🪪 Licence', 'Ferry Tickets': '⛴️ Ferry', 'Property': '🏠 Property', 'Help': '❓ Help' };
  nav.querySelectorAll('a').forEach(function (a) {
    var t = a.textContent.trim();
    if (!short[t]) return;
    var c = a.cloneNode(false);
    c.textContent = short[t];
    if (a.classList.contains('active')) c.className = 'on'; else c.removeAttribute('class');
    q.appendChild(c);
  });
  header.appendChild(q);
  var on = q.querySelector('.on');
  if (on) q.scrollLeft = Math.max(0, on.offsetLeft - 60);

  toggle.addEventListener('click', function () {
    setBtn(nav.classList.toggle('open'));
  });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('open'); setBtn(false); });
  });
});
