const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('./launcher.js').policy;
const activationReason = require('./launcher.js').activationReason;
const updateKeys = require('./keymap.js').update;
function setup() {
  let time = 100000, opens = [], failed = 0;
  const p = policy(r => opens.push(r), () => failed++, () => time);
  return {p, opens, advance: n => {time += n;}, failed: () => failed};
}
test('Home redirects only while TV is active; other apps and settings stay open', () => {
  const s = setup(); s.p.front('com.webos.app.home'); assert.equal(s.opens.length, 0);
  s.p.power('Active');
  ['netflix', 'com.palm.app.settings', 'com.webos.app.discovery', 'com.webos.app.hdmi1'].forEach(id => s.p.front(id));
  assert.equal(s.opens.length, 0);
  s.p.front('com.webos.app.home'); assert.deepEqual(s.opens, ['home']);
  s.p.power('Suspend'); s.advance(5000); s.p.front('com.webos.app.home'); assert.equal(s.opens.length, 1);
});
test('wake detected only after inactive-to-active, not subscription initial/repeat', () => {
  const s = setup(); assert.equal(s.p.power('Active'), false);
  assert.equal(s.p.power('Active'), false); s.p.power('Screen Off');
  assert.equal(s.p.power('Active'), true);
});
test('startup waits for Active without a fixed delay and repeated reports leave apps alone', () => {
  const reason = activationReason();
  assert.equal(reason('Suspend',false),null);
  assert.equal(reason('Active',true),'startup');
  assert.equal(reason('Active',false),null);
  assert.equal(reason('Suspend',false),null);
  assert.equal(reason('Active',true),'wake');
  assert.equal(reason('Active',false),null);
});
test('delayed retry cannot steal focus from a streaming app', () => {
  const s = setup(); s.p.power('Active'); s.p.front('com.webos.app.home');
  s.p.front('netflix'); s.advance(4000); s.p.launch('retry'); assert.equal(s.opens.length, 1);
});
test('repeated redirects trip the fallback, and ordinary separated visits do not', () => {
  const s = setup(); s.p.power('Active');
  for (let i = 0; i < 7; i++) { s.p.front('com.webos.app.home'); s.advance(2000); }
  assert.equal(s.failed(), 1); assert.equal(s.opens.length, 6);
  const t = setup(); t.p.power('Active');
  for (let i = 0; i < 20; i++) { t.p.front('com.webos.app.home'); t.advance(21000); }
  assert.equal(t.failed(), 0);
});
test('Home remap leaves all other buttons intact and rollback restores original mapping', () => {
  const oldHome = {action:'replace',keycode:1};
  const keys = {'773':oldHome,'115':{action:'pass'}};
  updateKeys(keys,oldHome,true);
  assert.equal(keys['773'].action,'exec'); assert.deepEqual(keys['115'],{action:'pass'});
  updateKeys(keys,oldHome,false); assert.deepEqual(keys['773'],oldHome);
  const fresh = {}; updateKeys(fresh,null,true); updateKeys(fresh,null,false); assert.deepEqual(fresh,{});
});
test('rollback does not overwrite a newer user-provided Home mapping', () => {
  const keys = {'773':{action:'launch',id:'another.app'}};
  updateKeys(keys,null,false); assert.deepEqual(keys['773'],{action:'launch',id:'another.app'});
});
test('background tuner closes only when entering Aryadi, never when choosing Live TV or another app', () => {
  let closed = 0;
  const p = policy(() => {}, () => {}, Date.now, () => closed++);
  p.power('Active'); p.front('com.webos.app.livetv'); assert.equal(closed,0);
  p.front('io.aryadi.home'); p.front('io.aryadi.home'); assert.equal(closed,1);
  p.front('youtube.leanback.v4'); p.front('com.palm.app.settings'); assert.equal(closed,1);
  p.front('com.webos.app.livetv'); assert.equal(closed,1);
  p.front('io.aryadi.home'); assert.equal(closed,2);
});
