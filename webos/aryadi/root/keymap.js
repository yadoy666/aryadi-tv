'use strict';
var fs = require('fs');
var base = '/var/lib/aryadi-launcher';
var dir = '/home/root/.config/lginputhook';
var file = dir + '/keybinds.json';
var backup = base + '/original-home-key.json';
var command = '/var/lib/aryadi-launcher/home-key.sh';
function update(keys, original, enabled) {
  if (enabled) keys['773'] = {action: 'exec', command: command};
  else if (keys['773'] && keys['773'].command === command) {
    if (original) keys['773'] = original;
    else delete keys['773'];
  }
  return keys;
}
exports.update = update;
if (require.main === module) {
var enabled = process.argv[2] === 'enable';
var keys = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
if (!fs.existsSync(backup)) fs.writeFileSync(backup, JSON.stringify({binding: keys['773'] || null}));
var original = JSON.parse(fs.readFileSync(backup, 'utf8')).binding;
update(keys, original, enabled);
// Same-directory rename triggers inputhook's inotify watcher atomically.
fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(file + '.aryadi-tmp', JSON.stringify(keys));
fs.renameSync(file + '.aryadi-tmp', file);
}
