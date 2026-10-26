(function (root) {
  'use strict';
  var themes = ['garden', 'blocks', 'senja', 'slate', 'warm'];

  function themeAt(now) {
    return now.getHours() >= 7 && now.getHours() < 15 ? 'garden' : 'blocks';
  }

  function nextBoundary(now) {
    var next = new Date(now.getTime());
    if (now.getHours() < 7) next.setHours(7, 0, 0, 0);
    else if (now.getHours() < 15) next.setHours(15, 0, 0, 0);
    else {
      next.setDate(next.getDate() + 1);
      next.setHours(7, 0, 0, 0);
    }
    return next;
  }

  function resolve(prefs, now) {
    var manual = prefs.mode === 'manual' && themes.indexOf(prefs.wallpaper) !== -1
      && typeof prefs.manualUntil === 'number' && isFinite(prefs.manualUntil)
      && now.getTime() < prefs.manualUntil;
    return {theme: manual ? prefs.wallpaper : themeAt(now), manual: manual,
      until: manual ? prefs.manualUntil : nextBoundary(now).getTime()};
  }

  var api = {themeAt: themeAt, nextBoundary: nextBoundary, resolve: resolve};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AryadiSchedule = api;
})(this);
