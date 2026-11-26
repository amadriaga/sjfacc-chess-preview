// SJFACC: site behaviour
(function () {
  // Mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Footer year
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // Register (spec §28): any age group under 18 shows the parent/guardian name and the parent's signature box;
  // adults sign for themselves. The typed signature must match the name it signs for (checked again by the sheet script).
  var reg = document.getElementById('register-form');
  var isMinor = function () { var a = document.getElementById('r-age'); return !!(a && a.value && a.value !== 'Adult (18+)'); };
  if (reg) {
    var guardian = document.getElementById('guardian-section');
    var gInputs = reg.querySelectorAll('[data-guardian]');
    var sm = document.getElementById('sign-member'), sg = document.getElementById('sign-guardian');
    var smIn = document.getElementById('r-sign-member'), sgIn = document.getElementById('r-sign-guardian');
    var preview = document.getElementById('sign-preview'), br = document.getElementById('r-browser');
    if (br) br.value = navigator.userAgent.slice(0, 300);
    var norm = function (v) { return String(v || '').trim().replace(/\s+/g, ' ').toLowerCase(); };
    var today = function () { return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); };
    var sync = function () {
      var minor = isMinor();
      if (guardian) guardian.classList.toggle('hidden', !minor);
      for (var i = 0; i < gInputs.length; i++) gInputs[i].required = minor;
      reg.querySelectorAll('.guardian-extra, .minor-opt').forEach(function (x) { x.classList.toggle('hidden', !minor); });   // spec §48
      reg.querySelectorAll('.adult-req').forEach(function (x) { x.classList.toggle('hidden', minor); });
      ['r-email', 'r-phone'].forEach(function (id) { var x = document.getElementById(id); if (x) x.required = !minor; });
      if (sm && sg) { sm.classList.toggle('hidden', minor); sg.classList.toggle('hidden', !minor); smIn.required = !minor; sgIn.required = minor; }
      sign();
    };
    var sign = function () {
      if (!preview || !smIn) return;
      var minor = isMinor(), typed = (minor ? sgIn : smIn).value.trim();
      var want = minor ? document.getElementById('r-guardian').value : document.getElementById('r-name').value;
      var match = typed && norm(typed) === norm(want);
      (minor ? sgIn : smIn).setCustomValidity(typed && !match ? (minor ? 'Please type the parent or guardian\u2019s full name exactly as above.' : 'Please type the player\u2019s full name exactly as above.') : '');
      preview.classList.toggle('hidden', !match);
      if (match) preview.textContent = 'Signed electronically by ' + typed + ' \u00b7 ' + today();
    };
    // Under-18s: the parent/guardian is the default emergency contact (spec §28.3b). A field the person edits is left alone.
    var em = [['r-em-name', function () { return document.getElementById('r-guardian').value; }],
              ['r-em-rel', function () { return 'Parent/guardian'; }],
              ['r-em-phone', function () { var g = document.getElementById('r-guardian-phone'); return g ? g.value : ''; }]];   // spec §48: parent's phone
    var emNote = document.getElementById('em-auto-note');
    var emFill = function () {
      var minor = isMinor(), any = false;
      em.forEach(function (e) {
        var f = document.getElementById(e[0]); if (!f || f.dataset.edited === '1') return;
        if (minor) { f.value = e[1](); f.dataset.auto = '1'; any = true; }
        else if (f.dataset.auto === '1') { f.value = ''; delete f.dataset.auto; }
      });
      if (emNote) emNote.classList.toggle('hidden', !(minor && any));
    };
    em.forEach(function (e) {
      var f = document.getElementById(e[0]);
      if (f) f.addEventListener('input', function () { f.dataset.edited = '1'; delete f.dataset.auto; });
    });
    ['r-guardian', 'r-guardian-phone'].forEach(function (id) { var x = document.getElementById(id); if (x) x.addEventListener('input', emFill); });
    reg.addEventListener('reset', function () { em.forEach(function (e) { var f = document.getElementById(e[0]); if (f) { delete f.dataset.edited; delete f.dataset.auto; } }); setTimeout(emFill, 0); });
    var age = document.getElementById('r-age');
    if (age) age.addEventListener('change', function () { sync(); emFill(); });
    ['r-name', 'r-guardian', 'r-sign-member', 'r-sign-guardian'].forEach(function (id) { var x = document.getElementById(id); if (x) x.addEventListener('input', sign); });
    reg.addEventListener('reset', function () { setTimeout(sync, 0); });
    sync();
  }

  // Register: extra shirts. 1-4 = one size drop-down per shirt (each required); "5 or more" = one text box pre-filled
  // "Please call me for the sizes". The choices are joined into the hidden extra_sizes field (spec §22).
  var extra = document.getElementById('r-extra'), extraBox = document.getElementById('extra-sizes');
  if (extra && extraBox) {
    var many = document.getElementById('extra-many'), manyIn = document.getElementById('r-extra-many'), joined = document.getElementById('r-extra-sizes');
    var rows = extraBox.querySelectorAll('[data-extra-row]');
    var syncExtra = function () {
      var v = extra.value, n = v === '5 or more' ? 5 : Number(v);
      extraBox.classList.toggle('hidden', n === 0);
      for (var i = 0; i < rows.length; i++) {
        var on = n >= 1 && n <= 4 && i < n, sel = rows[i].querySelector('select');
        rows[i].classList.toggle('hidden', !on); sel.required = on;
      }
      many.classList.toggle('hidden', n !== 5); manyIn.required = n === 5;
      if (n === 5 && !manyIn.value.trim()) manyIn.value = 'Please call me for the sizes';
    };
    var joinSizes = function () {
      var v = extra.value, n = v === '5 or more' ? 5 : Number(v), out = [];
      if (n === 5) { joined.value = manyIn.value.trim(); return; }
      for (var i = 0; i < n; i++) out.push('Shirt ' + (i + 1) + ': ' + rows[i].querySelector('select').value);
      joined.value = out.join('; ');
    };
    extra.addEventListener('change', syncExtra); syncExtra();
    var rf = document.getElementById('register-form');
    rf.addEventListener('submit', joinSizes, true);            // runs before the form is sent
    rf.addEventListener('reset', function () { setTimeout(syncExtra, 0); });
  }

  // Register: "Who's registered" list (opt-in names only, spec §27). Hidden if the list can't load.
  var roster = document.getElementById('roster'), regForm = document.querySelector('form[data-sheet="register"]');
  if (roster && regForm) {
    var minorNote = document.getElementById('list-minor-note');
    var ageSel = document.getElementById('r-age');
    if (ageSel) ageSel.addEventListener('change', function () { if (minorNote) minorNote.hidden = !isMinor(); });
    var rurl = regForm.getAttribute('action');
    if (rurl.indexOf('SHEET_URL_PENDING') === -1) {
      fetch(rurl + '?action=roster').then(function (r) { return r.json(); }).then(function (res) {
        if (!res || !res.ok) return;
        var body = document.getElementById('roster-body'), list = res.players || [];
        document.getElementById('roster-count').textContent = res.total === 1 ? '1 player has registered so far.' : res.total + ' players have registered so far.';
        body.innerHTML = list.length ? list.map(function (p) {
          var d = document.createElement('tr'), fid = document.createElement('td'), a = document.createElement('td'), g = document.createElement('td'), b = document.createElement('td'), ms = document.createElement('td');
          fid.textContent = p.id || '\u2014'; ms.textContent = String(p.since || '\u2014').replace(/ member$/i, '');   // spec §44: Form ID first, Member since last
          a.textContent = p.name; var ag = p.age || '', m = /\((?:ages )?([^)]+)\)/.exec(ag); g.textContent = m ? m[1] : (ag || '\u2014'); if (ag) g.title = ag; b.textContent = String(p.level || '\u2014').replace(/ player$/i, ''); d.appendChild(fid); d.appendChild(a); d.appendChild(g); d.appendChild(ms); return d.outerHTML;
        }).join('') : '<tr><td colspan="4">No one has chosen to be listed yet. Be the first!</td></tr>';
        var tally = document.getElementById('age-tally');   // spec §53: scoreboard-style tally (numbers only, no names)
        if (tally && res.byAge) {
          var groups = [['Early Learners (ages 4–6)', 'Early Learners', '4–6'], ['Elementary / Youth (ages 7–11)', 'Elementary / Youth', '7–11'], ['Middle & High School (ages 12–17)', 'Middle & High School', '12–17'], ['Adult (18+)', 'Adults', '18+']];
          var total = groups.reduce(function (t, g) { return t + (res.byAge[g[0]] || 0); }, 0);
          var mk = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
          var tile = function (label, value, sub, cls) { var t = mk('div', 'tb-tile' + (cls ? ' ' + cls : '')); t.appendChild(mk('span', 'tb-label', label)); t.appendChild(mk('b', 'tb-value', value)); t.appendChild(mk('small', 'tb-sub', sub || '\u00a0')); return t; };   // every tile keeps the bottom line, for symmetry
          tally.innerHTML = '';
          var brand = mk('div', 'tb-brand'), lg = document.createElement('img');   // Alex: club logo, then "2027 Founders' Cup"
          lg.src = '/assets/logo-512.webp?v=7'; lg.width = 64; lg.height = 64; lg.alt = 'SJFACC crest'; lg.className = 'tb-logo';
          brand.appendChild(lg); brand.appendChild(mk('h4', 'tb-title', '2027 Founders\u2019 Cup')); brand.appendChild(mk('p', 'tb-date', 'January 11, 2027')); brand.appendChild(mk('p', 'tb-kicker', 'Founding Season Tally'));
          tally.appendChild(brand);
          // four corner pins: bevelled 3D gold stars (Alex)
          var starSvg = (function () {
            var pts = [], f = '', cx = 12, cy = 12;
            for (var k = 0; k < 10; k++) { var r = k % 2 ? 4.6 : 11, a = -Math.PI / 2 + k * Math.PI / 5; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
            for (var k2 = 0; k2 < 10; k2++) { var p = pts[k2], q = pts[(k2 + 1) % 10]; f += '<path d="M12 12L' + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + 'L' + q[0].toFixed(2) + ' ' + q[1].toFixed(2) + 'Z" fill="' + (k2 % 2 ? 'url(#pd)' : 'url(#pl)') + '"/>'; }
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="pl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4cf"/><stop offset="1" stop-color="#d4b06a"/></linearGradient>'
              + '<linearGradient id="pd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8913a"/><stop offset="1" stop-color="#6b5520"/></linearGradient></defs>' + f + '</svg>';
          })();
          ['tl', 'tr', 'bl', 'br'].forEach(function (pos) { var pin = mk('span', 'tb-pin tb-pin-' + pos); pin.innerHTML = starSvg; tally.appendChild(pin); });
          var grid = mk('div', 'tb-grid');
          grid.appendChild(tile('Players registered', String(total), '', 'tb-main'));
          groups.forEach(function (g) { var n = res.byAge[g[0]] || 0; grid.appendChild(tile(g[1], String(n), 'ages ' + g[2], n ? '' : 'tb-zero')); });
          // live countdown to opening night: Mon, Jan 11, 2027, 6:00 PM Eastern (= 23:00 UTC)
          var OPEN = Date.UTC(2027, 0, 11, 23, 0, 0), ENDS = Date.UTC(2027, 0, 12, 2, 0, 0);
          var cd = tile('Countdown to opening night', '', 'Mon, Jan 11 \u00b7 6 PM', 'tb-count tb-countdown');
          var cdv = cd.querySelector('.tb-value'), clk = mk('span', 'tb-clock', ''); cd.insertBefore(clk, cd.querySelector('.tb-sub'));
          var pad = function (n) { return (n < 10 ? '0' : '') + n; };
          var tick = function () {
            var ms = OPEN - Date.now();
            if (ms <= 0) { cdv.textContent = Date.now() < ENDS ? 'Tonight!' : 'Opened'; clk.textContent = Date.now() < ENDS ? 'Club night is on now' : 'Welcome, founding members'; return false; }
            var s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
            cdv.textContent = d + (d === 1 ? ' day' : ' days');
            clk.textContent = pad(Math.floor(s % 86400 / 3600)) + 'h ' + pad(Math.floor(s % 3600 / 60)) + 'm ' + pad(s % 60) + 's';
            return true;
          };
          if (tick()) { if (window.fassjCountdown) clearInterval(window.fassjCountdown); window.fassjCountdown = setInterval(function () { if (!tick()) clearInterval(window.fassjCountdown); }, 1000); }
          grid.insertBefore(cd, grid.children[3] || null);   // 2nd row, 1st column: the four age groups sit together on the right (Alex)
          tally.appendChild(grid);
          var weeks = res.byWeek || [];
          if (weeks.length) {
            var chart = mk('div', 'tb-chart'), max = Math.max.apply(null, weeks.map(function (w) { return w.count; })) || 1;
            chart.appendChild(mk('span', 'tb-label', 'Sign-ups per week'));
            var bars = mk('div', 'tb-bars'); bars.setAttribute('role', 'list');
            weeks.forEach(function (w) {
              var col = mk('div', 'tb-col'), bar = mk('span', 'tb-bar'), tip = 'Week of ' + w.label + ': ' + w.count + (w.count === 1 ? ' sign-up' : ' sign-ups');
              col.setAttribute('role', 'listitem'); col.tabIndex = 0; col.setAttribute('aria-label', tip); col.setAttribute('data-tip', tip);
              bar.style.height = w.count ? Math.max(4, Math.round(100 * w.count / max)) + '%' : '0';   // spec §70: empty weeks show only their date
              if (!w.count) col.classList.add('tb-empty');
              col.appendChild(mk('span', 'tb-n', w.count ? String(w.count) : '\u00a0')); col.appendChild(bar); col.appendChild(mk('span', 'tb-week', w.label)); bars.appendChild(col);
            });
            chart.appendChild(bars); tally.appendChild(chart);
          }
          tally.appendChild(mk('p', 'tb-foot', 'Live from registrations · numbers only, no names'));
          tally.classList.remove('hidden');
          var rc = document.getElementById('roster-count'); if (rc) rc.hidden = true;
        }
        roster.classList.remove('hidden');
      }).catch(function () {});
    }
  }

  // Register: officers sign in with email + Google Authenticator code and approve forms with a tick (spec §28.5a).
  var obox = document.getElementById('officer-box'), omain = document.querySelector('main[data-approve-api]');
  if (obox && omain) {
    var oapi = omain.getAttribute('data-approve-api'), olog = document.getElementById('officer-login'), opan = document.getElementById('officer-panel');
    var omsg = document.getElementById('officer-msg'), lmsg = document.getElementById('officer-login-msg'), obody = document.getElementById('officer-body'), openRegs = {};   // spec §57: open rows kept across auto-refresh
    var tok = function (v) { try { if (v === undefined) return sessionStorage.getItem('fassjOfficer') || ''; if (v) sessionStorage.setItem('fassjOfficer', v); else sessionStorage.removeItem('fassjOfficer'); } catch (e) { return ''; } };
    var post = function (data) { return fetch(oapi, { method: 'POST', body: new URLSearchParams(data) }).then(function (r) { return r.json(); }); };
    var say = function (el, m, good) { el.textContent = m || ''; el.classList.toggle('ok', !!good); };
    var reqForm = document.getElementById('request');
    var signOut = function (m) { tok(''); opan.classList.add('hidden'); olog.classList.remove('hidden'); if (reqForm) reqForm.classList.remove('hidden'); say(lmsg, m || ''); };
    var cell = function (tr, x) { var td = document.createElement('td'); if (typeof x === 'string') td.textContent = x; else if (x) td.appendChild(x); tr.appendChild(td); return td; };
    var openPdf = function (id, btn) {
      btn.disabled = true; say(omsg, 'Opening ' + id + '…', true);
      post({ form: 'officer_pdf', token: tok(), id: id }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(omsg, res.error);
        var bin = atob(res.pdf), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.download = 'SJFACC-form-' + id + '.pdf'; document.body.appendChild(a); a.click(); a.remove();
        say(omsg, '');
      }).catch(function () { say(omsg, 'Couldn’t open the PDF. Please try again.'); }).then(function () { btn.disabled = false; });
    };
    // spec §84: Treasurer tab, startup-cost invoices (Treasurer and owners only)
    var loadTreasurer = function () {
      var list = document.getElementById('inv-list'), msg = document.getElementById('inv-msg'), tab = document.getElementById('tab-treasurer');
      if (!list || !tab) return;
      post({ form: 'treasurer_invoices', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) { tab.hidden = true; return; }
        tab.hidden = false; list.innerHTML = '';
        var tot = document.createElement('p'); tot.className = 'trustee-meta'; tot.textContent = 'Startup costs: ' + res.total + ', split three ways.'; list.appendChild(tot);
        res.invoices.forEach(function (iv) {
          var card = document.createElement('div'); card.className = 'doc-card-o doc-body tdoc-card';
          var h = document.createElement('b'); h.className = 'doc-title'; h.textContent = iv.number + ' · ' + iv.trustee + ' · ' + iv.share; card.appendChild(h);
          var st = document.createElement('p'); st.className = 'trustee-meta';
          st.textContent = (iv.kind === 'Statement' ? 'Paid statement' : 'Invoice') + ' · ' + iv.status + (iv.paidOn ? ' on ' + iv.paidOn : '') + (iv.treatment ? ' · ' + iv.treatment : '')
            + ' · ' + (iv.signedBy ? 'Signed by ' + iv.signedBy + ' (' + iv.signedAt + ')' : 'Not signed yet: ' + iv.signer + ' signs');
          card.appendChild(st);
          var fetchPdf = function (btn, download) {
            btn.disabled = true; say(msg, 'Preparing the PDF\u2026', true);
            post({ form: 'treasurer_invoice_pdf', token: tok(), number: iv.number }).then(function (r) {
              if (r.signedOut) return signOut(r.error);
              if (!r.ok) return say(msg, r.error);
              var a = document.createElement('a'); a.href = URL.createObjectURL(b64Blob(r.data, r.mime));
              if (download) a.download = r.name; else { a.target = '_blank'; a.rel = 'noopener'; }
              document.body.appendChild(a); a.click(); a.remove(); say(msg, '');
            }).catch(function () { say(msg, 'Couldn\u2019t make the PDF. Please try again.'); }).then(function () { btn.disabled = false; });
          };
          var acts = document.createElement('p'); acts.className = 'officer-actions';
          var v = document.createElement('button'); v.type = 'button'; v.className = 'btn btn-sm btn-primary'; v.textContent = 'View PDF'; v.addEventListener('click', function () { fetchPdf(v, false); });
          var dl = document.createElement('button'); dl.type = 'button'; dl.className = 'btn btn-sm btn-outline'; dl.textContent = 'Download PDF'; dl.addEventListener('click', function () { fetchPdf(dl, true); });
          acts.appendChild(v); acts.appendChild(document.createTextNode(' ')); acts.appendChild(dl);
          card.appendChild(acts);
          if (iv.canSign && iv.kind) {   // Sign: designated signer only
            var sf = document.createElement('form'); sf.className = 'trustee-form';
            var cl = document.createElement('label'); cl.className = 'trustee-consent'; var cb = document.createElement('input'); cb.type = 'checkbox';
            cl.appendChild(cb); cl.appendChild(document.createTextNode(' I agree that my typed name is my electronic signature on this ' + (iv.kind === 'Statement' ? 'statement' : 'invoice') + '.')); sf.appendChild(cl);
            var sg = document.createElement('input'); sg.type = 'text'; sg.className = 'trustee-sig'; sg.placeholder = 'Type your full legal name: ' + res.me; sf.appendChild(sg);
            var sb = document.createElement('button'); sb.type = 'submit'; sb.className = 'btn btn-sm btn-primary'; sb.textContent = iv.signedBy ? 'Sign again' : 'Sign'; sf.appendChild(sb);
            sf.addEventListener('submit', function (ev) {
              ev.preventDefault(); sb.disabled = true;
              post({ form: 'treasurer_invoice_sign', token: tok(), number: iv.number, consent: cb.checked ? 'yes' : '', signature: sg.value }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) return say(msg, r.error);
                say(msg, iv.number + ' signed.', true); loadTreasurer();
              }).catch(function () { say(msg, 'Couldn\u2019t sign. Please try again.'); }).then(function () { sb.disabled = false; });
            });
            card.appendChild(sf);
          }
          if (iv.kind === 'Invoice') {   // Mark paid
            var pf = document.createElement('form'); pf.className = 'inv-paid';
            var pd = document.createElement('input'); pd.type = 'date'; pd.required = true; pd.setAttribute('aria-label', 'Date paid');
            var zc = document.createElement('input'); zc.type = 'text'; zc.placeholder = 'Zelle confirmation'; zc.setAttribute('aria-label', 'Zelle confirmation');
            var tr = document.createElement('select'); [['', 'Treatment: decide later'], ['Advance', 'Advance (repaid from dues)'], ['Donation', 'Donation']].forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; if (iv.treatment === o[0]) op.selected = true; tr.appendChild(op); });
            var pb = document.createElement('button'); pb.type = 'submit'; pb.className = 'btn btn-sm btn-outline'; pb.textContent = iv.status === 'Paid' ? 'Update payment' : 'Mark paid';
            [pd, zc, tr, pb].forEach(function (el) { pf.appendChild(el); pf.appendChild(document.createTextNode(' ')); });
            pf.addEventListener('submit', function (ev) {
              ev.preventDefault(); pb.disabled = true;
              post({ form: 'treasurer_invoice_paid', token: tok(), number: iv.number, paidOn: pd.value, zelle: zc.value, treatment: tr.value }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) return say(msg, r.error);
                say(msg, iv.number + ' marked paid.', true); loadTreasurer();
              }).catch(function () { say(msg, 'Couldn\u2019t save. Please try again.'); }).then(function () { pb.disabled = false; });
            });
            card.appendChild(pf);
          }
          list.appendChild(card);
        });
      }).catch(function () { say(msg, 'Couldn\u2019t load the invoices.'); });
    };
    // spec §93: Legal Requirements tab: the formation steps, start to finish, ticked when completed (who and when saved)
    var loadLegal = function () {
      var lt = document.getElementById('tab-legal'), ll = document.getElementById('legal-list'), lm = document.getElementById('legal-msg'), lp = document.getElementById('legal-progress');
      if (!lt || !ll) return;
      var draw = function (res) {
        if (!res.ok) { lt.hidden = true; return; }
        lt.hidden = false;
        lp.textContent = res.done + ' of ' + res.total + ' complete';
        var was = {}; Array.prototype.forEach.call(ll.querySelectorAll('details.lr-group'), function (g) { was[g.dataset.phase] = g.open; });   // keep open/closed after a redraw
        ll.innerHTML = '';
        var phase = '', box = ll;
        res.items.forEach(function (q) {
          if (q.phase !== phase) {   // collapsible phase (Alex, 2026-11-25)
            phase = q.phase;
            var mine = res.items.filter(function (x) { return x.phase === phase; }), nd = mine.filter(function (x) { return x.done; }).length;
            var g = document.createElement('details'); g.className = 'lr-group'; g.dataset.phase = phase;
            g.open = (phase in was) ? was[phase] : nd < mine.length;
            var sm = document.createElement('summary'); sm.className = 'lr-phase';
            var nm = document.createElement('span'); nm.textContent = phase; sm.appendChild(nm);
            var ct = document.createElement('span'); ct.className = 'badge lr-badge' + (nd === mine.length ? ' lr-badge--done' : ''); ct.textContent = (nd === mine.length ? '✓ ' : '') + nd + ' of ' + mine.length; sm.appendChild(ct);
            g.appendChild(sm); ll.appendChild(g); box = g;
          }
          var card = document.createElement('div'); card.className = 'doc-card-o lr-card' + (q.done ? ' lr-card--done' : '');
          var top = document.createElement('div'); top.className = 'lr-top';
          var b = document.createElement('span'); b.className = 'badge lr-badge' + (q.done ? ' lr-badge--done' : ''); b.textContent = q.done ? '✓ Completed' : 'Open'; top.appendChild(b);
          var t = document.createElement('b'); t.className = 'doc-title'; t.textContent = q.title; top.appendChild(t); card.appendChild(top);
          var d = document.createElement('p'); d.className = 'trustee-meta'; d.textContent = q.detail + (q.due ? ' Due: ' + q.due + '.' : ''); card.appendChild(d);
          if (q.by || q.at) { var w = document.createElement('p'); w.className = 'by'; w.textContent = (q.done ? 'Completed' : 'Marked not completed') + ' by ' + (q.by || '—') + (q.at ? ' on ' + q.at : '') + (q.note ? ' · ' + q.note : ''); card.appendChild(w); }
          var save = function (done, ctl) {   // completed steps are locked; only owners can reopen (spec §93)
            ctl.disabled = true; say(lm, 'Saving…', true);
            post({ form: 'officer_legal_req_set', token: tok(), id: q.id, done: done }).then(function (r) {
              if (!r.ok) { ctl.disabled = false; if (ctl.type === 'checkbox') ctl.checked = false; say(lm, r.error || 'Couldn’t save. Please try again.'); return; }
              say(lm, 'Saved.', true); draw(r);
            }).catch(function () { ctl.disabled = false; if (ctl.type === 'checkbox') ctl.checked = false; say(lm, 'Couldn’t save. Please try again.'); });
          };
          if (!q.done) {
            var lab = document.createElement('label'); lab.className = 'lr-tick'; var cb = document.createElement('input'); cb.type = 'checkbox';
            lab.appendChild(cb); lab.appendChild(document.createTextNode(' Mark as completed')); card.appendChild(lab);
            cb.addEventListener('change', function () { if (cb.checked) save('yes', cb); });
          } else if (res.owner) {
            var ro = document.createElement('button'); ro.type = 'button'; ro.className = 'lr-reopen'; ro.textContent = 'Reopen';
            ro.addEventListener('click', function () { if (window.confirm('Reopen “' + q.title + '”? It will show as Open again.')) save('no', ro); });
            card.appendChild(ro);
          }
          box.appendChild(card);
        });
      };
      post({ form: 'officer_legal_reqs', token: tok() }).then(draw).catch(function () { lt.hidden = true; });
    };
    // spec §80: trustee approvals with a typed electronic signature (tab shown only to trustees and owners)
    var loadTrustees = function () {
      var tlist = document.getElementById('trustee-list'), tmsg = document.getElementById('trustee-msg'), ttab = document.getElementById('tab-trustees');
      if (!tlist || !ttab) return;
      post({ form: 'officer_trustee_docs', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) { ttab.hidden = true; return; }
        var wasOpen = {}; Array.prototype.forEach.call(tlist.querySelectorAll('details.td-group'), function (g) { wasOpen[g.dataset.id] = g.open; });   // keep open/closed (spec §98)
        ttab.hidden = false; tlist.innerHTML = '';
        if (!res.docs.length) { var none = document.createElement('p'); none.className = 'note'; none.textContent = 'No trustee documents yet.'; tlist.appendChild(none); return; }
        res.docs.forEach(function (d) {
          var tg = document.createElement('details'); tg.className = 'td-group'; tg.dataset.id = d.id;   // collapsible document (spec §98)
          var nSigned = d.trustees.filter(function (t) { return t.signed; }).length, mineSigned = !!(d.mine && d.mine.signed);
          tg.open = (d.id in wasOpen) ? wasOpen[d.id] : (res.trustee && !mineSigned && !!d.items.length);
          var tsm = document.createElement('summary'); tsm.className = 'lr-phase';
          var h = document.createElement('span'); h.className = 'doc-title'; h.textContent = d.title; tsm.appendChild(h);
          if (d.items.length) { var tb2 = document.createElement('span'); tb2.className = 'badge lr-badge' + (d.full ? ' lr-badge--done' : ''); tb2.textContent = d.full ? '✓ Fully approved' : nSigned + ' of ' + d.trustees.length + ' signed'; tsm.appendChild(tb2); }
          tg.appendChild(tsm);
          var card = document.createElement('div'); card.className = 'doc-card-o doc-body trustee-card'; tg.appendChild(card);
          if (d.docno) { var mt = document.createElement('p'); mt.className = 'trustee-meta'; mt.textContent = 'Last update: ' + d.updated + ' · Document No.: ' + d.docno + (d.alias ? ' · Document alias: ' + d.alias : '') + ' · Version: ' + d.version; card.appendChild(mt); }   // same header as the PDF (spec §80/§82)
          if (d.about) { var ab = document.createElement('p'); ab.className = 'doc-about'; ab.textContent = d.about; card.appendChild(ab); }
          // spec §80: clear steps for trustees (Alex, 2026-11-24)
          var info = !d.items.length;   // for information only: nothing to sign (spec §83)
          var how = document.createElement('ol'); how.className = 'trustee-steps';
          (info ? ['View or download the PDF below and read it.', 'If anything looks wrong, tell Alexander Madriaga. There is nothing to sign for this document.'] : ['View or download the PDF below and read all of it before deciding.',
           'If anything is unclear, ask Alex Madriaga first. Don\u2019t decide until you understand it.',
           'Each numbered decision under \u201cYour decisions\u201d is the same number in the PDF\u2019s section 2 table. For each one choose Approve, Deny or Revise. For Deny or Revise, write why or what should change.',
           'Type your full name to sign, then press \u201cSign and submit\u201d. You can sign again later to change your answers.'
          ]).forEach(function (t) { var li = document.createElement('li'); li.textContent = t; how.appendChild(li); });
          var hh0 = document.createElement('p'); hh0.className = 'vote-head'; hh0.textContent = info ? 'For your information' : 'How to review and sign'; card.appendChild(hh0); card.appendChild(how);
          var view = document.createElement('button'); view.type = 'button'; view.className = 'btn btn-sm btn-primary'; view.textContent = 'View the PDF';
          var dl = document.createElement('button'); dl.type = 'button'; dl.className = 'btn btn-sm btn-outline'; dl.textContent = 'Download the PDF';
          dl.addEventListener('click', function () {
            dl.disabled = true; say(tmsg, 'Preparing the download\u2026', true);
            post({ form: 'officer_trustee_doc', token: tok(), id: d.id }).then(function (r) {
              if (r.signedOut) return signOut(r.error);
              if (!r.ok) return say(tmsg, r.error);
              var a = document.createElement('a'); a.href = URL.createObjectURL(b64Blob(r.data, r.mime)); a.download = r.name || 'document.pdf';
              document.body.appendChild(a); a.click(); a.remove(); say(tmsg, '');
            }).catch(function () { say(tmsg, 'Couldn\u2019t download the document. Please try again.'); }).then(function () { dl.disabled = false; });
          });
          view.addEventListener('click', function () {
            view.disabled = true; say(tmsg, 'Opening…', true);
            post({ form: 'officer_trustee_doc', token: tok(), id: d.id }).then(function (r) {
              if (r.signedOut) return signOut(r.error);
              if (!r.ok) return say(tmsg, r.error);
              var a = document.createElement('a'); a.href = URL.createObjectURL(b64Blob(r.data, r.mime)); a.target = '_blank'; a.rel = 'noopener';
              document.body.appendChild(a); a.click(); a.remove(); say(tmsg, '');
            }).catch(function () { say(tmsg, 'Couldn’t open the document. Please try again.'); }).then(function () { view.disabled = false; });
          });
          var acts = document.createElement('p'); acts.className = 'officer-actions'; acts.appendChild(view); acts.appendChild(document.createTextNode(' ')); acts.appendChild(dl); card.appendChild(acts);
          var st = document.createElement('div'); st.className = 'trustee-status';
          var badge = document.createElement('p'); badge.className = 'vote-result ' + (d.full ? 'r-approved' : 'r-open');
          badge.textContent = d.full ? 'Fully approved by all trustees' : 'Waiting for trustees: ' + d.trustees.filter(function (t) { return t.signed; }).length + ' of ' + d.trustees.length + ' signed';
          st.appendChild(badge);
          var ul = document.createElement('ul'); ul.className = 'trustee-who';
          d.trustees.forEach(function (t) {
            var li = document.createElement('li'), ap = d.items.filter(function (it) { return t.decisions[it.id] === 'Approve'; }).length;
            var sb = document.createElement('span'); sb.className = 'badge lr-badge' + (t.signed ? ' lr-badge--done' : ''); sb.textContent = t.signed ? '✓ Signed' : 'Not signed'; li.appendChild(sb);   // same as ✓ Completed (Alex, 2026-11-25)
            li.appendChild(document.createTextNode(' ' + t.name + (t.signed ? ': signed ' + t.when + ' · ' + ap + ' of ' + d.items.length + ' approved' : '')));
            ul.appendChild(li);
          });
          st.appendChild(ul); if (!info) card.appendChild(st);
          if (res.trustee && !info) {
            var signed = !!(d.mine && d.mine.signed), mine = signed ? (d.mine.decisions || {}) : {};
            var form = document.createElement('form'); form.className = 'trustee-form';
            var hh = document.createElement('p'); hh.className = 'vote-head'; hh.textContent = d.mine && d.mine.signed ? 'Your decisions (you can sign again to change them)' : 'Your decisions'; form.appendChild(hh);
            d.items.forEach(function (it) {
              var row = document.createElement('fieldset'); row.className = 'trustee-item';
              var lg = document.createElement('legend'); lg.textContent = it.label; row.appendChild(lg);
              if (it.detail) {   // what is being approved (spec §80 fix); several lines = numbered list (spec §94)
                var dl = it.detail.split('\n');
                if (dl.length > 1) { var ol = document.createElement('ol'); ol.className = 'trustee-detail trustee-detail-list'; dl.forEach(function (x) { var li = document.createElement('li'); li.textContent = x; /* carries its own number, e.g. 10.1. */ ol.appendChild(li); }); row.appendChild(ol); }
                else { var dt = document.createElement('p'); dt.className = 'trustee-detail'; dt.textContent = it.detail; row.appendChild(dt); }
              }
              var note = document.createElement('input'); note.type = 'text'; note.name = 'note-' + it.id; note.placeholder = 'Why, or what should change?'; note.className = 'trustee-note'; note.hidden = !mine[it.id] || mine[it.id] === 'Approve';
              ['Approve', 'Deny', 'Revise'].forEach(function (c) {   // same choices as the PDF (spec §80, Alex 2026-11-24)
                var lab = document.createElement('label'), r = document.createElement('input');
                r.type = 'radio'; r.name = 'dec-' + it.id; r.value = c; r.checked = mine[it.id] === c;
                r.addEventListener('change', function () { note.hidden = c === 'Approve'; });
                lab.appendChild(r); lab.appendChild(document.createTextNode(' ' + c)); row.appendChild(lab);
              });
              row.appendChild(note); form.appendChild(row);
            });
            var cons = document.createElement('label'); cons.className = 'trustee-consent';
            var cb = document.createElement('input'); cb.type = 'checkbox'; cb.name = 'consent';
            cons.appendChild(cb); cons.appendChild(document.createTextNode(' I agree that typing my name below is my electronic signature.'));
            form.appendChild(cons);
            var sig = document.createElement('input'); sig.type = 'text'; sig.name = 'signature'; sig.autocomplete = 'name'; sig.className = 'trustee-sig';
            sig.placeholder = 'Type your full name: ' + res.name; form.appendChild(sig);
            cb.checked = !!signed; sig.value = signed ? (d.mine.signature || '') : '';   // signed: keep the agreement and the typed name (Alex, 2026-11-25)
            var go = document.createElement('button'); go.type = 'submit'; go.className = 'btn btn-primary'; go.textContent = 'Sign and submit'; form.appendChild(go);
            var fm = document.createElement('p'); fm.className = 'form-msg'; fm.setAttribute('role', 'status'); form.appendChild(fm);
            if (signed) {   // locked until "Change my decisions"
              var lock = function (on) { Array.prototype.forEach.call(form.querySelectorAll('input'), function (x) { x.disabled = on; }); go.hidden = on; };
              var sh = document.createElement('p'); sh.className = 'trustee-signed';
              var sbd = document.createElement('span'); sbd.className = 'badge lr-badge lr-badge--done'; sbd.textContent = '✓ Signed'; sh.appendChild(sbd);
              sh.appendChild(document.createTextNode(' ' + (d.mine.when ? 'on ' + d.mine.when : '')));
              form.insertBefore(sh, go);
              var chg = document.createElement('button'); chg.type = 'button'; chg.className = 'btn btn-outline'; chg.textContent = 'Change my decisions';
              chg.addEventListener('click', function () { lock(false); chg.hidden = true; sh.hidden = true; cb.checked = false; sig.value = ''; form.dataset.dirty = '1'; });
              form.insertBefore(chg, go); lock(true);
            }
            form.addEventListener('submit', function (e) {
              e.preventDefault();
              var dec = {}, notes = {};
              d.items.forEach(function (it) {
                var c = form.querySelector('input[name="dec-' + it.id + '"]:checked'); if (c) dec[it.id] = c.value;
                var n = form.querySelector('input[name="note-' + it.id + '"]'); if (n && n.value.trim()) notes[it.id] = n.value.trim();
              });
              go.disabled = true; say(fm, 'Signing…', true);
              post({ form: 'officer_trustee_sign', token: tok(), id: d.id, decisions: JSON.stringify(dec), notes: JSON.stringify(notes), consent: cb.checked ? 'yes' : '', signature: sig.value }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) return say(fm, r.error);
                say(fm, 'Signed. Your decisions and signature were saved with a PDF record.', true); loadTrustees();
              }).catch(function () { say(fm, 'Couldn’t save. Please try again.'); }).then(function () { go.disabled = false; });
            });
            card.appendChild(form);
          }
          tlist.appendChild(tg);
        });
      }).catch(function () { ttab.hidden = true; });
    };
    var load = function () {
      post({ form: 'officer_forms', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(omsg, res.error);
        document.getElementById('officer-name').textContent = res.name;
        document.getElementById('invite-form').classList.toggle('hidden', !res.canInvite);
        var onone = document.getElementById('officers-none'); if (onone) onone.classList.toggle('hidden', !!res.canInvite);
        if (reqForm) reqForm.classList.add('hidden');
        var has = function (a) { return (res.roles || []).indexOf(a) !== -1; };   // spec §52: tabs by area
        ['registrations', 'contest', 'documents', 'officers'].forEach(function (id) { var tb = document.getElementById('tab-' + id); if (tb) tb.hidden = !has(id); });
        var tAdmin = document.getElementById('tab-admin'); if (tAdmin) tAdmin.hidden = !res.owner;   // spec §55: owners only
        var cur = document.querySelector('#officer-panel .tab[aria-selected="true"]');
        if (!cur || cur.hidden) { var first = document.querySelector('#officer-panel .tab:not([hidden])'); if (first) first.click(); }
        if (has('contest')) loadEntries();
        if (has('documents')) loadDocs();
        if (has('officers')) { loadRequests(); loadOfficers(); }
        if (res.owner) { loadAdmin(); loadSignIns(); loadTrusteeEmails(); }
        loadTrustees();   // spec §80
        loadLegal();   // spec §93
        loadTreasurer();  // spec §84
        olog.classList.add('hidden'); opan.classList.remove('hidden'); obody.innerHTML = '';
        if (!res.forms.length) { var p0 = document.createElement('p'); p0.className = 'note'; p0.textContent = 'No signed forms yet.'; obody.appendChild(p0); return; }
        res.forms.sort(function (x, y) { return x.id < y.id ? -1 : x.id > y.id ? 1 : 0; });   // by Form ID, lowest first (spec §43)
        res.forms.forEach(function (f) {
          var tr = document.createElement('tr'), b = document.createElement('button'), box = document.createElement('input'), lab = document.createElement('label'), by = document.createElement('span');
          // spec §57: one collapsible row per form; the details table opens on click
          var acc = document.createElement('details'), sum = document.createElement('summary'), sid = document.createElement('span'), snm = document.createElement('span'), sag = document.createElement('span'), chip = document.createElement('span');
          acc.className = 'doc-acc reg-acc'; acc.open = !!openRegs[f.id];
          sid.className = 'reg-id'; sid.textContent = f.id; snm.className = 'doc-title reg-name'; snm.textContent = f.name + (f.guardian ? ' (parent: ' + f.guardian + ')' : ''); sag.className = 'doc-sum'; sag.textContent = f.age;
          var stx = f.signed === false ? 'Not signed yet' : f.status === 'Pending approval' || !f.status ? 'Waiting for approval' : f.status;
          var scl = { 'Approved': 'r-approved', 'Denied': 'r-not', 'Closed': 'r-open', 'Waiting for approval': 'r-revise', 'Not signed yet': 'r-open' };
          chip.className = 'vote-result ' + (scl[stx] || 'r-open'); chip.textContent = stx + (f.nameOk === false && stx === 'Waiting for approval' ? ' · name to check' : '') + (f.pdfOk === false ? ' · PDF to rebuild' : '');
          sum.appendChild(sid); sum.appendChild(snm); sum.appendChild(sag); sum.appendChild(chip); acc.appendChild(sum);
          var tw = document.createElement('div'), tbl = document.createElement('table'), th = document.createElement('thead'), tb = document.createElement('tbody');
          tw.className = 'roster-wrap reg-body'; tbl.className = 'roster-table officer-table';
          th.innerHTML = '<tr><th scope="col">Signed</th><th scope="col">Form PDF</th><th scope="col">Approved</th></tr>';
          tbl.appendChild(th); tbl.appendChild(tb); tw.appendChild(tbl); acc.appendChild(tw);
          acc.addEventListener('toggle', function () { if (acc.open) openRegs[f.id] = 1; else delete openRegs[f.id]; });
          obody.appendChild(acc);
          var sc = cell(tr, f.signedAt.replace(/ at .*/, '')); if (f.revision > 1) { var up = document.createElement('span'); up.className = 'by'; up.textContent = 'Updated ' + f.updatedAt + ' (rev ' + f.revision + ')'; sc.appendChild(up); }
          if (f.signed === false) {   // spec §43: not signed yet -> nothing to view or approve
            cell(tr, 'Not signed yet');
            var wait = document.createElement('span'); wait.className = 'by'; wait.textContent = 'Waiting for the member to complete and sign it (Change my registration)';
            cell(tr, wait); tb.appendChild(tr); return;
          }
          b.type = 'button'; b.className = 'link'; b.textContent = 'View'; b.addEventListener('click', function () { openPdf(f.id, b); }); cell(tr, b);
          if (f.pdfOk === false) {   // spec §43: the row's PDF belongs to another form -> rebuild it from the row
            var warn = document.createElement('span'), rb = document.createElement('button');
            warn.className = 'by'; warn.textContent = 'PDF belongs to another form'; rb.type = 'button'; rb.className = 'link'; rb.textContent = 'Rebuild PDF';
            rb.addEventListener('click', function () {
              rb.disabled = true; say(omsg, 'Rebuilding ' + f.id + '…', true);
              post({ form: 'officer_rebuild_pdf', token: tok(), id: f.id }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                say(omsg, res.ok ? res.note : res.error, res.ok); if (res.ok) { warn.remove(); rb.remove(); } else rb.disabled = false;
              }).catch(function () { rb.disabled = false; say(omsg, 'Couldn’t rebuild. Please try again.'); });
            });
            b.parentNode.appendChild(warn); b.parentNode.appendChild(rb);
          }
          box = document.createElement('span'); box.className = 'officer-actions'; by.className = 'by';   // spec §45: Approve · Reply · Deny
          var mailNote = document.createElement('span'), mailBtn = document.createElement('button');
          mailNote.className = 'by'; mailBtn.type = 'button'; mailBtn.className = 'btn btn-sm btn-outline'; mailBtn.textContent = 'Email copy';
          var apBar = document.createElement('div'); apBar.className = 'officer-actions approved-actions';
          mailBtn.addEventListener('click', function () {   // spec §43: send (again) the approved PDF to the form's email
            if (!window.confirm('Email the approved form ' + f.id + ' to the email on the form?')) return;
            mailBtn.disabled = true; say(omsg, 'Emailing ' + f.id + '…', true);
            post({ form: 'officer_email_approved', token: tok(), id: f.id }).then(function (res) {
              if (res.signedOut) return signOut(res.error);
              mailBtn.disabled = false; mailNote.textContent = res.emailNote || res.error || '';
              say(omsg, res.ok ? f.id + ': ' + res.emailNote + '.' : res.error, res.ok);
            }).catch(function () { mailBtn.disabled = false; say(omsg, 'Couldn’t send. Please try again.'); });
          });
          var done = function (who, note) { var t = document.createElement('span'); t.className = 'ok-tick'; t.textContent = '\u2713 Approved'; if (box.parentNode) box.parentNode.replaceChild(t, box); else box = t; by.textContent = 'by ' + who; mailNote.textContent = note || 'Not emailed yet'; lab.appendChild(mailNote); apBar.appendChild(mailBtn); lab.appendChild(apBar); };
          var last = document.createElement('span'); last.className = 'by'; if (f.note) last.textContent = 'Last: ' + f.note;
          var act = function (label, cls) { var x = document.createElement('button'); x.type = 'button'; x.className = 'btn btn-sm ' + cls; x.textContent = label; box.appendChild(x); return x; };
          lab.appendChild(box); lab.appendChild(by); lab.appendChild(last);
          var openClose = function (setBusy, closed) {   // spec §50/§58: close as a duplicate; no email; needs the replacing form
            if (tr.nextSibling && tr.nextSibling.className === 'reply-row') tr.parentNode.removeChild(tr.nextSibling);
            var row = document.createElement('tr'), td = document.createElement('td'), lb = document.createElement('label'), ta = document.createElement('textarea'), go = document.createElement('button'), no = document.createElement('button'), bar = document.createElement('div');
            row.className = 'reply-row'; td.colSpan = 3; td.className = 'reply-cell';
            lb.textContent = 'Close ' + f.id + ' (' + f.name + ') as a duplicate. No email is sent. Give the form that replaces it' + (f.status === 'Approved' ? ' (it must be approved already)' : '') + ':';
            ta.rows = 2; ta.className = 'reply-text'; ta.value = 'Replaced by RF' + f.id.slice(2, 7) + ''; lb.appendChild(ta);
            go.type = 'button'; go.className = 'btn btn-sm btn-primary'; go.textContent = 'Close form';
            no.type = 'button'; no.className = 'btn btn-sm btn-outline'; no.textContent = 'Cancel';
            bar.className = 'officer-actions'; bar.appendChild(go); bar.appendChild(no);
            td.appendChild(lb); td.appendChild(bar); row.appendChild(td); tr.parentNode.insertBefore(row, tr.nextSibling);
            ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
            no.addEventListener('click', function () { row.parentNode.removeChild(row); });
            go.addEventListener('click', function () {
              setBusy(true); go.disabled = no.disabled = true; say(omsg, 'Closing ' + f.id + '…', true);
              post({ form: 'officer_close', token: tok(), id: f.id, message: ta.value.trim() }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                if (!res.ok) { setBusy(false); go.disabled = no.disabled = false; return say(omsg, res.error); }
                row.parentNode.removeChild(row); last.textContent = 'Last: ' + res.note; closed();
                chip.className = 'vote-result r-open'; chip.textContent = 'Closed';
                say(omsg, f.id + ' closed (no email sent).', true);
              }).catch(function () { setBusy(false); go.disabled = no.disabled = false; say(omsg, 'Couldn’t close. Please try again.'); });
            });
          };
          if (f.status === 'Approved') {
            done(f.approvedBy, f.emailed);
            var cl = document.createElement('button'); cl.type = 'button'; cl.className = 'btn btn-sm btn-outline'; cl.textContent = 'Close (replaced by a newer form)';
            cl.addEventListener('click', function () {
              openClose(function (on) { cl.disabled = on; }, function () {
                var dn4 = document.createElement('span'); dn4.className = 'denied-tick'; dn4.textContent = '\u2715 Closed';
                Array.prototype.slice.call(lab.childNodes).forEach(function (n) { if (n !== last) lab.removeChild(n); });
                lab.insertBefore(dn4, last);
              });
            });
            apBar.appendChild(cl); cell(tr, lab); tb.appendChild(tr); return;
          }
          if (f.status === 'Denied' || f.status === 'Closed') { var dn = document.createElement('span'); dn.className = 'denied-tick'; dn.textContent = '\u2715 ' + f.status; lab.replaceChild(dn, box); cell(tr, lab); tb.appendChild(tr); return; }
          var bA = act('Approve', 'btn-primary'), bR = act('Reply', 'btn-outline'), bD = act('Deny', 'btn-outline btn-deny'), bC = act('Close as duplicate', 'btn-outline');
          var busy = function (on) { bA.disabled = bR.disabled = bD.disabled = bC.disabled = on; };
          bC.addEventListener('click', function () {   // spec §50
            openClose(busy, function () { var dn3 = document.createElement('span'); dn3.className = 'denied-tick'; dn3.textContent = '\u2715 Closed'; box.parentNode.replaceChild(dn3, box); });
          });
          if (f.nameOk === false) { var nw = document.createElement('span'); nw.className = 'by warn'; nw.textContent = 'Name doesn\u2019t look like a real name: use Reply to ask for it, or Deny.'; lab.insertBefore(nw, by); }
          bA.addEventListener('click', function () {
            if (!window.confirm('Approve form ' + f.id + ' for ' + f.name + '?\n\nThis signs the approval electronically in your name.')) return;
            busy(true); say(omsg, 'Approving ' + f.id + '…', true);
            post({ form: 'officer_approve', token: tok(), id: f.id }).then(function (res) {
              if (res.signedOut) return signOut(res.error);
              if (!res.ok) { busy(false); return say(omsg, res.error); }
              done(res.approvedBy, res.emailNote); last.textContent = ''; say(omsg, f.id + ' approved. The approved PDF is saved. ' + (res.emailNote || '') + '.', true);
            }).catch(function () { busy(false); say(omsg, 'Couldn’t save. Please try again.'); });
          });
          var first = String(f.name || '').split(/[\s_]+/)[0];
          var suggest = function (deny) {   // spec §45: pre-filled, editable
            if (f.nameOk === false) return deny
              ? 'We can\u2019t accept this membership form because the player\u2019s name (\u201c' + f.name + '\u201d) isn\u2019t a real first and last name. You\u2019re very welcome to sign up again using the player\u2019s real name.'
              : 'Thank you for signing up! The player\u2019s name on the form (\u201c' + f.name + '\u201d) looks like a username. For SJFACC\u2019s records, membership forms need the player\u2019s real first and last name. Could you please update it on the Change my registration page (link below)? We\u2019ll approve the form as soon as it\u2019s updated.';
            return deny
              ? 'We\u2019re sorry, but we can\u2019t approve this membership form because '
              : 'Thank you for signing up for SJFACC! Before we approve the form, could you please ';
          };
          var send = function (kind) {
            var deny = kind === 'deny';
            if (tr.nextSibling && tr.nextSibling.className === 'reply-row') tr.parentNode.removeChild(tr.nextSibling);
            var row = document.createElement('tr'), td = document.createElement('td'), lb = document.createElement('label'), ta = document.createElement('textarea'), go = document.createElement('button'), no = document.createElement('button'), bar = document.createElement('div');
            row.className = 'reply-row'; td.colSpan = 3; td.className = 'reply-cell';
            lb.textContent = (deny ? 'Reason for denying ' : 'Reply about ') + f.id + ' (' + f.name + '). Emailed to the address on the form; edit as you like:';
            ta.rows = 5; ta.value = suggest(deny); ta.className = 'reply-text'; lb.appendChild(ta);
            go.type = 'button'; go.className = 'btn btn-sm ' + (deny ? 'btn-outline btn-deny' : 'btn-primary'); go.textContent = deny ? 'Deny and send' : 'Send reply';
            no.type = 'button'; no.className = 'btn btn-sm btn-outline'; no.textContent = 'Cancel';
            var tst = document.createElement('button'); tst.type = 'button'; tst.className = 'btn btn-sm btn-outline'; tst.textContent = 'Send me a test';
            bar.className = 'officer-actions'; bar.appendChild(go); bar.appendChild(tst); bar.appendChild(no);
            tst.addEventListener('click', function () {   // spec §45: same email with [TEST], to the signed-in officer only
              var tmsg = ta.value.trim(); if (!tmsg) return say(omsg, 'Please type your message.');
              tst.disabled = true; say(omsg, 'Sending a test to you…', true);
              post({ form: deny ? 'officer_deny' : 'officer_reply', token: tok(), id: f.id, message: tmsg, site: location.origin, test: 'yes' }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                tst.disabled = false; say(omsg, res.ok ? res.note : res.error, res.ok);
              }).catch(function () { tst.disabled = false; say(omsg, 'Couldn’t send the test. Please try again.'); });
            });
            td.appendChild(lb); td.appendChild(bar); row.appendChild(td); tr.parentNode.insertBefore(row, tr.nextSibling);
            ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
            no.addEventListener('click', function () { row.parentNode.removeChild(row); });
            go.addEventListener('click', function () {
              var msg = ta.value.trim();
              if (!msg) return say(omsg, deny ? 'Please give the reason.' : 'Please type your message.');
              if (deny && !window.confirm('Deny form ' + f.id + ' for ' + f.name + '?\n\nThe member is emailed your reason and the form leaves the public list.')) return;
              busy(true); go.disabled = no.disabled = true; say(omsg, (deny ? 'Denying ' : 'Sending reply for ') + f.id + '…', true);
              post({ form: deny ? 'officer_deny' : 'officer_reply', token: tok(), id: f.id, message: msg, site: location.origin }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                if (!res.ok) { busy(false); go.disabled = no.disabled = false; return say(omsg, res.error); }
                row.parentNode.removeChild(row); last.textContent = 'Last: ' + res.note;
                if (deny) { var dn2 = document.createElement('span'); dn2.className = 'denied-tick'; dn2.textContent = '\u2715 Denied'; box.parentNode.replaceChild(dn2, box); } else busy(false);
                say(omsg, f.id + ': ' + (deny ? 'denied' : 'reply sent') + ' to ' + res.sentTo + '.', true);
              }).catch(function () { busy(false); go.disabled = no.disabled = false; say(omsg, 'Couldn’t send. Please try again.'); });
            });
          };
          bR.addEventListener('click', function () { send('reply'); });
          bD.addEventListener('click', function () { send('deny'); });
          cell(tr, lab); tb.appendChild(tr);
        });
      }).catch(function () { say(omsg, 'Couldn’t load the forms. Please try again.'); });
    };
    document.getElementById('officer-out').addEventListener('click', function () { signOut('Signed out.'); });
    // spec §52: auto-refresh every 60 s while signed in and visible; never while the officer is typing or replying
    // spec §91: a form the officer has started filling in (radio, checkbox, typed name) is never wiped by the refresh
    var markDirty = function (e) { var f = e.target && e.target.closest && e.target.closest('form'); if (f && opan.contains(f)) f.dataset.dirty = '1'; };
    opan.addEventListener('change', markDirty); opan.addEventListener('input', markDirty);
    var busy = function () {
      if (opan.querySelector('.reply-row') || opan.querySelector('form[data-dirty]')) return true;
      var tas = opan.querySelectorAll('textarea');
      for (var i = 0; i < tas.length; i++) if (tas[i].value.trim() || tas[i] === document.activeElement) return true;
      return false;
    };
    var stamp = function () {
      var h = document.querySelector('#officer-panel .officer-head p'), u = document.getElementById('officer-updated');
      if (!h) return; if (!u) { u = document.createElement('span'); u.id = 'officer-updated'; u.className = 'by'; h.appendChild(u); }
      u.textContent = 'Updated ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' · refreshes every minute';
    };
    var autoRefresh = function () {
      if (document.hidden || !tok() || opan.classList.contains('hidden') || busy()) return;
      var y = window.scrollY; load(); setTimeout(function () { window.scrollTo(0, y); stamp(); }, 1500);
    };
    setInterval(autoRefresh, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) autoRefresh(); });
    olog.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = olog.querySelector('button'); btn.disabled = true; say(lmsg, '');
      var devId = '';   // spec §63: a random ID for this browser, so new devices can be noticed
      try { devId = localStorage.getItem('fassjDevice') || ''; if (!devId) { devId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now(); localStorage.setItem('fassjDevice', devId); } } catch (e) {}
      post({ form: 'officer_login', email: olog.email.value, code: olog.code.value, device: devId, ua: navigator.userAgent }).then(function (res) {
        if (!res.ok) return say(lmsg, res.error);
        tok(res.token); olog.reset(); load();
      }).catch(function () { say(lmsg, 'Couldn’t sign in. Please try again.'); }).then(function () { btn.disabled = false; });
    });
    // 2028 shirt contest entries: view, approve, reject (spec §25a).
    var elist = document.getElementById('entry-list'), emsg3 = document.getElementById('entry-msg');
    var statusText = function (e) {
      if (e.status === 'approved') return '✓ Approved' + (e.reviewedBy ? ' by ' + e.reviewedBy : '') + (e.reviewedAt ? ', ' + e.reviewedAt : '');
      if (e.status === 'rejected') return '✗ Rejected' + (e.reviewedBy ? ' by ' + e.reviewedBy : '') + (e.reviewedAt ? ', ' + e.reviewedAt : '');
      return 'Waiting for review';
    };
    var openEntries = {};   // contest entries kept open across refreshes
    var loadEntries = function () {
      if (!elist) return;
      post({ form: 'officer_entries', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) { elist.textContent = res.error || 'Couldn’t load the entries.'; return; }
        elist.innerHTML = '';
        if (!res.entries.length) { var none = document.createElement('p'); none.className = 'note'; none.textContent = 'No contest entries yet.'; elist.appendChild(none); return; }
        res.entries.forEach(function (e) {
          var card = document.createElement('div'); card.className = 'entry-card entry-' + e.status;
          var pic = document.createElement('div'); pic.className = 'entry-pic';
          var vb = document.createElement('button'); vb.type = 'button'; vb.className = 'btn btn-outline btn-sm'; vb.textContent = 'View design'; pic.appendChild(vb);
          vb.addEventListener('click', function () {
            vb.disabled = true; vb.textContent = 'Loading…';
            post({ form: 'officer_entry_image', token: tok(), id: e.id }).then(function (r) {
              if (r.signedOut) return signOut(r.error);
              if (!r.ok) { vb.disabled = false; vb.textContent = 'View design'; say(emsg3, r.error); return; }
              var img = document.createElement('img'); img.alt = 'Design ' + e.id + ': ' + e.title; img.src = 'data:' + r.type + ';base64,' + r.data;
              img.setAttribute('data-lightbox', img.src); img.setAttribute('data-caption', e.id + ' · ' + e.title);
              pic.innerHTML = ''; pic.appendChild(img);
            }).catch(function () { vb.disabled = false; vb.textContent = 'View design'; say(emsg3, 'Couldn’t load the design.'); });
          });
          var info = document.createElement('div'); info.className = 'entry-info';
          var h = document.createElement('h4'); h.textContent = e.id + ' · ' + e.title; info.appendChild(h);
          [['By', e.name + (e.age ? ' (' + e.age + ')' : '')], ['Parent/guardian', e.guardian ? e.guardian + (e.guardianOk === 'yes' ? ', gave OK' : '') : ''], ['Printed name if it wins', e.credit], ['About', e.about], ['Received', e.received]].forEach(function (kv) {
            if (!kv[1]) return; var p2 = document.createElement('p'); var b2 = document.createElement('b'); b2.textContent = kv[0] + ': '; p2.appendChild(b2); p2.appendChild(document.createTextNode(kv[1])); info.appendChild(p2);
          });
          var st = document.createElement('p'); st.className = 'entry-status'; st.textContent = statusText(e); info.appendChild(st);
          var acts = document.createElement('div'); acts.className = 'entry-actions';
          [['approve', 'Approve', 'btn btn-primary btn-sm', 'approved'], ['reject', 'Reject', 'btn btn-outline btn-sm', 'rejected']].forEach(function (d) {
            if (e.status === d[3]) return;
            var bt = document.createElement('button'); bt.type = 'button'; bt.className = d[2]; bt.textContent = d[1];
            bt.addEventListener('click', function () {
              var q = d[0] === 'approve' ? 'Approve ' + e.id + ' “' + e.title + '”? It will appear in the public gallery straight away.' : 'Reject ' + e.id + ' “' + e.title + '”? It will not be shown' + (e.status === 'approved' ? ' and is taken out of the gallery' : '') + '.';
              if (!window.confirm(q)) return;
              acts.querySelectorAll('button').forEach(function (x) { x.disabled = true; }); say(emsg3, 'Saving…', true);
              post({ form: 'officer_entry_review', token: tok(), id: e.id, decision: d[0] }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) { say(emsg3, r.error); acts.querySelectorAll('button').forEach(function (x) { x.disabled = false; }); return; }
                say(emsg3, e.id + (r.status === 'approved' ? ' approved: it is now in the gallery.' : ' rejected.'), true); loadEntries();
              }).catch(function () { say(emsg3, 'Couldn’t save. Please try again.'); acts.querySelectorAll('button').forEach(function (x) { x.disabled = false; }); });
            });
            acts.appendChild(bt);
          });
          info.appendChild(acts); card.appendChild(pic); card.appendChild(info);
          // collapsible row: entry number and title, with its status; opens to the design and buttons
          var acc = document.createElement('details'), sum = document.createElement('summary'), st1 = document.createElement('span'), ch1 = document.createElement('span');
          acc.className = 'doc-acc entry-acc'; acc.open = !!openEntries[e.id];
          st1.className = 'doc-title'; st1.textContent = e.id + ' · ' + e.title;
          var enNo = document.createElement('span'); enNo.className = 'doc-no'; enNo.textContent = String(res.entries.indexOf(e) + 1); sum.appendChild(enNo);   // spec §68
          var SC = { approved: 'r-approved', rejected: 'r-not' }; ch1.className = 'vote-result ' + (SC[e.status] || 'r-revise'); ch1.textContent = e.status === 'approved' ? 'Approved' : e.status === 'rejected' ? 'Rejected' : 'Waiting for review';
          sum.appendChild(st1); sum.appendChild(ch1); acc.appendChild(sum); acc.appendChild(card);
          acc.addEventListener('toggle', function () { if (acc.open) openEntries[e.id] = 1; else delete openEntries[e.id]; });
          elist.appendChild(acc);
        });
      }).catch(function () { elist.textContent = 'Couldn’t load the entries.'; });
    };
    // spec §52 phase 1: Board documents (view, download, comments) and officer access requests
    var dlist = document.getElementById('doc-list'), dmsg = document.getElementById('doc-msg'), openDocs = {};   // spec §54: which document cards are open (kept across auto-refresh)
    var b64Blob = function (data, mime) { var bin = atob(data), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new Blob([bytes], { type: mime }); };
    var docOpen = function (d, btn, download) {
      btn.disabled = true; say(dmsg, 'Opening ' + d.name + '…', true);
      post({ form: 'officer_doc', token: tok(), id: d.id }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(dmsg, res.error);
        var a = document.createElement('a'); a.href = URL.createObjectURL(b64Blob(res.data, res.mime)); a.rel = 'noopener';
        if (download || d.kind !== 'pdf') a.download = res.name; else a.target = '_blank';
        document.body.appendChild(a); a.click(); a.remove(); say(dmsg, '');
      }).catch(function () { say(dmsg, 'Couldn’t open the document. Please try again.'); }).then(function () { btn.disabled = false; });
    };
    var loadDocs = function () {
      if (!dlist) return;
      post({ form: 'officer_docs', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) { dlist.innerHTML = ''; return say(dmsg, res.error); }
        dlist.innerHTML = '';
        if (!res.docs.length) { var none = document.createElement('p'); none.className = 'note'; none.textContent = 'No documents yet.'; dlist.appendChild(none); return; }
        var board = res.board || 0, maj = res.majority || 1, canVote = res.canVote !== false;
        var KINDS = ['Approved', 'Not approved', 'Revise'], RCLS = { 'Approved': 'r-approved', 'Not approved': 'r-not', 'Revise': 'r-revise', 'Open': 'r-open' };
        var resultOf = function (t) { for (var i = 0; i < KINDS.length; i++) if (board && t[KINDS[i]] >= maj) return KINDS[i]; return 'Open'; };
        var tallyLine = function (el, t) {   // spec §54: live tally and result
          var voted = t['Approved'] + t['Not approved'] + t['Revise'], r = resultOf(t);
          el.innerHTML = '';
          var badge = document.createElement('span'); badge.className = 'vote-result ' + RCLS[r];
          badge.textContent = r === 'Open' ? 'Open · ' + voted + ' of ' + board + ' voted' : r + ' · majority of ' + board;
          var nums = document.createElement('span'); nums.className = 'vote-nums';
          nums.textContent = t['Approved'] + ' Approve · ' + t['Not approved'] + ' Not approved · ' + t['Revise'] + ' Revise';
          el.appendChild(badge); el.appendChild(nums);
        };
        res.docs.forEach(function (d) {
          var card = document.createElement('div'), head = document.createElement('div'), nm = document.createElement('b'), when = document.createElement('span'), acts = document.createElement('span');
          card.className = 'doc-card-o doc-body'; head.className = 'doc-head'; when.className = 'by'; acts.className = 'officer-actions';
          nm.className = 'doc-title'; nm.textContent = d.title || d.name; when.textContent = d.tech || '';
          var v = document.createElement('button'); v.type = 'button'; v.className = 'btn btn-sm btn-primary'; v.textContent = d.kind === 'pdf' ? 'View' : 'Download';
          v.addEventListener('click', function () { docOpen(d, v, d.kind !== 'pdf'); }); acts.appendChild(v);
          if (d.kind === 'pdf') { var dl = document.createElement('button'); dl.type = 'button'; dl.className = 'btn btn-sm btn-outline'; dl.textContent = 'Download'; dl.addEventListener('click', function () { docOpen(d, dl, true); }); acts.appendChild(dl); }
          acts.classList.add('doc-open'); head.appendChild(nm); card.appendChild(head);
          if (d.about) { var ab = document.createElement('p'); ab.className = 'doc-about'; ab.textContent = d.about; card.appendChild(ab); }
          if (d.tech) card.appendChild(when);   // file name, type and date: owners only (spec §54)
          card.appendChild(acts);   // spec §52: View/Download on their own row
          if ((d.items || []).length) {   // spec §54: vote on each item
            var ih = document.createElement('p'); ih.className = 'vote-head'; ih.textContent = 'Items to decide'; card.appendChild(ih);
            var vl = document.createElement('div'); vl.className = 'vote-list';
            d.items.forEach(function (it) {
              var row = document.createElement('div'), lab = document.createElement('p'), tl = document.createElement('p'), who = document.createElement('p'), bs = document.createElement('div');
              row.className = 'vote-row'; lab.className = 'vote-label'; tl.className = 'vote-tally'; who.className = 'vote-who'; bs.className = 'vote-btns';
              lab.textContent = it.label;
              var voters = (it.voters || []).slice(), tally = it.tally, mine = it.mine;
              var showWho = function () { who.textContent = voters.length ? voters.map(function (v) { return v.officer + ': ' + v.vote; }).join(' · ') : 'No votes yet.'; };
              tallyLine(tl, tally); showWho();
              row.appendChild(lab); row.appendChild(tl); row.appendChild(who);
              if (canVote) {
                var btns = [];
                [['Approve', 'Approved'], ['Not approved', 'Not approved'], ['Revise', 'Revise']].forEach(function (b) {
                  var x = document.createElement('button'); x.type = 'button'; x.className = 'btn btn-sm btn-outline vote-btn'; x.textContent = b[0]; x.dataset.vote = b[1];
                  x.setAttribute('aria-pressed', mine === b[1] ? 'true' : 'false');
                  x.addEventListener('click', function () {
                    if (mine === b[1]) return;
                    btns.forEach(function (y) { y.disabled = true; });
                    post({ form: 'officer_doc_vote', token: tok(), id: d.id, item: it.id, vote: b[1] }).then(function (r2) {
                      if (r2.signedOut) return signOut(r2.error);
                      if (!r2.ok) return say(dmsg, r2.error);
                      if (mine) tally[mine]--; tally[b[1]]++; mine = b[1];
                      var meName = (document.getElementById('officer-name') || {}).textContent || 'You';
                      voters = voters.filter(function (v) { return v.officer !== meName; }); voters.push({ officer: meName, vote: b[1] });
                      btns.forEach(function (y) { y.setAttribute('aria-pressed', y.dataset.vote === mine ? 'true' : 'false'); });
                      tallyLine(tl, tally); showWho(); say(dmsg, it.label + ': your vote is recorded (' + b[0] + ').', true);
                    }).catch(function () { say(dmsg, 'Couldn’t save your vote. Please try again.'); }).then(function () { btns.forEach(function (y) { y.disabled = false; }); });
                  });
                  btns.push(x); bs.appendChild(x);
                });
                row.appendChild(bs);
              }
              vl.appendChild(row);
            });
            card.appendChild(vl);
          }
          var wh = document.createElement('p'); wh.className = 'vote-head'; wh.textContent = (d.items || []).length ? 'The whole document' : (canVote ? 'Your decision on this document' : 'Decision on this document'); card.appendChild(wh);
          var dtl = document.createElement('p'); dtl.className = 'vote-tally'; var dTally = d.docTally || { 'Approved': 0, 'Not approved': 0, 'Revise': 0 }, dMine = d.docMine || '';
          tallyLine(dtl, dTally); card.appendChild(dtl);
          var list = document.createElement('ul'); list.className = 'doc-comments';
          var addC = function (c) { var li = document.createElement('li'), w = document.createElement('span'); w.className = 'by'; w.textContent = c.officer + ' · ' + c.when; li.appendChild(w); li.appendChild(document.createTextNode(c.text)); list.appendChild(li); };
          d.comments.forEach(addC); card.appendChild(list);
          // spec §52: each officer's latest decision, then Approve / Revise / Not approved (note from the comment box)
          var dl2 = document.createElement('ul'); dl2.className = 'doc-decisions';
          var cls = { 'Approved': 'd-approved', 'Revise': 'd-revise', 'Not approved': 'd-not' };
          var shown = {};
          var addD = function (x) {
            if (shown[x.officer]) dl2.removeChild(shown[x.officer]);
            var li = document.createElement('li'); li.className = cls[x.decision] || ''; li.textContent = x.officer + ': ' + x.decision + (x.note ? ' (\u201c' + x.note + '\u201d)' : '') + ' · ' + x.when;
            dl2.appendChild(li); shown[x.officer] = li;
          };
          (d.decisions || []).forEach(addD); card.appendChild(dl2);
          var ta = document.createElement('textarea'), send = document.createElement('button');
          ta.rows = 2; ta.className = 'reply-text'; ta.placeholder = 'Comment, or the note for your decision…'; ta.setAttribute('aria-label', 'Comment or note on ' + (d.title || d.name));
          send.type = 'button'; send.className = 'btn btn-sm btn-outline'; send.textContent = 'Add comment';
          send.addEventListener('click', function () {
            if (!ta.value.trim()) return say(dmsg, 'Please type your comment.');
            send.disabled = true;
            post({ form: 'officer_doc_comment', token: tok(), id: d.id, comment: ta.value }).then(function (res) {
              if (res.signedOut) return signOut(res.error);
              if (!res.ok) return say(dmsg, res.error);
              addC(res.comment); ta.value = ''; say(dmsg, 'Comment added.', true);
            }).catch(function () { say(dmsg, 'Couldn’t save the comment. Please try again.'); }).then(function () { send.disabled = false; });
          });
          var dacts = document.createElement('div'); dacts.className = 'officer-actions doc-actions';
          dacts.appendChild(send);
          [['Approve', 'Approved', 'btn-primary'], ['Revise', 'Revise', 'btn-outline'], ['Not approved', 'Not approved', 'btn-outline btn-deny']].forEach(function (b) {
            var x = document.createElement('button'); x.type = 'button'; x.className = 'btn btn-sm ' + b[2]; x.textContent = b[0];
            x.addEventListener('click', function () {
              var note = ta.value.trim();
              if (b[1] !== 'Approved' && !note) return say(dmsg, 'Please write what to change or why in the box first, then press ' + b[0] + '.');
              if (!window.confirm(b[0] + ': ' + (d.title || d.name) + (note ? '\n\nNote: ' + note : '') + '\n\nThis records your decision with your name and the time.')) return;
              x.disabled = true;
              post({ form: 'officer_doc_decide', token: tok(), id: d.id, decision: b[1], note: note }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                if (!res.ok) return say(dmsg, res.error);
                addD(res.decision); ta.value = ''; say(dmsg, 'Your decision is recorded: ' + res.decision.decision + '.', true);
                if (dMine) dTally[dMine]--; dTally[res.decision.decision]++; dMine = res.decision.decision; tallyLine(dtl, dTally);
              }).catch(function () { say(dmsg, 'Couldn’t save your decision. Please try again.'); }).then(function () { x.disabled = false; });
            });
            if (canVote) dacts.appendChild(x);
          });
          card.appendChild(ta); card.appendChild(dacts);
          // spec §54: title only; click to open the document's card
          var acc = document.createElement('details'), sum = document.createElement('summary'), st = document.createElement('span'), sr = document.createElement('span');
          acc.className = 'doc-acc'; acc.open = !!openDocs[d.id]; st.className = 'doc-title'; st.textContent = d.title || d.name;
          if (d.order && d.order < 999) { var no = document.createElement('span'); no.className = 'doc-no'; no.textContent = String(d.order); sum.appendChild(no); }   // Alex: number each board document
          var nItems = (d.items || []).length; sr.className = 'doc-sum';
          sr.textContent = nItems ? nItems + ' items to decide' : (d.docResult && d.docResult !== 'Open' ? d.docResult : 'Whole document');
          sum.appendChild(st); sum.appendChild(sr); acc.appendChild(sum);
          head.removeChild(nm); if (!head.childNodes.length) card.removeChild(head);
          acc.appendChild(card);
          acc.addEventListener('toggle', function () { if (acc.open) openDocs[d.id] = 1; else delete openDocs[d.id]; });
          dlist.appendChild(acc);
        });
      }).catch(function () { say(dmsg, 'Couldn’t load the documents. Please try again.'); });
    };
    var AREA_NAMES = [['registrations', 'Registrations'], ['contest', 'T-shirt contest'], ['documents', 'Approvals'], ['officers', 'Officers']];
    var areaText = function (r) { return r === 'all' ? 'Everything' : String(r || 'documents').split(/\s*,\s*/).map(function (a) { var n = AREA_NAMES.filter(function (x) { return x[0] === a; })[0]; return n ? n[1] : a; }).join(', '); };
    var roleChooser = function (current, canInv) {   // tick boxes for areas (only the club account invites, spec §52 v39)
      var box = document.createElement('div'); box.className = 'role-chooser';
      var cur = current === 'all' ? AREA_NAMES.map(function (x) { return x[0]; }) : String(current || 'documents').split(/\s*,\s*/);
      AREA_NAMES.forEach(function (a) { var l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.value = a[0]; c.checked = cur.indexOf(a[0]) !== -1; l.appendChild(c); l.appendChild(document.createTextNode(' ' + a[1])); box.appendChild(l); });
      box.values = function () { return { roles: Array.prototype.filter.call(box.querySelectorAll('input:not(.can-invite)'), function (c) { return c.checked; }).map(function (c) { return c.value; }).join(',') || 'documents', canInvite: '' }; };
      return box;
    };
    // spec §55: Admin tab: FASSJ officers and Board, with a fallback invitation
    var alist = document.getElementById('admin-list'), amsg = document.getElementById('admin-msg'), adminBusy = false;
    var loadAdmin = function () {
      if (!alist || adminBusy) return;
      if (alist.querySelector('input:focus') || Array.prototype.some.call(alist.querySelectorAll('input[type=email]'), function (x) { return x.value !== x.defaultValue; })) return;   // don't wipe typing on auto-refresh
      post({ form: 'admin_roster', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(amsg, res.error);
        alist.innerHTML = '';
        var group = '';
        res.roster.forEach(function (p) {
          if (p.group !== group) { group = p.group; var gh = document.createElement('p'); gh.className = 'vote-head'; gh.textContent = group === 'Board' ? 'Board of Directors' : group === 'Officer' ? 'Officers' : 'Other'; alist.appendChild(gh); }
          var row = document.createElement('div'), top = document.createElement('div'), nm = document.createElement('p'), st = document.createElement('span');
          row.className = 'admin-row'; top.className = 'admin-top'; nm.className = 'admin-name';
          nm.textContent = p.name + ' · ' + p.position;
          var SC = { 'Active': 'r-approved', 'Invitation sent': 'r-revise', 'Request waiting': 'r-revise' };
          st.className = 'vote-result ' + (SC[p.status] || 'r-open'); st.textContent = p.status + (p.roles ? ' · ' + areaText(p.roles) : '');
          top.appendChild(nm); top.appendChild(st);
          var td = p.trusteeDocs;   // spec §87: trustee-docs marker
          if (td && td.recipient) {
            var tb = document.createElement('span');
            tb.className = 'vote-result ' + (td.unsent.length ? 'r-open' : 'r-approved');
            tb.textContent = td.sent.length ? 'Trustee docs sent · ' + td.sent.map(function (x) { return x.code + ' (' + x.when + ')'; }).join(', ') + (td.unsent.length ? ' · not yet: ' + td.unsent.join(', ') : '') : 'Trustee docs not sent yet';
            top.appendChild(tb);
          }
          if (p.removable) {   // spec §86: Remove (owners only; built-in interim officers and trustees can't be removed)
            var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'btn btn-sm btn-outline btn-deny admin-remove'; rm.textContent = 'Remove';
            rm.addEventListener('click', function () {
              if (!window.confirm('Remove ' + p.name + ' from this list?' + (p.email ? '\n\nTheir officer sign-in (' + p.email + ') is removed too.' : ''))) return;
              rm.disabled = true; adminBusy = true;
              post({ form: 'admin_roster_remove', token: tok(), name: p.name }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) return say(amsg, r.error);
                say(amsg, p.name + ' removed' + (r.removedSignIn ? ', with their officer sign-in.' : '.'), true);
                adminBusy = false; loadAdmin(); if (typeof loadOfficers === 'function') loadOfficers();
              }).catch(function () { say(amsg, 'Couldn\u2019t remove. Please try again.'); }).then(function () { rm.disabled = false; adminBusy = false; });
            });
            top.appendChild(rm);
          }
          row.appendChild(top);
          if (p.status !== 'Active') {
            var em = document.createElement('input'); em.type = 'email'; em.className = 'admin-email'; em.placeholder = 'Email address'; em.value = p.email || ''; em.defaultValue = p.email || ''; em.setAttribute('aria-label', 'Email for ' + p.name);
            var ch = roleChooser('documents', false), acts = document.createElement('div'); acts.className = 'officer-actions';
            var sv = document.createElement('button'); sv.type = 'button'; sv.className = 'btn btn-sm btn-outline'; sv.textContent = 'Save email';
            var inv = document.createElement('button'); inv.type = 'button'; inv.className = 'btn btn-sm btn-primary'; inv.textContent = p.status === 'Invitation sent' ? 'Resend invitation' : 'Send invitation';
            sv.addEventListener('click', function () {
              sv.disabled = true;
              post({ form: 'admin_roster_set', token: tok(), name: p.name, email: em.value.trim() }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) return say(amsg, r.error);
                em.defaultValue = em.value; say(amsg, p.name + ': email saved.', true);
              }).catch(function () { say(amsg, 'Couldn’t save. Please try again.'); }).then(function () { sv.disabled = false; });
            });
            inv.addEventListener('click', function () {
              var e = em.value.trim(), v = ch.values();
              if (!e) return say(amsg, 'Please type ' + p.name + '’s email first.');
              if (!window.confirm(inv.textContent + ' to ' + p.name + ' (' + e + ')?\n\nAreas: ' + areaText(v.roles) + '\nThe email comes from the SJFACC admin account; the link works for 48 hours.')) return;
              inv.disabled = true; adminBusy = true;
              post({ form: 'admin_invite', token: tok(), name: p.name, email: e, roles: v.roles, site: location.origin }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) return say(amsg, r.error);
                em.defaultValue = em.value; say(amsg, p.name + ': invitation sent to ' + e + '.', true);
                adminBusy = false; loadAdmin(); if (typeof loadOfficers === 'function') loadOfficers();
              }).catch(function () { say(amsg, 'Couldn’t send. Please try again.'); }).then(function () { inv.disabled = false; adminBusy = false; });
            });
            // spec §85: View email = the invitation exactly as it will be sent
            var vw = document.createElement('button'); vw.type = 'button'; vw.className = 'btn btn-sm btn-outline'; vw.textContent = 'View email';
            var pv = document.createElement('div'); pv.className = 'tdoc-preview'; pv.hidden = true;
            vw.addEventListener('click', function () {
              if (!pv.hidden) { pv.hidden = true; vw.textContent = 'View email'; return; }
              vw.disabled = true;
              post({ form: 'admin_invite_preview', token: tok(), name: p.name, email: em.value.trim(), roles: ch.values().roles, site: location.origin }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) return say(amsg, r.error);
                pv.innerHTML = ''; var dl = document.createElement('dl'); dl.className = 'tdoc-head';
                [['From', r.from], ['To', r.to || '(type the email above)'], ['Subject', r.subject]].forEach(function (kv) { var dt = document.createElement('dt'); dt.textContent = kv[0]; var dd = document.createElement('dd'); dd.textContent = kv[1]; dl.appendChild(dt); dl.appendChild(dd); });
                var pre = document.createElement('pre'); pre.className = 'invite-body'; pre.textContent = r.body;
                pv.appendChild(dl); pv.appendChild(pre); pv.hidden = false; vw.textContent = 'Hide email';
              }).catch(function () { say(amsg, 'Couldn’t load the email. Please try again.'); }).then(function () { vw.disabled = false; });
            });
            acts.appendChild(sv); acts.appendChild(vw); acts.appendChild(inv);
            row.appendChild(em); row.appendChild(ch); row.appendChild(acts); row.appendChild(pv);
            if (p.status === 'Request waiting') { var rn = document.createElement('p'); rn.className = 'vote-who'; rn.textContent = 'They asked through Request access: you can approve it on the Officers tab, or send the invitation here.'; row.appendChild(rn); }
          } else {
            var ae = document.createElement('p'); ae.className = 'vote-who'; ae.textContent = p.email; row.appendChild(ae);
          }
          alist.appendChild(row);
        });
        // spec §55.4b: + Add a person
        var addBtn = document.createElement('button'), addF = document.createElement('div');
        addBtn.type = 'button'; addBtn.className = 'btn btn-sm btn-outline admin-add-btn'; addBtn.textContent = '+ Add a person';
        addF.className = 'admin-add hidden';
        var mk = function (tag, ph, lab) { var x = document.createElement(tag); if (ph) x.placeholder = ph; x.setAttribute('aria-label', lab); return x; };
        var gsel = mk('select', '', 'Group'); [['Board', 'Board of Directors'], ['Officer', 'Officer'], ['Other', 'Other']].forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; gsel.appendChild(op); });
        var nIn = mk('input', 'Full name', 'Full name'), pIn = mk('input', 'Position (e.g. Treasurer)', 'Position'), eIn = mk('input', 'Email (optional)', 'Email'); nIn.type = 'text'; pIn.type = 'text'; eIn.type = 'email';
        var pos = function () { pIn.hidden = gsel.value === 'Board'; }; gsel.addEventListener('change', pos); pos();
        var saveA = document.createElement('button'), cancelA = document.createElement('button');
        saveA.type = 'button'; saveA.className = 'btn btn-sm btn-primary'; saveA.textContent = 'Add to the list';
        cancelA.type = 'button'; cancelA.className = 'btn btn-sm btn-outline'; cancelA.textContent = 'Cancel';
        var aa = document.createElement('div'); aa.className = 'officer-actions'; aa.appendChild(saveA); aa.appendChild(cancelA);
        [gsel, nIn, pIn, eIn, aa].forEach(function (x) { addF.appendChild(x); });
        addBtn.addEventListener('click', function () { addF.classList.remove('hidden'); addBtn.classList.add('hidden'); nIn.focus(); adminBusy = true; });
        cancelA.addEventListener('click', function () { addF.classList.add('hidden'); addBtn.classList.remove('hidden'); adminBusy = false; });
        saveA.addEventListener('click', function () {
          saveA.disabled = true;
          post({ form: 'admin_roster_add', token: tok(), group: gsel.value, name: nIn.value, position: pIn.hidden ? '' : pIn.value, email: eIn.value }).then(function (r) {
            if (r.signedOut) return signOut(r.error);
            if (!r.ok) return say(amsg, r.error);
            say(amsg, nIn.value.trim() + ' added to the list.', true); adminBusy = false; loadAdmin();
          }).catch(function () { say(amsg, 'Couldn’t add. Please try again.'); }).then(function () { saveA.disabled = false; });
        });
        alist.appendChild(addBtn); alist.appendChild(addF);
      }).catch(function () { say(amsg, 'Couldn’t load the roster. Please try again.'); });
    };
    // spec §55.4d: tick boxes choose which Officers-tab sections show (FASSJ off, club on by default); remembered per browser
    Array.prototype.forEach.call(document.querySelectorAll('.sec-picker input[data-sec]'), function (cb) {
      var sec = document.getElementById(cb.dataset.sec), key = 'fassjSec:' + cb.dataset.sec;
      try { var v = localStorage.getItem(key); if (v !== null) cb.checked = v === '1'; } catch (e) {}
      var apply = function () { if (!sec) return; sec.hidden = !cb.checked; if (cb.checked) sec.open = true; };
      apply();
      cb.addEventListener('change', function () { apply(); try { localStorage.setItem(key, cb.checked ? '1' : '0'); } catch (e) {} });
    });
    var fbody = document.getElementById('fassj-list');   // spec §55.4c: FASSJ officers, read-only
    var loadFassj = function () {
      if (!fbody) return;
      post({ form: 'officer_fassj_roster', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        fbody.innerHTML = '';
        if (!res.ok) { var t0 = document.createElement('tr'); cell(t0, res.error).colSpan = 3; fbody.appendChild(t0); return; }
        var g = '';
        res.roster.forEach(function (p) {
          if (p.group !== g) { g = p.group; var gr = document.createElement('tr'); gr.className = 'group-row'; cell(gr, g === 'Board' ? 'Board of Directors' : g === 'Officer' ? 'Officers' : 'Other').colSpan = 3; fbody.appendChild(gr); }
          var tr = document.createElement('tr'); cell(tr, p.name); cell(tr, p.position); var sc = cell(tr, p.status || '—');
          if (p.status === 'Active') sc.className = 'st-active'; else if (p.status) sc.className = 'st-pending';
          fbody.appendChild(tr);
        });
      }).catch(function () {});
    };
    var sbody = document.getElementById('signin-list');   // spec §63: recent sign-ins (owners)
    // spec §83: Admin sub-tabs
    Array.prototype.forEach.call(document.querySelectorAll('#admin .subtab'), function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('#admin .subtab'), function (x) { x.setAttribute('aria-selected', String(x === b)); });
        Array.prototype.forEach.call(document.querySelectorAll('#admin .admin-sub'), function (sec) { sec.hidden = sec.id !== b.getAttribute('data-sub'); });
        if (b.getAttribute('data-sub') === 'admin-downloads') loadReview();
      });
    });
    // spec §106: Admin -> Downloads: review every pushed PDF (View, Download, Approve, Deny, Revise)
    var rvList = document.getElementById('review-list'), rvMsg = document.getElementById('review-msg');
    var rvOpen = function (d, btn, download) {
      btn.disabled = true; say(rvMsg, 'Opening ' + d.title + '\u2026', true);
      post({ form: 'admin_review_doc', token: tok(), id: d.id }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(rvMsg, res.error);
        var a = document.createElement('a'); a.href = URL.createObjectURL(b64Blob(res.data, res.mime)); a.rel = 'noopener';
        if (download) a.download = res.name; else a.target = '_blank';
        document.body.appendChild(a); a.click(); a.remove(); say(rvMsg, '');
      }).catch(function () { say(rvMsg, 'Couldn\u2019t open the document. Please try again.'); }).then(function () { btn.disabled = false; });
    };
    var rvOpenState = {};   // which groups / cards are open (kept across reloads); all closed by default (Alex, 2026-11-26)
    var rvDetails = function (key, cls) { var d = document.createElement('details'); d.className = cls; d.open = !!rvOpenState[key]; d.addEventListener('toggle', function () { rvOpenState[key] = d.open; }); return d; };
    var RV_GROUPS = [['board', 'For the Board tab (trustees)'], ['approvals', 'For the Approvals tab (officers)'], ['', 'Download only']];
    var loadReview = function () {
      if (!rvList) return;
      post({ form: 'admin_review_list', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        rvList.innerHTML = '';
        if (!res.ok) { say(rvMsg, res.error); return; }
        if (!res.docs.length) { var n0 = document.createElement('p'); n0.className = 'note'; n0.textContent = 'Nothing pushed for review yet.'; rvList.appendChild(n0); return; }
        RV_GROUPS.forEach(function (g) {
          var docs = res.docs.filter(function (d) { return d.target === g[0]; }); if (!docs.length) return;
          var gbox = rvDetails('g:' + g[0], 'review-groupbox'), gh = document.createElement('summary'); gh.className = 'review-group'; gh.textContent = g[1] + ' (' + docs.length + ')'; gbox.appendChild(gh); rvList.appendChild(gbox);
          docs.forEach(function (d) {
            var card = rvDetails('d:' + (d.key || d.id), 'doc-card-o doc-body review-card'), sm = document.createElement('summary'); sm.className = 'review-sum';
            var h = document.createElement('b'); h.className = 'doc-title'; h.textContent = (d.docno ? d.docno + ' \u00b7 ' : '') + d.title; sm.appendChild(h); card.appendChild(sm);
            var badge = document.createElement('span'), st = { Approve: ['\u2713 Approved', 'ok'], Deny: ['Denied', 'no'], Revise: ['Revise', 'warn'] }[d.decision] || ['Waiting for review', 'wait'];
            badge.className = 'review-badge review-' + st[1]; badge.textContent = st[0]; sm.appendChild(badge);
            var mt = document.createElement('p'); mt.className = 'trustee-meta';
            mt.textContent = (/^\d+\.\d/.test(d.version) ? 'Version ' + d.version : 'Built ' + d.version) + ' \u00b7 pushed ' + d.pushed + (d.target ? ' \u00b7 ' + (d.replaces ? 'replaces the live file' : 'new document') : '');
            card.appendChild(mt);
            if (d.decision) { var dn = document.createElement('p'); dn.className = 'trustee-meta'; dn.textContent = st[0] + ' by ' + d.by + ' on ' + d.at + (d.note ? ': \u201c' + d.note + '\u201d' : ''); card.appendChild(dn); }
            var acts = document.createElement('div'); acts.className = 'officer-actions';
            var note = document.createElement('textarea'); note.className = 'review-note'; note.rows = 2; note.placeholder = 'Note (needed for Deny or Revise)'; note.setAttribute('aria-label', 'Note for ' + d.title);
            [['View', 'btn-outline'], ['Download', 'btn-outline'], ['Approve', 'btn-primary'], ['Deny', 'btn-outline'], ['Revise', 'btn-outline']].forEach(function (b) {
              var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'btn btn-sm ' + b[1]; bt.textContent = b[0];
              bt.addEventListener('click', function () {
                if (b[0] === 'View' || b[0] === 'Download') return rvOpen(d, bt, b[0] === 'Download');
                if (b[0] !== 'Approve' && !note.value.trim()) { note.focus(); return say(rvMsg, 'Please add a note saying why or what to change.'); }
                bt.disabled = true; say(rvMsg, (b[0] === 'Approve' && d.target ? 'Approving and publishing ' : 'Saving ') + d.title + '\u2026', true);
                post({ form: 'admin_review_decide', token: tok(), id: d.id, decision: b[0], note: note.value }).then(function (r) {
                  if (r.signedOut) return signOut(r.error);
                  if (!r.ok) return say(rvMsg, r.error);
                  say(rvMsg, d.title + ': ' + r.message, true); loadReview();
                }).catch(function () { say(rvMsg, 'Couldn\u2019t save. Please try again.'); }).then(function () { bt.disabled = false; });
              });
              acts.appendChild(bt);
            });
            card.appendChild(note); card.appendChild(acts); gbox.appendChild(card);
          });
        });
      }).catch(function () { say(rvMsg, 'Couldn\u2019t load the documents. Please try again.'); });
    };
    // spec §83: trustee emails: View email (exactly as sent) and Send email (typed SEND confirmation)
    var tdList = document.getElementById('tdoc-list'), tdMsg = document.getElementById('tdoc-msg');
    var loadTrusteeEmails = function () {
      if (!tdList) return;
      post({ form: 'admin_trustee_emails', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        tdList.innerHTML = '';
        if (!res.ok) { say(tdMsg, res.error); return; }
        if (!res.emails.length) { var n0 = document.createElement('p'); n0.className = 'note'; n0.textContent = 'No trustee emails yet.'; tdList.appendChild(n0); return; }
        res.emails.forEach(function (em) {
          var card = document.createElement('div'); card.className = 'doc-card-o doc-body tdoc-card';
          var h = document.createElement('b'); h.className = 'doc-title'; h.textContent = em.title + (em.alias ? ' (' + em.alias + ')' : ''); card.appendChild(h);
          var mt = document.createElement('p'); mt.className = 'trustee-meta'; mt.textContent = 'Document No.: ' + em.docno + ' · Version: ' + em.version; card.appendChild(mt);
          var sub = document.createElement('p'); sub.innerHTML = '<b>Email:</b> '; sub.appendChild(document.createTextNode(em.subject)); card.appendChild(sub);
          var st = document.createElement('p'); st.className = 'trustee-meta';
          st.textContent = em.sent.length ? 'Last sent: ' + em.sent[em.sent.length - 1].when + ' by ' + em.sent[em.sent.length - 1].by + (em.sent.length > 1 ? ' (sent ' + em.sent.length + ' times)' : '') : 'Not sent yet.';
          card.appendChild(st);
          var prev = document.createElement('div'); prev.className = 'tdoc-preview'; prev.hidden = true;
          var hd = document.createElement('dl'); hd.className = 'tdoc-head';
          [['From', em.from], ['To', em.to.join(', ')], ['Cc', em.cc.join(', ')], ['Subject', em.subject]].forEach(function (kv) {
            var dt = document.createElement('dt'); dt.textContent = kv[0]; var dd = document.createElement('dd'); dd.textContent = kv[1]; hd.appendChild(dt); hd.appendChild(dd);
          });
          var fr = document.createElement('iframe'); fr.className = 'tdoc-body'; fr.title = 'Email preview'; fr.setAttribute('sandbox', ''); fr.srcdoc = em.html;
          prev.appendChild(hd); prev.appendChild(fr);
          // attachment chip, like an email client: opens the exact PDF that will be attached (spec §83)
          var att = document.createElement('div'); att.className = 'mail-atts';
          if (em.attachment) {
            var chip = document.createElement('button'); chip.type = 'button'; chip.className = 'mail-att';
            chip.innerHTML = '<span class="mail-att-ico" aria-hidden="true">PDF</span><span class="mail-att-name"></span><span class="mail-att-size"></span>';
            chip.querySelector('.mail-att-name').textContent = em.attachment.name; chip.querySelector('.mail-att-size').textContent = em.attachment.size;
            chip.title = 'Open the attachment';
            chip.addEventListener('click', function () {
              chip.disabled = true; say(tdMsg, 'Opening the attachment\u2026', true);
              post({ form: 'officer_trustee_doc', token: tok(), id: em.id }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) return say(tdMsg, r.error);
                var a = document.createElement('a'); a.href = URL.createObjectURL(b64Blob(r.data, r.mime)); a.target = '_blank'; a.rel = 'noopener';
                document.body.appendChild(a); a.click(); a.remove(); say(tdMsg, '');
              }).catch(function () { say(tdMsg, 'Couldn\u2019t open the attachment.'); }).then(function () { chip.disabled = false; });
            });
            var al = document.createElement('p'); al.className = 'mail-att-label'; al.textContent = '1 attachment'; att.appendChild(al); att.appendChild(chip);
          } else { var na = document.createElement('p'); na.className = 'form-msg'; na.textContent = 'No attachment: the document PDF is missing in Trustee documents, so Send will refuse.'; att.appendChild(na); }
          prev.appendChild(att);
          var view = document.createElement('button'); view.type = 'button'; view.className = 'btn btn-sm btn-outline'; view.textContent = 'View email';
          view.addEventListener('click', function () { prev.hidden = !prev.hidden; view.textContent = prev.hidden ? 'View email' : 'Hide email'; });
          var send = document.createElement('button'); send.type = 'button'; send.className = 'btn btn-sm btn-primary'; send.textContent = 'Send email';
          send.addEventListener('click', function () {
            var last = em.sent.length ? '\n\nAlready sent ' + em.sent.length + ' time(s), last on ' + em.sent[em.sent.length - 1].when + '.' : '';
            var c = window.prompt('Send "' + em.subject + '"\nfrom ' + em.from + '\nto ' + em.to.join(', ') + '\ncc ' + em.cc.join(', ') + last + '\n\nType SEND to send it now.');
            if (c === null) return;
            send.disabled = true; say(tdMsg, 'Sending…', true);
            post({ form: 'admin_trustee_email_send', token: tok(), id: em.id, confirm: String(c).trim() }).then(function (r) {
              if (r.signedOut) return signOut(r.error);
              if (!r.ok) return say(tdMsg, r.error);
              say(tdMsg, 'Sent ' + r.sent + '.', true); loadTrusteeEmails();
            }).catch(function () { say(tdMsg, 'Couldn’t send the email. Please try again.'); }).then(function () { send.disabled = false; });
          });
          var acts = document.createElement('p'); acts.className = 'officer-actions'; acts.appendChild(view); acts.appendChild(document.createTextNode(' ')); acts.appendChild(send);
          card.appendChild(acts); card.appendChild(prev); tdList.appendChild(card);
        });
      }).catch(function () { say(tdMsg, 'Couldn’t load the trustee emails.'); });
    };
    var loadSignIns = function () {
      if (!sbody) return;
      post({ form: 'admin_signins', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        sbody.innerHTML = '';
        if (!res.ok || !res.signins.length) { var t0 = document.createElement('tr'); cell(t0, res.ok ? 'No sign-ins recorded yet.' : res.error).colSpan = 3; sbody.appendChild(t0); return; }
        res.signins.forEach(function (s) { var tr = document.createElement('tr'); cell(tr, s.when); cell(tr, s.officer + ' (' + s.email + ')'); var dc = cell(tr, s.device + (s.isNew ? ' · new device' : '')); if (s.isNew) dc.className = 'st-pending'; sbody.appendChild(tr); });
      }).catch(function () {});
    };
    var olistBody = document.getElementById('officer-list');
    var openOff = {};   // officers kept open across refreshes
    var loadOfficers = function () {   // spec §52: current officers
      if (!olistBody) return;
      post({ form: 'officer_list', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        olistBody.innerHTML = '';
        var fassjOffs = [];   // spec §67: FASSJ-group officers are merged into the FASSJ list (one row per person)
        if (!res.ok || !res.officers.length) { var p0 = document.createElement('p'); p0.className = 'note'; p0.textContent = res.ok ? 'No officers yet.' : res.error; olistBody.appendChild(p0); renderFassj([]); return; }
        res.officers.forEach(function (o) {
          // collapsible row: name, sign-in status and areas; opens to email, role and invitation details
          var acc = document.createElement('details'), sum = document.createElement('summary'), sn = document.createElement('span'), sch = document.createElement('span'), sa = document.createElement('span');
          acc.className = 'doc-acc reg-acc off-acc'; acc.open = !!openOff[o.email];
          sn.className = 'doc-title reg-name'; sn.textContent = o.name;
          sch.className = 'vote-result ' + (o.status === 'Active' ? 'r-approved' : 'r-revise'); sch.textContent = o.status;
          sa.className = 'doc-sum'; sa.textContent = areaText(o.roles);
          sum.appendChild(sn); sum.appendChild(sch); sum.appendChild(sa); acc.appendChild(sum);
          var tw = document.createElement('div'), tbl = document.createElement('table'), th = document.createElement('thead'), tb = document.createElement('tbody');
          tw.className = 'roster-wrap reg-body'; tbl.className = 'roster-table officer-table';
          th.innerHTML = '<tr><th scope="col">Email</th><th scope="col">Access</th><th scope="col">Invited</th></tr>';
          tbl.appendChild(th); tbl.appendChild(tb); tw.appendChild(tbl); acc.appendChild(tw);
          acc.addEventListener('toggle', function () { if (acc.open) openOff[o.email] = 1; else delete openOff[o.email]; });
          var tr = document.createElement('tr'); cell(tr, o.email);
          var rc2 = cell(tr, areaText(o.roles));
          if (res.canRemove && !o.owner) {
            var ed = document.createElement('button'); ed.type = 'button'; ed.className = 'link'; ed.textContent = 'Edit';
            ed.addEventListener('click', function () {
              if (rc2.querySelector('.role-chooser')) return;
              var ch = roleChooser(o.roles, o.canInvite), sv = document.createElement('button'); sv.type = 'button'; sv.className = 'btn btn-sm btn-primary'; sv.textContent = 'Save';
              sv.addEventListener('click', function () { var v = ch.values(); sv.disabled = true; post({ form: 'officer_set_role', token: tok(), email: o.email, roles: v.roles, canInvite: v.canInvite }).then(function (r3) { if (r3.signedOut) return signOut(r3.error); if (!r3.ok) { sv.disabled = false; return say(rmsg, r3.error); } say(rmsg, o.name + ': access saved.', true); loadOfficers(); }).catch(function () { sv.disabled = false; }); });
              rc2.appendChild(ch); rc2.appendChild(sv);
            });
            rc2.appendChild(document.createTextNode(' ')); rc2.appendChild(ed);
          }
          var ic = cell(tr, o.invited || 'by System Administrator');
          if (res.canRemove && !o.owner && o.email !== res.me) {
            var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'link'; rm.textContent = 'Remove';
            rm.addEventListener('click', function () {
              if (!window.confirm('Remove ' + o.name + ' (' + o.email + ') as an officer?\n\nTheir sign-in stops working; their past decisions and comments stay.')) return;
              rm.disabled = true;
              post({ form: 'officer_remove', token: tok(), email: o.email }).then(function (r2) { if (r2.signedOut) return signOut(r2.error); if (!r2.ok) { rm.disabled = false; return say(rmsg, r2.error); } loadOfficers(); })
                .catch(function () { rm.disabled = false; });
            });
            ic.appendChild(document.createTextNode(' ')); ic.appendChild(rm);
            var nk = document.createElement('button'); nk.type = 'button'; nk.className = 'link'; nk.textContent = 'New authenticator';   // spec §63
            nk.addEventListener('click', function () {
              if (!window.confirm('Reset ' + o.name + '’s authenticator?\n\nTheir current code stops working at once, they are signed out everywhere, and a new 48-hour setup link is emailed to ' + o.email + '. Use this if their QR code or phone was shared or lost.')) return;
              nk.disabled = true;
              post({ form: 'admin_new_key', token: tok(), email: o.email, site: location.origin }).then(function (r4) { if (r4.signedOut) return signOut(r4.error); if (!r4.ok) { nk.disabled = false; return say(rmsg, r4.error); } say(rmsg, o.name + ': authenticator reset; a new setup link was emailed.', true); loadOfficers(); })
                .catch(function () { nk.disabled = false; });
            });
            ic.appendChild(document.createTextNode(' ')); ic.appendChild(nk);
            var mv = document.createElement('button'); mv.type = 'button'; mv.className = 'link';   // spec §67: move between the two lists
            var to = o.group === 'fassj' ? 'club' : 'fassj'; mv.textContent = to === 'fassj' ? 'Move to interim officers' : 'Move to club officers';
            mv.addEventListener('click', function () {
              if (!window.confirm(mv.textContent + ': ' + o.name + '?')) return;
              mv.disabled = true;
              post({ form: 'officer_set_group', token: tok(), email: o.email, group: to }).then(function (r5) { if (r5.signedOut) return signOut(r5.error); if (!r5.ok) { mv.disabled = false; return say(rmsg, r5.error); } say(rmsg, o.name + ' moved.', true); loadOfficers(); })
                .catch(function () { mv.disabled = false; });
            });
            ic.appendChild(document.createTextNode(' ')); ic.appendChild(mv);
          }
          tb.appendChild(tr);
          if (o.group === 'fassj') fassjOffs.push({ o: o, acc: acc }); else olistBody.appendChild(acc);
        });
        renderFassj(fassjOffs);
      }).catch(function () {});
    };
    // spec §67: one FASSJ list: every FASSJ officer/Board member (from the roster) with their chess-site status;
    // a person with access opens to their email, role and buttons; FASSJ-group officers not on the roster go under "Other".
    var fcomb = document.getElementById('fassj-combined');
    var normName = function (s) { return String(s || '').toLowerCase().replace(/,.*$/, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim(); };
    var renderFassj = function (offs) {
      if (!fcomb) return;
      post({ form: 'officer_fassj_roster', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        fcomb.innerHTML = '';
        if (!res.ok) { var e0 = document.createElement('p'); e0.className = 'note'; e0.textContent = res.error; fcomb.appendChild(e0); return; }
        var used = {}, g = '';
        var head = function (t) { var h = document.createElement('p'); h.className = 'vote-head'; h.textContent = t; fcomb.appendChild(h); };
        res.roster.forEach(function (p) {
          if (p.group !== g) { g = p.group; head(g === 'Board' ? 'Board of Directors' : g === 'Officer' ? 'Officers' : 'Other'); }
          var hit = null; offs.forEach(function (x, i) { if (!hit && !used[i] && normName(x.o.name) === normName(p.name)) { hit = x; used[i] = 1; } });
          if (hit) {
            var sm = hit.acc.querySelector('summary'), ps = document.createElement('span'); ps.className = 'doc-sum off-pos'; ps.textContent = p.position;
            sm.insertBefore(ps, sm.children[1]); fcomb.appendChild(hit.acc);
          } else {
            var row = document.createElement('div'), nm = document.createElement('span'), po = document.createElement('span'), na = document.createElement('span');
            row.className = 'doc-acc reg-acc off-none'; nm.className = 'doc-title reg-name'; nm.textContent = p.name; po.className = 'doc-sum off-pos'; po.textContent = p.position;
            na.className = 'vote-result r-open'; na.textContent = p.status || 'No chess-site access';
            row.appendChild(nm); row.appendChild(po); row.appendChild(na); fcomb.appendChild(row);
          }
        });
        var rest = offs.filter(function (x, i) { return !used[i]; });
        if (rest.length) { head('Other interim officers with access'); rest.forEach(function (x) { fcomb.appendChild(x.acc); }); }
      }).catch(function () {});
    };
    var rbox = document.getElementById('request-review'), rlist = document.getElementById('request-list'), rmsg = document.getElementById('request-msg');
    var loadRequests = function () {
      if (!rbox) return;
      post({ form: 'officer_requests', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        rlist.innerHTML = ''; rbox.classList.toggle('hidden', !(res.ok && res.requests.length));
        (res.requests || []).forEach(function (q) {
          var card = document.createElement('div'), txt = document.createElement('div'), acts = document.createElement('span');
          card.className = 'doc-card-o req-card'; acts.className = 'officer-actions';
          var nm = document.createElement('p'), mt = document.createElement('p'); nm.className = 'req-name'; mt.className = 'req-meta';
          mt.textContent = q.name + ' · ' + q.email + (q.position ? ' · ' + q.position : '') + (q.note ? ' · “' + q.note + '”' : '') + ' · asked ' + q.when;
          var gl = document.createElement('p'); gl.className = 'req-meta req-group-line';   // spec §67
          gl.textContent = 'Goes to: ' + (q.group === 'fassj' ? 'interim officers' : 'club officers') + (q.rosterMatch && q.chose !== 'fassj' ? ' (name matches the interim officers list, so placed there)' : '');
          txt.appendChild(mt); txt.appendChild(gl);
          if (q.already) { var al = document.createElement('p'); al.className = 'req-already'; al.textContent = q.email + ' is already an active officer of the club.'; card.appendChild(txt); card.appendChild(al); rlist.appendChild(card); return; }
          var qch = roleChooser('documents', false);
          [['Send invitation', 'invite', 'btn-primary'], ['Decline', 'decline', 'btn-outline']].forEach(function (b) {
            var x = document.createElement('button'); x.type = 'button'; x.className = 'btn btn-sm ' + b[2]; x.textContent = b[0];
            x.addEventListener('click', function () {
              if (!window.confirm(b[0] + ' for ' + q.name + ' (' + q.email + ')?')) return;
              x.disabled = true;
              var qv = qch ? qch.values() : {};
              post({ form: 'officer_request_decide', token: tok(), id: q.id, decision: b[1], site: location.origin, roles: qv.roles || 'documents', canInvite: qv.canInvite || '', group: q.group || '' }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                if (!res.ok) { x.disabled = false; return say(rmsg, res.error); }
                say(rmsg, q.name + ': ' + (res.status === 'Invited' ? 'invitation sent.' : 'declined.'), true); loadRequests();
              }).catch(function () { x.disabled = false; say(rmsg, 'Couldn’t save. Please try again.'); });
            });
            acts.appendChild(x);
          });
          card.appendChild(txt); card.appendChild(qch); card.appendChild(acts); rlist.appendChild(card);
        });
      }).catch(function () {});
    };
    if (reqForm) {
      var qmsg = document.getElementById('request-form-msg');
      if (location.hash === '#request') { reqForm.scrollIntoView(); var fn = reqForm.querySelector('input[name=name]'); if (fn) fn.focus(); }
      reqForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = reqForm.querySelector('button'); btn.disabled = true; say(qmsg, 'Sending…', true);
        var qdata = Object.fromEntries(new FormData(reqForm)), qmail = String(qdata.email || '').trim();
        post(Object.assign({ form: 'officer_request' }, qdata)).then(function (res) {
          say(qmsg, res.ok ? 'Thank you. An officer will check your request and email you a link to set up your sign-in. Please watch your ' + qmail + ' inbox, and check your spam or junk folder too: the email comes from SJFACC\u2019s Gmail admin account. The link works for 48 hours.' : res.error, res.ok);
          if (res.ok) reqForm.reset();
        }).catch(function () { say(qmsg, 'Couldn’t send. Please try again.'); }).then(function () { btn.disabled = false; });
      });
    }
    var inv = document.getElementById('invite-form'), imsg = document.getElementById('invite-msg');
    var invChooser = null;
    if (inv) { var slot = inv.querySelector('.role-slot'); if (slot) { invChooser = roleChooser('documents', false); slot.appendChild(invChooser); } }
    inv.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = inv.querySelector('button'); btn.disabled = true; say(imsg, 'Sending…', true);
      post(Object.assign({ form: 'officer_invite', token: tok(), name: inv.name.value, email: inv.email.value, site: location.origin }, invChooser ? invChooser.values() : { roles: 'documents' })).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(imsg, res.error);
        say(imsg, 'Invitation sent to ' + inv.email.value + '. The link works for 48 hours.', true); inv.reset();
      }).catch(function () { say(imsg, 'Couldn’t send. Please try again.'); }).then(function () { btn.disabled = false; });
    });
    if (tok()) load();
  }

  // Officer setup page (spec §28.5c): show the invited officer's Google Authenticator QR code, then confirm with one code.
  var smain = document.querySelector('main[data-officer-api]');
  if (smain) {
    var sapi = smain.getAttribute('data-officer-api'), t = new URLSearchParams(location.search).get('t') || '';
    var smsg = document.getElementById('setup-msg'), scard = document.getElementById('setup-card'), serr = document.getElementById('setup-err');
    var spost = function (d) { return fetch(sapi, { method: 'POST', body: new URLSearchParams(d) }).then(function (r) { return r.json(); }); };
    var fail = function (m) { smsg.textContent = m; smsg.classList.add('is-visible'); scard.classList.add('hidden'); };
    if (!t) fail('This page needs the link from your invitation email. Please open the link in that email.');
    else spost({ form: 'officer_setup', t: t }).then(function (res) {
      if (!res.ok) return fail(res.error);
      document.getElementById('setup-name').textContent = res.name;
      document.getElementById('setup-email').textContent = res.email;
      document.getElementById('setup-key').textContent = res.key.replace(/(.{4})/g, '$1 ').trim();
      var q = qrcode(0, 'M'); q.addData(res.uri); q.make();
      document.getElementById('setup-qr').innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
      smsg.classList.add('hidden'); smsg.classList.remove('is-visible'); scard.classList.remove('hidden');
      try { history.replaceState(null, '', location.pathname + '?t=' + t); } catch (e) {}
    }).catch(function () { fail('Couldn’t load your invitation. Please try again in a moment.'); });
    var setupForm = document.getElementById('setup-form');
    if (setupForm) setupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = setupForm.querySelector('button'); btn.disabled = true; serr.textContent = '';
      spost({ form: 'officer_setup_confirm', t: t, code: setupForm.code.value }).then(function (res) {
        if (!res.ok) { serr.textContent = res.error; return; }
        scard.classList.add('hidden'); document.getElementById('setup-qr').innerHTML = '';
        var dn = document.getElementById('setup-done'); dn.classList.remove('hidden'); dn.classList.add('is-visible');
      }).catch(function () { serr.textContent = 'Couldn’t check the code. Please try again.'; }).then(function () { btn.disabled = false; });
    });
  }

  // Register and Partners/Advertise forms go to the club's Google Sheet (no email). A form stays "not open yet"
  // until its address replaces SHEET_URL_PENDING (scripts/set-chess-links.py).
  var sheetForms = document.querySelectorAll('form[data-sheet]');
  for (var sf = 0; sf < sheetForms.length; sf++) {
    sheetForms[sf].addEventListener('submit', function (e) {
      var f = e.currentTarget;
      e.preventDefault();
      var say = function (id, msg) {
        ['form-notice', 'form-done', 'form-error'].forEach(function (n) { var el = f.querySelector('#' + n); if (el) el.classList.remove('is-visible'); });
        var el = f.querySelector('#' + id); if (!el) return; if (msg) el.textContent = msg; el.classList.add('is-visible'); el.focus();
      };
      var url = f.getAttribute('action');
      if (url.indexOf('SHEET_URL_PENDING') !== -1) { say('form-notice'); return; }
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      fetch(url, { method: 'POST', body: new URLSearchParams(new FormData(f)) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) {
            if (f.querySelector('input[name=t]')) { f.classList.add('edit-done'); }
            var pdfA = f.querySelector('#form-pdf'), idS = f.querySelector('#form-done-id');
            if (pdfA && res.pdf) {
              var bin = atob(res.pdf), bytes = new Uint8Array(bin.length);
              for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
              pdfA.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
              pdfA.setAttribute('download', 'SJFACC-membership-form-' + (res.formId || 'signed') + '.pdf');
              pdfA.classList.remove('hidden');
            }
            if (idS) idS.textContent = res.formId ? (res.revision ? 'Registration ' + res.formId + ' is updated (revision ' + res.revision + ').' : 'Your form number is ' + res.formId + '.') : '';
            f.reset();
            var g = document.getElementById('guardian-section');
            if (g && f.contains(g)) { g.classList.add('hidden'); f.querySelectorAll('[data-guardian]').forEach(function (i) { i.required = false; }); }
            if (extraBox && f.contains(extraBox)) { extraBox.classList.add('hidden'); }
            say('form-done');
          } else say('form-error', res.error || 'Something went wrong. Please try again.');
        })
        .catch(function () { say('form-error', 'We couldn\u2019t send this. Please try again, or message us on our Facebook page.'); })
        .then(function () { btn.disabled = false; });
    });
  }


  // Change my registration (docs/player-edit-workflow.md): request page, and edit mode on the Register page (?edit=<code>).
  var ereq = document.getElementById('edit-request');
  if (ereq) {
    var eapi = document.querySelector('main[data-edit-api]').getAttribute('data-edit-api'), emsg2 = document.getElementById('edit-msg');
    ereq.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = ereq.querySelector('button'); btn.disabled = true; emsg2.textContent = 'Sending…'; emsg2.classList.add('ok');
      fetch(eapi, { method: 'POST', body: new URLSearchParams({ form: 'edit_request', email: ereq.email.value, name: ereq.name.value, site: location.origin, 'cf-turnstile-response': window.sjTsToken(ereq) }) })
        .then(function (r) { return r.json(); }).then(function (res) {
          emsg2.classList.toggle('ok', !!res.ok);
          emsg2.textContent = res.ok ? 'We\u2019ve sent a link to ' + (res.sent || ereq.email.value) + '. It works for 15 minutes (check your spam folder too).' : res.error;
          if (res.notFound) { emsg2.appendChild(document.createTextNode(' ')); var ra = document.createElement('a'); ra.href = '/register.html'; ra.textContent = 'Register now \u2192'; emsg2.appendChild(ra); }
        }).catch(function () { emsg2.classList.remove('ok'); emsg2.textContent = 'Couldn’t send. Please try again.'; })
        .then(function () { btn.disabled = false; });
    });
  }
  var editCode = new URLSearchParams(location.search).get('edit');
  if (reg && editCode && /^[0-9a-f]{32}$/.test(editCode)) {
    var title = document.getElementById('form-title'), intro = document.getElementById('form-intro');
    var set = function (name, v) {
      var els = reg.querySelectorAll('[name="' + name + '"]');
      els.forEach(function (el) {
        if (el.type === 'radio') el.checked = el.value === v;
        else if (el.type === 'checkbox') el.checked = name === 'news_by' ? String(v).split(', ').indexOf(el.value) !== -1 : v === 'yes';
        else el.value = v;
        el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    };
    title.textContent = 'Change your registration'; intro.textContent = 'Loading your registration…';
    fetch(reg.getAttribute('action'), { method: 'POST', body: new URLSearchParams({ form: 'edit_load', t: editCode }) })
      .then(function (r) { return r.json(); }).then(function (res) {
        if (!res.ok) { intro.innerHTML = ''; intro.textContent = res.error + ' '; var a = document.createElement('a'); a.href = '/edit.html'; a.textContent = 'Ask for a new link'; intro.appendChild(a); reg.querySelector('.form-grid').classList.add('hidden'); reg.querySelector('.form-actions').classList.add('hidden'); return; }
        title.textContent = 'Change your registration ' + res.formId;
        intro.textContent = 'Change what you need, then tick the agreements and type the name again to sign. This link works for about ' + res.minutesLeft + ' more minutes. After you save, a club officer approves the form again.';
        var d = res.data;
        ['name', 'age_bracket', 'guardian_name', 'guardian_email', 'guardian_phone', 'email', 'phone', 'experience', 'uscf_id', 'medical', 'emergency_name', 'emergency_relationship', 'emergency_phone', 'shirt_size', 'heard_about_us', 'note', 'photos', 'news_by', 'show_on_list'].forEach(function (k) { set(k, d[k] || ''); });
        ['r-em-name', 'r-em-rel', 'r-em-phone'].forEach(function (id) { var x = document.getElementById(id); if (x) { x.dataset.edited = '1'; delete x.dataset.auto; } });
        var ex = document.getElementById('r-extra');
        if (ex) {
          ex.value = d.extra_shirts || '0'; ex.dispatchEvent(new Event('change'));
          if (ex.value === '5 or more') { var m = document.getElementById('r-extra-many'); if (m) m.value = d.extra_sizes || ''; }
          else (d.extra_sizes || '').split('; ').forEach(function (part, i) { var sel = document.getElementById('r-extra-' + (i + 1)); if (sel) sel.value = part.replace(/^Shirt \d+: /, ''); });
        }
        [['form', 'edit_save'], ['t', editCode]].forEach(function (kv) { var h = document.createElement('input'); h.type = 'hidden'; h.name = kv[0]; h.value = kv[1]; reg.appendChild(h); });
        var b = reg.querySelector('button[type=submit]'); if (b) b.textContent = 'Save and sign';
        var dn = document.querySelector('#form-done b'); if (dn) dn.textContent = 'Thank you, your changes are signed and saved!';
      }).catch(function () { intro.textContent = 'Couldn’t load your registration. Please try the link again.'; });
  }

  // Bigger picture in a pop-up: any element with data-lightbox="<image>" (also gallery items added later).
  var box = document.querySelector('dialog.lightbox');
  if (box && box.showModal) {
    var last = null, img = box.querySelector('img'), cap = box.querySelector('.lightbox-caption');
    document.addEventListener('click', function (e) {
      var opener = e.target.closest && e.target.closest('[data-lightbox]');
      if (!opener) return;
      last = opener;
      img.src = opener.getAttribute('data-lightbox');
      img.alt = (opener.querySelector('img') || {}).alt || '';
      cap.textContent = opener.getAttribute('data-caption') || '';
      box.showModal();
    });
    box.querySelector('.lightbox-close').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });   // click outside the picture
    box.addEventListener('close', function () { if (last) last.focus(); });
  }

  // 2028 shirt contest page: gallery + vote, entry form (spec §25). The address comes from <main data-contest-api>.
  var cmain = document.querySelector('main[data-contest-api]');
  if (cmain) {
    var api = cmain.getAttribute('data-contest-api'), pending = api.indexOf('SHEET_URL_PENDING') !== -1;
    var status = document.getElementById('contest-status'), grid = document.getElementById('contest-grid');
    var state = { entriesOpen: false, votingOpen: false, choice: null, choiceTitle: '' };
    var esc = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
    var post = function (data) {
      return fetch(api, { method: 'POST', body: new URLSearchParams(data) }).then(function (r) { return r.json(); });
    };
    var note = function (el, msg, ok) { el.textContent = msg; el.classList.toggle('notice--ok', !!ok); el.classList.add('is-visible'); el.focus(); };
    var showStatus = function () {
      if (pending) { status.innerHTML = 'The contest opens soon. Check back here, or follow our <a href="https://www.facebook.com/profile.php?id=61596920540950" rel="noopener">Facebook page</a>.'; return; }
      status.innerHTML = '<b>Entries:</b> ' + (state.entriesOpen ? 'open' : 'not open yet') + ' &middot; <b>Voting:</b> ' + (state.votingOpen ? 'open' : 'not open yet');
    };
    var castBtn = document.getElementById('v-cast'), codeIn = document.getElementById('v-code');
    var syncCast = function () { castBtn.disabled = !(state.votingOpen && state.choice && /^\d{6}$/.test(codeIn.value.trim())); };
    var render = function (list) {
      if (!list.length) { grid.innerHTML = '<p class="note">No designs in the gallery yet. They appear here once a club officer has checked them.</p>'; return; }
      grid.innerHTML = list.map(function (x) {
        return '<article class="card contest-card">' +
          '<button class="contest-pic" type="button" data-lightbox="' + esc(x.img) + '" data-caption="' + esc(x.title + ' by ' + x.name) + '"><img src="' + esc(x.img) + '" alt="' + esc('T-shirt design: ' + x.title) + '" loading="lazy"></button>' +
          '<h3>' + esc(x.title) + '</h3><p>by ' + esc(x.name) + '</p>' +
          (state.votingOpen ? '<label class="check vote-tick"><input type="radio" name="entry" value="' + esc(x.id) + '" data-title="' + esc(x.title) + '"> Vote for this design</label>' : '') +
          '</article>';
      }).join('');
      grid.querySelectorAll('input[name=entry]').forEach(function (r) {
        r.addEventListener('change', function () {
          state.choice = r.value; state.choiceTitle = r.getAttribute('data-title');
          document.getElementById('vote-choice').innerHTML = 'Your choice: <b>' + esc(state.choiceTitle) + '</b>';
          syncCast();
        });
      });
    };
    var load = function () {
      if (pending) { showStatus(); return; }
      fetch(api + '?action=gallery').then(function (r) { return r.json(); }).then(function (res) {
        state.entriesOpen = !!res.entriesOpen; state.votingOpen = !!res.votingOpen;
        showStatus(); render(res.entries || []);
        document.getElementById('vote-form').classList.toggle('hidden', !state.votingOpen);
      }).catch(function () { status.textContent = 'We couldn\u2019t load the gallery right now. Please try again later.'; });
    };
    load();

    // Entry form
    var ef = document.getElementById('entry-form'), emsg = document.getElementById('entry-msg');
    var eg = document.getElementById('e-guardian'), egIn = ef.querySelectorAll('[data-eg]');
    ef.querySelectorAll('input[name=age_group]').forEach(function (r) { r.addEventListener('change', function () {
      var minor = !!ef.querySelector('#e-minor:checked'); eg.classList.toggle('hidden', !minor); egIn.forEach(function (i) { i.required = minor; });
    }); });
    var fileIn = document.getElementById('e-file'), prev = document.getElementById('e-preview'), dataUrl = '';
    fileIn.addEventListener('change', function () {
      dataUrl = ''; prev.classList.add('hidden');
      var f = fileIn.files[0]; if (!f) return;
      if (!/^image\/(png|jpeg)$/.test(f.type)) { note(emsg, 'Please choose a PNG or JPG image.'); fileIn.value = ''; return; }
      if (f.size > 5 * 1024 * 1024) { note(emsg, 'That image is larger than 5 MB. Please make it smaller.'); fileIn.value = ''; return; }
      var rd = new FileReader(); rd.onload = function () { dataUrl = rd.result; prev.src = dataUrl; prev.classList.remove('hidden'); }; rd.readAsDataURL(f);
    });
    ef.addEventListener('submit', function (e) {
      e.preventDefault();
      if (pending || !state.entriesOpen) { note(emsg, 'Contest entries are not open yet.'); return; }
      if (!ef.checkValidity()) { ef.reportValidity(); return; }
      if (!dataUrl) { note(emsg, 'Please choose your design image.'); return; }
      var btn = ef.querySelector('button[type=submit]'); btn.disabled = true;
      var data = new URLSearchParams(new FormData(ef)); data.set('form', 'entry'); data.set('image', dataUrl); data.set('source', location.hostname);
      fetch(api, { method: 'POST', body: data }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.ok) { ef.reset(); dataUrl = ''; prev.classList.add('hidden'); eg.classList.add('hidden'); note(emsg, 'Thank you! Your design was received. It will appear in the gallery once a club officer has checked it.', true); }
        else note(emsg, res.error || 'Something went wrong. Please try again.');
      }).catch(function () { note(emsg, 'We couldn\u2019t send your design. Please try again.'); }).then(function () { btn.disabled = false; });
    });

    // Vote: email -> code -> cast
    var vf = document.getElementById('vote-form'), vmsg = document.getElementById('vote-msg'), vEmail = document.getElementById('v-email');
    document.getElementById('v-send').addEventListener('click', function () {
      var em = vEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { note(vmsg, 'Please enter the email you registered with.'); return; }
      post({ form: 'code', email: em, source: location.hostname, 'cf-turnstile-response': window.sjTsToken(document.getElementById('vote-form')) }).then(function (res) {
        if (res.ok) { document.getElementById('v-code-field').classList.remove('hidden'); note(vmsg, 'We emailed you a 6-digit code. It works for 15 minutes (check your spam folder too).', true); codeIn.focus(); }
        else note(vmsg, res.error || 'Something went wrong. Please try again.');
      }).catch(function () { note(vmsg, 'We couldn\u2019t send the code. Please try again.'); });
    });
    codeIn.addEventListener('input', syncCast);
    vf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!state.choice) { note(vmsg, 'Please tick a design in the gallery first.'); return; }
      castBtn.disabled = true;
      post({ form: 'vote', email: vEmail.value.trim(), code: codeIn.value.trim(), entry: state.choice, source: location.hostname }).then(function (res) {
        if (res.ok) {
          // Voted (spec §25): keep the thank-you, then reset everything for the next voter (one vote per email is checked by the script).
          var votedFor = state.choiceTitle;
          state.choice = null; state.choiceTitle = '';
          grid.querySelectorAll('input[name=entry]').forEach(function (r) { r.checked = false; r.disabled = false; });
          vEmail.value = ''; codeIn.value = ''; document.getElementById('v-code-field').classList.add('hidden');
          document.getElementById('vote-choice').textContent = 'No design chosen yet.';
          vf.querySelectorAll('input,button').forEach(function (x) { x.disabled = false; });
          syncCast();
          note(vmsg, 'Thank you! Your vote for \u201c' + votedFor + '\u201d is in. Results are announced when voting closes. Another member can vote now.', true);
        }
        else { note(vmsg, res.error || 'Something went wrong. Please try again.'); syncCast(); }
      }).catch(function () { note(vmsg, 'We couldn\u2019t record your vote. Please try again.'); syncCast(); });
    });
  }

  // Partners page tabs (Partners / Donors / Advertise). Without this script all three sections simply show in turn.
  var tabs = document.querySelectorAll('.tab[role=tab]');
  if (tabs.length) {
    var show = function (id, focus) {
      for (var i = 0; i < tabs.length; i++) {
        var on = tabs[i].getAttribute('aria-controls') === id;
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false'); tabs[i].tabIndex = on ? 0 : -1;
        document.getElementById(tabs[i].getAttribute('aria-controls')).hidden = !on;
        if (on && focus) tabs[i].focus();
      }
    };
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function (e) { var id = e.currentTarget.getAttribute('aria-controls'); show(id); history.replaceState(null, '', '#' + id); });
      tabs[t].addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var list = Array.prototype.slice.call(tabs), i = list.indexOf(e.currentTarget);
        var next = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
        show(next.getAttribute('aria-controls'), true);
      });
    }
    var fromHash = function () {   // a #link to something inside a tab (e.g. #tax-notes) opens that tab and scrolls to it (spec §105)
      var id = (location.hash || '').slice(1), el = id && document.getElementById(id);
      if (el && document.getElementById('tab-' + id)) return show(id);
      var panel = el && el.closest ? el.closest('.tab-panel') : null;
      if (panel && document.getElementById('tab-' + panel.id)) { show(panel.id); return setTimeout(function () { el.scrollIntoView(); }, 0); }
      show(tabs[0].getAttribute('aria-controls'));
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  // Founders' Coin: click a picture to turn it over; each picture on its own (Alex, 2026-11-26, spec §107)
  Array.prototype.forEach.call(document.querySelectorAll('.coin-flip-card'), function (c) {
    c.addEventListener('click', function () {
      var back = c.classList.toggle('flipped');
      c.setAttribute('aria-pressed', String(back));
      c.setAttribute('aria-label', c.getAttribute('aria-label').replace(/, (front|back)\. /, ', ' + (back ? 'back' : 'front') + '. '));
    });
  });

  // spec §110: Cloudflare Turnstile ("I'm human" check) on the public forms. Off until TURNSTILE_SITE_KEY is set
  // (Cloudflare dashboard -> Turnstile -> add site sjfacc.org + staging.sjfacc.org); the sheet script checks the token.
  var TURNSTILE_SITE_KEY = '';
  window.sjTsToken = function (form) { var i = form && form.querySelector('[name="cf-turnstile-response"]'); return i ? i.value : ''; };
  if (TURNSTILE_SITE_KEY) {
    var tsForms = ['register-form', 'entry-form', 'request', 'edit-request', 'vote-form'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (tsForms.length) {
      window.sjTsReady = function () {
        tsForms.forEach(function (f) {
          var box = document.createElement('div'), btn = f.querySelector('button[type=submit], .btn-primary');
          box.className = 'ts-box'; if (btn && btn.parentNode) btn.parentNode.insertBefore(box, btn); else f.appendChild(box);
          window.turnstile.render(box, { sitekey: TURNSTILE_SITE_KEY, theme: 'light' });
        });
      };
      var tsjs = document.createElement('script'); tsjs.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=sjTsReady&render=explicit'; tsjs.async = true; document.head.appendChild(tsjs);
    }
  }

  // spec §108: verify a Founders' Coin. The QR on the certificate opens /verify.html?c=<number>.<signature>.
  // The signature is checked here with SJFACC's public key (ECDSA P-256); the registry (owner, status) comes from the sheet script.
  var cmain = document.querySelector('main[data-coin-api]'), cres = document.getElementById('verify-result');
  if (cmain && cres) {
    var b64u = function (t) { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; var b = atob(t), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
    var show = function (ok, title, lines) {
      cres.className = 'verify-result ' + (ok ? 'verify-ok' : 'verify-bad'); cres.innerHTML = '';
      var h = document.createElement('p'); h.className = 'verify-title'; h.textContent = (ok ? '\u2713 ' : '\u2717 ') + title; cres.appendChild(h);
      lines.forEach(function (l) { var p = document.createElement('p'); p.textContent = l; cres.appendChild(p); });
    };
    var c = new URLSearchParams(location.search).get('c') || '', dot = c.lastIndexOf('.');
    var num = dot > 0 ? c.slice(0, dot).toUpperCase() : '', sig = dot > 0 ? c.slice(dot + 1) : '';
    if (c && (!/^FC27-(G?\d{2,})$/.test(num) || !sig)) show(false, 'Not a valid certificate code', ['This QR code was not made by SJFACC.']);
    else if (num) {
      cres.innerHTML = '<p class="note">Checking\u2026</p>';
      if (!window.crypto || !crypto.subtle) { show(false, 'Can\u2019t check on this browser', ['Please open this page in an up-to-date browser.']); }
      else crypto.subtle.importKey('raw', b64u(cmain.getAttribute('data-coin-key')), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
        .then(function (key) { return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64u(sig), new TextEncoder().encode('SJFACC Founders Coin|' + num)); })
        .then(function (good) {
          if (!good) return show(false, 'Not genuine', ['The signature on this certificate is not SJFACC\u2019s. The certificate is a copy or a fake.']);
          return fetch(cmain.getAttribute('data-coin-api'), { method: 'POST', body: new URLSearchParams({ form: 'coin_lookup', number: num }) }).then(function (r) { return r.json(); }).then(function (r) {
            if (!r.ok || !r.found) return show(false, 'Not in the registry', ['No. ' + num + ' has a valid signature but is not in SJFACC\u2019s coin registry. Please contact SJFACC.']);
            if (!r.issued) return show(false, 'Not issued', ['No. ' + r.number + ': ' + r.message]);
            show(true, 'Genuine SJFACC Commemorative Founders\u2019 Coin', ['No. ' + r.number + (r.hologram ? ' \u00b7 hologram ' + r.hologram : ''), 'Registered to ' + r.owner, 'Issued ' + (r.date ? r.date + ' ' : '') + 'at the Inaugural Club Night, South Jersey Filipino-American Chess Community, Inc.']);
          });
        }).catch(function () { show(false, 'Couldn\u2019t check right now', ['Please try again in a moment.']); });
    }
  }

  // Forms send to Formspree in the background and say thank you on the same page.
  // Until a real form ID replaces FORM_ID_PENDING, nothing is sent. Without this script, Formspree's own thank-you page is the fallback.
  var forms = document.querySelectorAll('form[data-formspree]');
  for (var k = 0; k < forms.length; k++) {
    forms[k].addEventListener('submit', function (e) {
      var f = e.currentTarget;
      e.preventDefault();
      var say = function (id, msg) {
        ['form-notice', 'form-done', 'form-error'].forEach(function (n) { var el = f.querySelector('#' + n); if (el) el.classList.remove('is-visible'); });
        var el = f.querySelector('#' + id); if (!el) return; if (msg) el.textContent = msg; el.classList.add('is-visible'); el.focus();
      };
      if (f.getAttribute('action').indexOf('FORM_ID_PENDING') !== -1) { say('form-notice'); return; }
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      fetch(f.getAttribute('action'), { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok) { f.reset(); say('form-done'); }
          else say('form-error', (res.j && res.j.errors && res.j.errors.map(function (x) { return x.message; }).join(' ')) || 'Something went wrong. Please try again.');
        })
        .catch(function () { say('form-error', 'We couldn\u2019t send your message. Please try again, or message us on Facebook.'); })
        .then(function () { btn.disabled = false; });
    });
  }
})();

