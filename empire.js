
/*
  empire.js – ES5-only dashboard logic for Pipeline + Calendar views
  Works with SortableJS (already loaded) and the HTML shell.
*/
(function () {
  'use strict';

  /* ---------- Demo data ---------- */
  var BRANDS = [
    { id: 'knf', name: 'KNF', accent: '#e63cff', status: 'active' },
    { id: 'fh', name: 'For Harriet', accent: '#652399', status: 'active' },
    { id: 'mtih', name: 'MTiH', accent: '#006aff', status: 'active' },
    { id: 'sss', name: 'The Shallow Side', accent: '#ff5880', status: 'launching' },
    { id: 'tok', name: 'Taste of Kimberly', accent: '#9e2fff', status: 'planning' },
    { id: 'bwitw', name: 'BWiTW', accent: '#ffb600', status: 'active', events: true },
    { id: 'indigo', name: 'Indigo Hour', accent: '#532dff', status: 'planning', events: true }
  ];

  var PIPELINES = {
    knf: { ideas: ['Video idea'], inProgress: [], ready: [], published: [] },
    fh: { ideas: ['Essay idea'], inProgress: [], ready: [], published: [] },
    mtih: { ideas: [], inProgress: [], ready: [], published: [] },
    sss: { ideas: [], inProgress: [], ready: [], published: [] },
    tok: { ideas: [], inProgress: [], ready: [], published: [] },
    bwitw: { planning: ['Spring Hike'], upcoming: [], marketing: [], completed: [] },
    indigo: { planning: [], upcoming: [], marketing: [], completed: [] }
  };

  var CALENDAR = {}; // {brandId: { '2025-05-26': [item,...] } }

  /* ---------- helpers ---------- */
  function qs(sel, scope) { return (scope || document).querySelector(sel); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function fmtDate(d) { return d.toISOString().slice(0, 10); }

  /* ---------- init ---------- */
  var nav = qs('#nav');
  var totals = qs('#totals');
  var overview = qs('#overview');
  var views = qs('#views');

  function buildNav() {
    ['overview'].concat(BRANDS.map(function (b) { return b.id; })).forEach(function (id) {
      var b = id === 'overview' ? { name: 'Overview' } : BRANDS.filter(function (x) { return x.id === id; })[0];
      var btn = el('button', 'nav-btn', b.name);
      btn.dataset.id = id;
      btn.onclick = function () { show(id); };
      nav.appendChild(btn);
    });
  }

  function buildOverview() {
    overview.innerHTML = '';
    BRANDS.forEach(function (b) {
      var c = el('div', 'card');
      var badge = el('span', 'badge ' + b.status, b.status);
      badge.style.background = b.accent;
      c.appendChild(badge);
      c.appendChild(el('div', 'brand', b.name));
      c.appendChild(el('div', 'desc', b.events ? 'Event brand' : 'Content brand'));
      c.onclick = function () { show(b.id); };
      overview.appendChild(c);
    });
  }

  function show(id) {
    Array.prototype.forEach.call(nav.children, function (btn) {
      btn.classList.toggle('active', btn.dataset.id === id);
    });
    if (id === 'overview') {
      overview.style.display = 'grid';
      views.innerHTML = '';
      return;
    }
    overview.style.display = 'none';
    renderBrand(id);
  }

  /* ---------- brand ---------- */
  function renderBrand(id) {
    var b = BRANDS.filter(function (x) { return x.id === id; })[0];
    var wrap = el('div');
    var header = el('div', 'p-head');
    header.appendChild(el('h2', '', b.name));
    var toggle = el('button', 'add', 'Calendar View');
    toggle.dataset.state = 'pipeline';
    toggle.onclick = function () {
      if (toggle.dataset.state === 'pipeline') {
        toggle.dataset.state = 'calendar';
        toggle.textContent = 'Pipeline View';
        pipe.style.display = 'none';
        cal.style.display = 'block';
      } else {
        toggle.dataset.state = 'pipeline';
        toggle.textContent = 'Calendar View';
        cal.style.display = 'none';
        pipe.style.display = 'flex';
      }
    };
    header.appendChild(toggle);
    wrap.appendChild(header);

    /* pipeline */
    var pipe = el('div', 'pipeline');
    var stages = b.events ? ['planning', 'upcoming', 'marketing', 'completed'] : ['ideas', 'inProgress', 'ready', 'published'];
    stages.forEach(function (s) {
      var col = el('div', 'col');
      var chead = el('div', 'c-head');
      chead.appendChild(el('span', '', s));
      var cnt = el('span', 'c-count', (PIPELINES[id][s] || []).length);
      chead.appendChild(cnt);
      col.appendChild(chead);
      var lst = el('div', 'list');
      (PIPELINES[id][s] || []).forEach(function (item) {
        lst.appendChild(el('div', 'item', item));
      });
      col.appendChild(lst);
      pipe.appendChild(col);
      Sortable.create(lst, { group: id, onEnd: function () { cnt.textContent = lst.children.length; } });
    });
    wrap.appendChild(pipe);

    /* calendar */
    var cal = buildCalendar(id, new Date());
    cal.style.display = 'none';
    wrap.appendChild(cal);

    views.innerHTML = '';
    views.appendChild(wrap);
  }

  /* ---------- calendar ---------- */
  function buildCalendar(id, monthDate) {
    var container = el('div');
    var head = el('div', 'p-head');
    var prev = el('button', 'add', '<');
    var next = el('button', 'add', '>');
    var title = el('h2', '', monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
    prev.onclick = function () {
      monthDate.setMonth(monthDate.getMonth() - 1);
      container.replaceWith(buildCalendar(id, new Date(monthDate)));
    };
    next.onclick = function () {
      monthDate.setMonth(monthDate.getMonth() + 1);
      container.replaceWith(buildCalendar(id, new Date(monthDate)));
    };
    head.appendChild(prev); head.appendChild(title); head.appendChild(next);
    container.appendChild(head);

    var grid = el('div', 'pipeline'); // reuse flex styles
    grid.style.flexWrap = 'wrap';
    grid.style.gap = '4px';

    var year = monthDate.getFullYear();
    var month = monthDate.getMonth();
    var firstDay = new Date(year, month, 1);
    var start = new Date(firstDay);
    start.setDate(start.getDate() - firstDay.getDay()); // Sunday

    for (var i = 0; i < 42; i++) {
      var cellDate = new Date(start);
      cellDate.setDate(start.getDate() + i);
      var cell = el('div', 'col');
      cell.style.minWidth = '120px';
      cell.style.minHeight = '90px';
      cell.style.background = cellDate.getMonth() === month ? 'var(--bg-mute)' : '#f0f1f8';
      var label = el('div', 'c-head', cellDate.getDate());
      cell.appendChild(label);
      var lst = el('div', 'list');
      cell.appendChild(lst);

      // items
      var key = fmtDate(cellDate);
      (CALENDAR[id] && CALENDAR[id][key] || []).forEach(function (item) {
        var itm = el('div', 'item', item);
        itm.style.background = BRANDS.filter(function (x) { return x.id === id; })[0].accent;
        lst.appendChild(itm);
      });
      // click to add demo item
      cell.onclick = function (d) {
        return function () {
          CALENDAR[id] = CALENDAR[id] || {};
          var k = fmtDate(d);
          CALENDAR[id][k] = CALENDAR[id][k] || [];
          CALENDAR[id][k].push('New Item');
          renderBrand(id);
        };
      }(new Date(cellDate));
      grid.appendChild(cell);
    }
    container.appendChild(grid);
    return container;
  }

  /* ---------- start ---------- */
  buildNav();
  buildOverview();
})();
