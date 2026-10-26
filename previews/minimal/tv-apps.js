(function (root) {
  'use strict';
  var base = [
    {id: 'netflix', name: 'Netflix', icon: 'netflix.svg', ids: ['netflix']},
    {id: 'youtube', name: 'YouTube', icon: 'youtube.png', ids: ['youtube.leanback.v4']},
    {id: 'prime', name: 'Prime Video', icon: 'prime.png', ids: ['amazon'], names: ['amazonprimevideo', 'amazonvideo']},
    {id: 'disney', name: 'Disney+', ids: ['com.disney.disneyplus-prod'], names: ['disneyhotstar', 'disneyplushotstar']},
    {id: 'max', name: 'HBO MAX', icon: 'max.svg', ids: ['com.wbd.stream', 'com.hbo.hbomax'], names: ['max']},
    {id: 'hbogo', name: 'HBO GO', word: 'HBO GO'},
    {id: 'iqiyi', name: 'iQIYI', word: 'iQIYI'},
    {id: 'appletv', name: 'Apple TV', word: 'Apple TV', ids: ['com.apple.appletv']},
    {id: 'developer', name: 'Developer Mode', word: 'DEV'}
  ];
  function normalize(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function sample() {
    return base.map(function (app) {
      return {id: app.id, name: app.name, icon: app.icon, word: app.word};
    });
  }
  function resolve(installed) {
    var apps = sample(), used = {};
    base.forEach(function (app, index) {
      var match = null;
      // Prefer a known ID, but only if the TV actually reported that installation.
      (app.ids || []).some(function (id) {
        return installed.some(function (item) { if (item.id === id) { match = item; return true; } return false; });
      });
      if (!match) installed.some(function (item) {
        var name = normalize(item.title);
        if (name === normalize(app.name) || (app.names || []).indexOf(name) !== -1) { match = item; return true; }
        return false;
      });
      apps[index].available = !!match;
      if (match) { apps[index].launchId = match.id; used[match.id] = true; }
    });
    installed.forEach(function (item) {
      if (!item.id || used[item.id] || item.id === 'io.aryadi.home' || normalize(item.title) === 'youtubekids') return;
      used[item.id] = true;
      apps.push({id: 'tv:' + item.id, name: item.title || item.id, launchId: item.id, available: true});
    });
    return apps;
  }
  var api = {sample: sample, resolve: resolve};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AryadiApps = api;
})(this);
