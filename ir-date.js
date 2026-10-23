/* Shows date fields as day/month/year (dd/mm/yyyy) whatever the browser language. The real date input stays underneath for the picker. */
(function () {
  function dmy(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  window.IRdmy = dmy;
  var css = document.createElement('style');
  css.textContent = '.ir-date{position:relative;display:block}.ir-date>input[type=date]{position:absolute!important;inset:0;width:100%!important;height:100%!important;opacity:0;cursor:pointer;z-index:1;margin:0!important}.ir-date>.ir-date-v{display:flex;align-items:center;box-sizing:border-box;pointer-events:none;white-space:nowrap;overflow:hidden}.ir-date>.ir-date-v.ph{opacity:.6}.ir-date:focus-within>.ir-date-v{outline:2px solid #1FA6A0;outline-offset:1px}';
  document.head.appendChild(css);
  function enhance(inp) {
    if (inp.dataset.irDate || inp.closest('.rd-date')) return;
    inp.dataset.irDate = '1';
    var cs = getComputedStyle(inp), w = document.createElement('span'), v = document.createElement('span');
    w.className = 'ir-date'; v.className = 'ir-date-v'; v.setAttribute('aria-hidden', 'true');
    ['borderTop', 'borderRight', 'borderBottom', 'borderLeft', 'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'minHeight'].forEach(function (p) { v.style[p] = cs[p]; });
    v.style.height = inp.offsetHeight ? inp.offsetHeight + 'px' : cs.height;
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp); w.appendChild(v);
    if (!inp.min) { var t = new Date(); inp.min = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
    var upd = function () { v.textContent = dmy(inp.value) || 'dd/mm/yyyy'; v.classList.toggle('ph', !inp.value); };
    inp.addEventListener('input', upd); inp.addEventListener('change', upd); upd();
    inp.addEventListener('click', function () { if (inp.showPicker) { try { inp.showPicker(); } catch (x) {} } });
  }
  function run() { [].forEach.call(document.querySelectorAll('input[type=date]'), enhance); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
