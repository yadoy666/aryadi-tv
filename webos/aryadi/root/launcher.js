/* Rooted webOS Home/wake helper. No system binaries or LG applications are changed. */
'use strict';
var fs = require('fs');
var cp = require('child_process');
var BASE = '/var/lib/aryadi-launcher';
var APP = 'io.aryadi.home';

function policy(open, fail, now, enteredHome) {
  var power = null, foreground = '', launches = [], last = 0;
  return {
    front: function (id) {
      var changed = foreground !== id;
      foreground = id;
      if (changed && id === APP && enteredHome) enteredHome();
      if (id === 'com.webos.app.home' && power === 'Active') this.launch('home');
    },
    power: function (state) {
      var wake = power !== null && power !== 'Active' && state === 'Active';
      power = state;
      return wake;
    },
    launch: function (reason) {
      var time = now();
      if (power !== 'Active' || (last && time - last < 1000)) return;
      if (reason === 'retry' && foreground !== 'com.webos.app.home') return;
      launches = launches.filter(function (t) { return time - t < 20000; });
      if (launches.length >= 6) { fail(); return; }
      launches.push(time); last = time; open(reason);
    }
  };
}
exports.policy = policy;

// Start on the first Active report. Repeated power reports must not reopen Home
// over an app the user has already selected.
function activationReason() {
  var initial = true;
  return function (state, wake) {
    if (state !== 'Active') return null;
    if (initial) { initial = false; return 'startup'; }
    return wake ? 'wake' : null;
  };
}
exports.activationReason = activationReason;

if (require.main === module) {
  var children = [], timers = [], quitting = false;
  var enabled = function () { return fs.existsSync(BASE + '/enabled'); };
  var log = function (s) {
    var file = '/tmp/aryadi-launcher.log';
    try {
      if (fs.existsSync(file) && fs.statSync(file).size > 262144) fs.renameSync(file, file + '.previous');
      fs.appendFileSync(file, new Date().toISOString() + ' ' + s + '\n');
    } catch (ignored) {}
  };
  function stop() {
    if (quitting) return;
    quitting = true;
    timers.forEach(clearTimeout);
    children.forEach(function (p) { try { p.kill(); } catch (ignored) {} });
    try { fs.unlinkSync('/tmp/aryadi-launcher.pid'); } catch (ignored) {}
    process.exit(0);
  }
  function later(fn, delay) {
    var timer = setTimeout(function () {
      timers.splice(timers.indexOf(timer), 1);
      if (!enabled()) return stop();
      fn();
    }, delay);
    timers.push(timer);
  }
  var state = policy(function (reason) {
    if (!enabled()) return stop();
    if (!fs.existsSync('/media/developer/apps/usr/palm/applications/' + APP + '/appinfo.json')) return stop();
    log('open aryadi: ' + reason);
    cp.execFile('/usr/bin/luna-send', ['-n', '1', '-w', '5000',
      'luna://com.webos.applicationManager/launch', JSON.stringify({id: APP})],
      {timeout: 6000}, function (err) { if (err) log('launch failed: ' + err.message); });
    if (reason !== 'retry') later(function () { state.launch('retry'); }, 3000);
  }, function () {
    log('Repeated Home redirects: disabled helper to leave LG Home available');
    try { fs.unlinkSync(BASE + '/enabled'); } catch (ignored) {}
    stop();
  }, Date.now, function () {
    // LG can leave the tuner audible behind a web app after wake. Close just its
    // playback session when Aryadi is visible; never alter global mute/volume.
    if (!enabled()) return;
    log('close background Live TV');
    cp.execFile('/usr/bin/luna-send', ['-n', '1', '-w', '5000',
      'luna://com.webos.applicationManager/closeByAppId',
      '{"id":"com.webos.app.livetv"}'], {timeout: 6000}, function (err) {
        if (err) log('Live TV close failed: ' + err.message);
      });
  });
  function subscribe(uri, receive) {
    if (quitting || !enabled()) return;
    var child = cp.spawn('/usr/bin/luna-send', ['-i', uri, '{"subscribe":true}']);
    var buffer = '';
    children.push(child);
    child.stdout.on('data', function (chunk) {
      buffer += chunk.toString();
      var index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        var line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
        try { receive(JSON.parse(line)); } catch (ignored) {}
      }
      if (buffer.length > 65536) buffer = '';
    });
    child.stderr.on('data', function (data) { log('subscription: ' + data.toString().trim()); });
    child.on('error', function (err) { log(err.message); });
    child.on('close', function (code) {
      log('subscription ended ' + uri + ' code=' + code);
      children.splice(children.indexOf(child), 1);
      if (!quitting) later(function () { subscribe(uri, receive); }, 3000);
    });
  }
  if (!enabled()) process.exit(0);
  fs.writeFileSync('/tmp/aryadi-launcher.pid', String(process.pid));
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
  log('helper started');
  var activation = activationReason();
  subscribe('luna://com.webos.service.tvpower/power/getPowerState', function (reply) {
    if (!reply.state) return;
    log('power ' + reply.state);
    var reason = activation(reply.state, state.power(reply.state));
    if (reason) state.launch(reason);
  });
  subscribe('luna://com.webos.applicationManager/getForegroundAppInfo', function (reply) {
    if (typeof reply.appId !== 'string') return;
    log('foreground ' + reply.appId);
    state.front(reply.appId);
  });
}