// spec §65: Print name tags (officers with Registrations): approved members, Avery 5395 layout, extra blank sheets
(function () {
  var main = document.querySelector('main[data-name-tags]'); if (!main) return;
  var api = main.getAttribute('data-approve-api'), box = document.getElementById('nt-sheets'), msg = document.getElementById('nt-msg'), extra = document.getElementById('nt-extra'), tags = [];
  var tok = ''; try { tok = sessionStorage.getItem('fassjOfficer') || ''; } catch (e) {}
  var el = function (tag, cls, text) { var x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };
  var top = function (t, group) { var d = el('div', 'nt-top'), im = document.createElement('img'); im.src = '/assets/logo-512.webp?v=7'; im.alt = ''; d.appendChild(im); d.appendChild(el('span', '', 'SJFACC')); if (group) d.appendChild(el('em', '', group)); t.appendChild(d); };
  var render = function () {
    box.innerHTML = '';
    var items = tags.slice(); while (items.length % 8) items.push(null);
    for (var k = 0; k < Number(extra.value || 0) * 8; k++) items.push(null);
    for (var i = 0; i < items.length; i += 8) {
      var sh = el('section', 'nt-sheet');
      items.slice(i, i + 8).forEach(function (p) {
        var t = el('div', 'nt-tag' + (p ? '' : ' nt-blank'));
        if (p) { top(t, p.group); t.appendChild(el('div', 'nt-first', p.name.split(' ')[0])); t.appendChild(el('div', 'nt-full', p.name)); t.appendChild(el('div', 'nt-foot', 'Founding member \u00b7 Founders\u2019 Cup 2027')); }
        else { top(t, ''); t.appendChild(el('div', 'nt-hello', 'Hello, my name is')); t.appendChild(el('div', 'nt-line')); t.appendChild(el('div', 'nt-foot', 'Inaugural Club Night \u00b7 Founders\u2019 Cup 2027')); }
        sh.appendChild(t);
      });
      box.appendChild(sh);
    }
    msg.textContent = tags.length + ' approved members \u00b7 ' + (items.length - tags.length) + ' blank tags \u00b7 ' + (items.length / 8) + ' sheet(s)';
  };
  extra.addEventListener('change', render);
  var pb = document.getElementById('nt-print');
  pb.addEventListener('click', function () { if (!tags.length && !box.children.length) { msg.textContent = 'Nothing to print yet: sign in on the officers page, then press Print name tags there.'; return; } window.print(); });
  if (!tok) { msg.textContent = 'You\u2019re not signed in on this tab. Go back to the officers page, sign in, then press Print name tags.'; pb.disabled = true; return; }
  fetch(api, { method: 'POST', body: new URLSearchParams({ form: 'officer_name_tags', token: tok }) }).then(function (r) { return r.json(); }).then(function (res) {
    if (!res.ok) { msg.textContent = res.error || 'Couldn\u2019t load the members.'; return; }
    tags = res.tags || []; render();
  }).catch(function () { msg.textContent = 'Couldn\u2019t load the members. Please try again.'; });
})();

