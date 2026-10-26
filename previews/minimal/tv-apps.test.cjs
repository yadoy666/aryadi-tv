const test = require('node:test');
const assert = require('node:assert/strict');
const apps = require('./tv-apps.js');

test('regional app IDs come from the installed list, including HBO GO, iQIYI and Developer Mode', () => {
  const found = apps.resolve([
    {id: 'regional.hbo.go', title: 'HBO GO'},
    {id: 'com.wbd.stream', title: 'HBO Max'},
    {id: 'regional.iqiyi', title: 'iQIYI'},
    {id: 'lg.developer', title: 'Developer Mode'}
  ]);
  for (const [key, actual] of [['hbogo', 'regional.hbo.go'], ['max', 'com.wbd.stream'], ['iqiyi', 'regional.iqiyi'], ['developer', 'lg.developer']]) {
    assert.equal(found.find(app => app.id === key).launchId, actual);
  }
  assert.equal(found.find(app => app.id === 'netflix').launchId, undefined);
});

test('known IDs work with localized titles and prefer current HBO Max without losing the other installed app', () => {
  const found = apps.resolve([
    {id: 'com.hbo.hbomax', title: 'Max'},
    {id: 'com.wbd.stream', title: 'HBO Max'},
    {id: 'netflix', title: 'Localized Netflix title'}
  ]);
  assert.equal(found.find(app => app.id === 'max').launchId, 'com.wbd.stream');
  assert.equal(found.find(app => app.id === 'tv:com.hbo.hbomax').launchId, 'com.hbo.hbomax');
  assert.equal(found.find(app => app.id === 'netflix').launchId, 'netflix');
});

test('all-apps preserves other installed apps, deduplicates IDs, and excludes self and YouTube Kids', () => {
  const found = apps.resolve([
    {id: 'other.app', title: 'Other App'}, {id: 'other.app', title: 'Duplicate'},
    {id: 'io.aryadi.home', title: 'aryadi'}, {id: 'kids.app', title: 'YouTube Kids'}
  ]);
  assert.equal(found.filter(app => app.launchId === 'other.app').length, 1);
  assert.ok(!found.some(app => app.launchId === 'io.aryadi.home' || app.launchId === 'kids.app'));
});

test('missing apps are never treated as installed and matching is exact', () => {
  const found = apps.resolve([{id: 'unrelated', title: 'Netflix Helper'}]);
  assert.equal(found.find(app => app.id === 'netflix').available, false);
  assert.equal(found.find(app => app.id === 'netflix').launchId, undefined);
  assert.equal(apps.sample().some(app => app.launchId), false);
});
