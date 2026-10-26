(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var overlay = document.getElementById('overlay');
  var content = document.getElementById('dialog-content');
  var lastFocus, toastTimer, themeTimer, themePanel = false;
  var schedule = window.AryadiSchedule;
  var activeTheme = '';
  var tv = window.TV;
  var onTV = tv && tv.name === 'webos';
  var catalog = window.AryadiApps.sample();
  var appsLoaded = false, appsLoading = false;
  var storageKey = onTV ? 'aryadi.home.preferences' : 'fmtv.minimal.preview';
  var prefs = {version: 3, mode: 'auto', manualUntil: 0, wallpaper: 'blocks', dim: false, favorites: ['netflix', 'youtube', 'prime', 'disney', 'max', 'iqiyi']};
  try {
    var saved = JSON.parse(localStorage.getItem(storageKey));
    // Enable the new daily schedule once; preserve subsequent manual choices until their deadline.
    if (saved && saved.version === 3) {
      if (/^(garden|blocks|senja|slate|warm)$/.test(saved.wallpaper)) prefs.wallpaper = saved.wallpaper;
      if (saved.mode === 'manual') prefs.mode = 'manual';
      if (typeof saved.manualUntil === 'number' && isFinite(saved.manualUntil)) prefs.manualUntil = saved.manualUntil;
    }
    if (saved && typeof saved.dim === 'boolean') prefs.dim = saved.dim;
    if (saved && Array.isArray(saved.favorites)) {
      var allowed = catalog.map(function (app) { return app.id; });
      var unique = [];
      saved.favorites.forEach(function (id) {
        if (id === 'spotify') id = 'iqiyi';
        if (typeof id === 'string' && (allowed.indexOf(id) !== -1 || (onTV && id.indexOf('tv:') === 0)) && unique.indexOf(id) === -1 && unique.length < 6) unique.push(id);
      });
      if (unique.length) prefs.favorites = unique;
    }
  } catch (ignored) {}
  function keepSavedApps() {
    prefs.favorites.forEach(function (id) {
      if (!catalog.some(function (app) { return app.id === id; })) catalog.push({id: id, name: id.slice(3), available: false});
    });
  }
  keepSavedApps();
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(prefs)); } catch (ignored) {} }
  function fit() {
    var scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = stage.style.webkitTransform = 'scale(' + scale + ')';
    stage.style.left = (window.innerWidth - 1920 * scale) / 2 + 'px';
    stage.style.top = (window.innerHeight - 1080 * scale) / 2 + 'px';
  }
  function clock() {
    var now = new Date(), h = now.getHours(), m = now.getMinutes();
    document.getElementById('clock').textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    document.getElementById('clock').setAttribute('datetime', now.toISOString());
    var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    document.getElementById('date').textContent = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()];
    document.getElementById('greeting').textContent = h < 11 ? 'SELAMAT PAGI' : h < 15 ? 'SELAMAT SIANG' : h < 18 ? 'SELAMAT SORE' : 'SELAMAT MALAM';
  }
  function applyWallpaper() {
    var resolved = schedule.resolve(prefs, new Date());
    activeTheme = resolved.theme;
    document.body.className = activeTheme + (prefs.dim ? ' dim' : '');
  }
  function syncTheme() {
    clearTimeout(themeTimer);
    var now = new Date(), resolved = schedule.resolve(prefs, now);
    var expired = prefs.mode === 'manual' && !resolved.manual;
    if (expired) { prefs.mode = 'auto'; prefs.manualUntil = 0; save(); }
    var changed = activeTheme !== resolved.theme;
    applyWallpaper();
    if ((changed || expired) && themePanel && !overlay.hidden) {
      var previous = document.activeElement.getAttribute('data-theme-control');
      wallpaperChoices();
      var controls = content.querySelectorAll('[data-theme-control]');
      for (var i = 0; i < controls.length; i++) {
        if (controls[i].getAttribute('data-theme-control') === previous) { controls[i].focus(); break; }
      }
    }
    // Wake precisely at a boundary; also recheck after clock adjustments or a sleeping browser.
    themeTimer = setTimeout(syncTheme, Math.max(1, Math.min(60000, resolved.until - now.getTime())));
  }
  function toast(message) {
    var target = document.getElementById('toast');
    target.textContent = message;
    target.className = 'visible';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { target.className = ''; }, 3500);
  }
  function findApp(id) {
    return catalog.filter(function (item) { return item.id === id; })[0]
      || {id: id, name: id.slice(3), available: false};
  }
  function launchApp(app) {
    if (!onTV) { toast('Preview: membuka ' + app.name + ' disimulasikan.'); return; }
    if (!appsLoaded) { toast('Daftar aplikasi sedang dimuat. Coba lagi sebentar.'); refreshApps(); return; }
    if (!app.launchId) { toast(app.name + ' belum terdeteksi. Buka Semua aplikasi lalu Muat ulang.'); return; }
    tv.launch(app.launchId, null, function (ok) { if (!ok) toast('Tidak dapat membuka ' + app.name + '. Coba melalui Home LG.'); });
  }
  function refreshApps(done) {
    if (!onTV) { if (done) done(); return; }
    if (appsLoading) { if (done) done(); return; }
    appsLoading = true;
    tv.apps(function (installed) {
      appsLoading = false; appsLoaded = true;
      catalog = window.AryadiApps.resolve(installed || []);
      keepSavedApps();
      var focused = document.activeElement.getAttribute('data-app-id');
      renderApps();
      var buttons = document.getElementById('apps').querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) if (buttons[i].getAttribute('data-app-id') === focused) buttons[i].focus();
      if (done) done();
      else if (!overlay.hidden && document.getElementById('dialog-title').textContent === 'Semua aplikasi') {
        allApps(); content.querySelector('button').focus();
      }
    });
  }
  function labelButton(button, label, mark) {
    button.textContent = label;
    var suffix = document.createElement('span'); suffix.textContent = mark; button.appendChild(suffix);
  }
  function renderApps() {
    var apps = document.getElementById('apps');
    apps.innerHTML = '';
    prefs.favorites.forEach(function (id) {
      var app = findApp(id);
      var button = document.createElement('button');
      button.className = 'app';
      button.setAttribute('aria-label', 'Buka ' + app.name);
      button.setAttribute('data-app-id', id);
      var tile = document.createElement('span'); tile.className = 'tile ' + (id.indexOf('tv:') === 0 ? 'other-app' : id);
      if (app.icon) {
        var icon = document.createElement('img'); icon.alt = ''; icon.src = 'assets/' + app.icon; tile.appendChild(icon);
      } else {
        var word = document.createElement('span'); word.className = 'app-word'; word.textContent = app.word || app.name; tile.appendChild(word);
      }
      var label = document.createElement('span'); label.className = 'app-label'; label.textContent = app.name;
      button.appendChild(tile); button.appendChild(label);
      button.onclick = function () { launchApp(app); };
      apps.appendChild(button);
    });
  }
  function open(title) {
    themePanel = false;
    lastFocus = document.activeElement;
    document.getElementById('dialog-title').textContent = title;
    content.innerHTML = '';
    overlay.hidden = false;
    document.getElementById('close-dialog').focus();
  }
  function close() {
    themePanel = false;
    overlay.hidden = true;
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
    else document.querySelector('.app').focus();
  }
  function wallpaperChoices() {
    themePanel = true;
    var resolved = schedule.resolve(prefs, new Date());
    var until = new Date(resolved.until), untilText = until.getHours() === 7 ? '07.00' : '15.00';
    content.innerHTML = '<div class="schedule-summary"><strong>Setiap hari, sesuai waktu perangkat</strong><div><span>07.00–15.00 · Taman Pagi</span><span>15.00–07.00 · Dunia Blok</span></div></div>';
    var automatic = document.createElement('button');
    automatic.className = 'setting-row automatic-row';
    automatic.setAttribute('data-theme-control', 'auto');
    automatic.setAttribute('aria-pressed', resolved.manual ? 'false' : 'true');
    automatic.innerHTML = 'Jadwal otomatis <span>' + (resolved.manual ? 'Aktifkan kembali' : 'Aktif ✓') + '</span>';
    automatic.onclick = function () {
      prefs.mode = 'auto'; prefs.manualUntil = 0; save(); syncTheme(); wallpaperChoices();
      content.querySelector('.automatic-row').focus();
    };
    content.appendChild(automatic);
    var note = document.createElement('p');
    note.className = 'description theme-note';
    note.textContent = resolved.manual ? 'Pilihan manual aktif sampai ' + untilText + '. Setelah itu kembali ke jadwal.'
      : 'Pilih tema di bawah untuk mengganti sementara, sampai pukul ' + untilText + '.';
    content.appendChild(note);
    [['garden', 'Taman Pagi'], ['blocks', 'Dunia Blok'], ['senja', 'Senja'], ['slate', 'Biru'], ['warm', 'Hangat']].forEach(function (choice) {
      var button = document.createElement('button');
      button.className = 'wall-option' + (activeTheme === choice[0] ? ' selected' : '');
      button.setAttribute('data-theme-control', choice[0]);
      button.setAttribute('aria-pressed', activeTheme === choice[0] ? 'true' : 'false');
      button.innerHTML = '<span class="swatch ' + choice[0] + '"></span><span class="option-label">' + choice[1] + '</span>';
      button.onclick = function () {
        prefs.wallpaper = choice[0]; prefs.mode = 'manual'; prefs.manualUntil = schedule.nextBoundary(new Date()).getTime();
        save(); syncTheme(); wallpaperChoices();
        content.querySelector('.selected').focus();
      };
      content.appendChild(button);
    });
    var dim = document.createElement('button');
    dim.className = 'setting-row';
    dim.setAttribute('data-theme-control', 'dim');
    dim.setAttribute('aria-pressed', prefs.dim ? 'true' : 'false');
    dim.innerHTML = 'Redupkan wallpaper <span>' + (prefs.dim ? 'Aktif' : 'Nonaktif') + '</span>';
    dim.onclick = function () { prefs.dim = !prefs.dim; save(); applyWallpaper(); wallpaperChoices(); content.querySelector('[data-theme-control="dim"]').focus(); };
    content.appendChild(dim);
  }
  function favoriteChoices() {
    themePanel = false;
    content.innerHTML = '<p class="description">Pilih hingga 6 favorit. Aplikasi lain tetap ada di Semua aplikasi.</p>';
    catalog.filter(function (app) { return !onTV || app.available || prefs.favorites.indexOf(app.id) !== -1; }).forEach(function (app, index) {
      var on = prefs.favorites.indexOf(app.id) !== -1;
      var button = document.createElement('button');
      button.className = 'favorite-choice';
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      labelButton(button, app.name, on ? '✓' : '+');
      button.onclick = function () {
        if (on && prefs.favorites.length === 1) { toast('Sisakan setidaknya satu aplikasi favorit.'); return; }
        if (!on && prefs.favorites.length >= 6) { toast('Favorit sudah penuh. Lepas satu pilihan untuk menggantinya.'); return; }
        prefs.favorites = on ? prefs.favorites.filter(function (id) { return id !== app.id; }) : prefs.favorites.concat(app.id);
        save(); renderApps(); favoriteChoices();
        var choices = content.querySelectorAll('.favorite-choice');
        if (choices.length) choices[Math.min(index, choices.length - 1)].focus();
      };
      content.appendChild(button);
    });
  }
  function allApps() {
    content.innerHTML = '';
    var note = document.createElement('p'); note.className = 'description';
    note.textContent = onTV ? 'Aplikasi yang terdeteksi di TV. Jika ada yang belum muncul, izinkan akses daftar aplikasi saat TV meminta, lalu muat ulang.' : 'Daftar contoh untuk preview. Di TV, daftar mengikuti aplikasi yang terpasang dan terdeteksi.';
    content.appendChild(note);
    if (onTV) {
      var reload = document.createElement('button'); reload.className = 'setting-row'; reload.textContent = appsLoading ? 'Memuat aplikasi…' : 'Muat ulang daftar aplikasi';
      reload.disabled = appsLoading;
      reload.onclick = function () {
        reload.textContent = 'Memuat aplikasi…';
        refreshApps(function () { if (!overlay.hidden && document.getElementById('dialog-title').textContent === 'Semua aplikasi') { allApps(); content.querySelector('button').focus(); } });
      };
      content.appendChild(reload);
    }
    catalog.filter(function (app) { return !onTV || app.available; }).forEach(function (app) {
      var button = document.createElement('button');
      button.className = 'favorite-choice';
      button.setAttribute('aria-label', 'Buka ' + app.name);
      labelButton(button, app.name, prefs.favorites.indexOf(app.id) !== -1 ? '★' : '↗');
      button.onclick = function () { launchApp(app); };
      content.appendChild(button);
    });
  }
  document.getElementById('all-apps').onclick = function () { open('Semua aplikasi'); allApps(); };
  document.getElementById('wallpaper-button').onclick = function () { open('Tema keluarga'); wallpaperChoices(); };
  document.getElementById('edit-favorites').onclick = function () { open('Aplikasi favorit'); favoriteChoices(); };
  function openLG(id, name) {
    if (!onTV) { toast('Preview: membuka ' + name + ' disimulasikan.'); return; }
    tv.launch(id, null, function (ok) {
      if (!ok) toast('Tidak dapat membuka ' + name + '. Gunakan menu Home LG atau tombol Pengaturan pada remote.');
    });
  }
  function launcherControl(action, done) {
    if (!onTV || ['status', 'enable', 'disable'].indexOf(action) === -1) { done(null); return; }
    var bridge, finished = false;
    var timer = setTimeout(function () { finish(null); }, 8000);
    function finish(result) {
      if (finished) return;
      finished = true; clearTimeout(timer);
      if (bridge && bridge.cancel) { try { bridge.cancel(); } catch (ignored) {} }
      done(result);
    }
    try {
      bridge = new window.PalmServiceBridge();
      bridge.onservicecallback = function (message) {
        try {
          var reply = JSON.parse(message);
          finish(reply.returnValue ? JSON.parse(reply.stdoutString) : null);
        } catch (ignored) { finish(null); }
      };
      bridge.call('luna://org.webosbrew.hbchannel.service/exec', JSON.stringify({command: '/var/lib/aryadi-launcher/control.sh ' + action}));
    } catch (ignored) { finish(null); }
  }
  function setupLauncherSwitch() {
    var button = document.getElementById('launcher-switch');
    if (!onTV) { button.textContent = 'Beranda utama: aryadi'; button.onclick = function () { toast('Penggantian beranda tersedia pada TV.'); }; return; }
    button.disabled = true;
    launcherControl('status', function (status) {
      if (!document.getElementById('launcher-switch') || document.getElementById('launcher-switch') !== button) return;
      if (!status || typeof status.enabled !== 'boolean') { button.textContent = 'Beranda utama: belum tersedia'; return; }
      button.disabled = false;
      var active = status.enabled && status.running;
      labelButton(button, 'Beranda utama: ' + (active ? 'aryadi' : 'LG'), active ? 'LG Launcher' : 'Aktifkan aryadi');
      button.onclick = function () {
        button.disabled = true;
        launcherControl(active ? 'disable' : 'enable', function (result) {
          if (!result || result.enabled !== !active) { button.disabled = false; toast('Beranda belum berhasil diubah. Coba lagi.'); return; }
          close();
          if (active) openLG('com.webos.app.home', 'Beranda LG');
          else toast('aryadi aktif untuk Home dan saat TV menyala.');
        });
      };
    });
  }
  document.getElementById('settings').onclick = function () {
    open('Pengaturan');
    content.innerHTML = '<button class="setting-row" id="choose-wallpaper">Tema keluarga <span>›</span></button><button class="setting-row" id="choose-favorites">Aplikasi favorit <span>›</span></button><button class="setting-row" id="lg-settings">Pengaturan TV <span>›</span></button><button class="setting-row" id="lg-store">LG Content Store <span>›</span></button><button class="setting-row" id="launcher-switch">Memeriksa beranda utama…</button>';
    document.getElementById('lg-settings').onclick = function () { openLG('com.palm.app.settings', 'Pengaturan TV'); };
    document.getElementById('lg-store').onclick = function () { openLG('com.webos.app.discovery', 'LG Content Store'); };
    document.getElementById('choose-wallpaper').onclick = function () { document.getElementById('dialog-title').textContent = 'Tema keluarga'; wallpaperChoices(); content.querySelector('button').focus(); };
    document.getElementById('choose-favorites').onclick = function () { document.getElementById('dialog-title').textContent = 'Aplikasi favorit'; favoriteChoices(); content.querySelector('button').focus(); };
    setupLauncherSwitch();
  };
  document.getElementById('inputs').onclick = function () {
    open('Sumber input');
    function showInputs(list) {
      if (overlay.hidden || document.getElementById('dialog-title').textContent !== 'Sumber input') return;
      content.innerHTML = '';
      list.forEach(function (input) {
        var name = input.label || 'Live TV';
        var button = document.createElement('button'); button.className = 'setting-row'; button.textContent = name;
        button.onclick = function () {
          if (!onTV) { close(); toast('Preview: ' + name + ' dipilih.'); return; }
          tv.launch(input.id, null, function (ok) { if (ok) close(); else toast('Tidak dapat membuka ' + name + '. Gunakan tombol Input pada remote.'); });
        };
        content.appendChild(button);
      });
    }
    if (onTV) tv.inputs(showInputs);
    else showInputs([{label: 'Live TV'}, {label: 'HDMI 1'}, {label: 'HDMI 2'}]);
  };
  document.getElementById('close-dialog').onclick = close;
  overlay.onclick = function (event) { if (event.target === overlay) close(); };
  function visibleButtons() {
    return Array.prototype.slice.call((overlay.hidden ? stage : overlay).querySelectorAll('button')).filter(function (button) { return button.offsetWidth > 0 && !button.disabled; });
  }
  document.addEventListener('keydown', function (event) {
    var code = event.keyCode;
    if (code === 27 || code === 461 || code === 8) { event.preventDefault(); if (!overlay.hidden) close(); else if (onTV) tv.back(); return; }
    var buttons = visibleButtons(), focused = document.activeElement, index = buttons.indexOf(focused);
    if (code === 9 && !overlay.hidden) {
      event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus(); return;
    }
    if (code < 37 || code > 40) return;
    event.preventDefault();
    if (index === -1) { buttons[0].focus(); return; }
    var a = focused.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    var best = null, score = Infinity;
    buttons.forEach(function (button) {
      if (button === focused) return;
      var b = button.getBoundingClientRect(), dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay;
      var forward = code === 37 ? -dx : code === 39 ? dx : code === 38 ? -dy : dy;
      var cross = code === 37 || code === 39 ? Math.abs(dy) : Math.abs(dx);
      if (forward < 1 || cross > forward * 2) return;
      var cost = forward + cross * 3;
      if (cost < score) { score = cost; best = button; }
    });
    if (best) best.focus();
  });
  // webOS presents the existing window immediately (handlesRelaunch=false).
  // Refresh the app list after that first frame, not in the relaunch event.
  document.addEventListener('webOSRelaunch', function () {
    clock(); syncTheme(); setTimeout(refreshApps, 250);
  }, true);
  window.addEventListener('resize', fit);
  window.addEventListener('focus', function () { clock(); syncTheme(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { clock(); syncTheme(); } });
  if (onTV) document.querySelector('.dialog-foot').innerHTML = 'Pilihan disimpan di TV ini. <span>Back untuk kembali</span>';
  save(); syncTheme(); fit(); clock(); renderApps();
  refreshApps();
  document.querySelector('.app').focus();
  setInterval(clock, 10000);
})();
