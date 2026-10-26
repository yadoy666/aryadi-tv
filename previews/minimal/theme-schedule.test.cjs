const { test } = require('node:test');
const assert = require('node:assert/strict');
const schedule = require('./theme-schedule.js');

function at(hours, minutes = 0, seconds = 0, milliseconds = 0) {
  return new Date(2026, 9, 25, hours, minutes, seconds, milliseconds);
}

test('daily theme changes at exactly 07:00 and 15:00 local time', () => {
  for (const [date, expected] of [
    [at(0), 'blocks'], [at(6, 59, 59, 999), 'blocks'], [at(7), 'garden'],
    [at(14, 59, 59, 999), 'garden'], [at(15), 'blocks'], [at(23, 59), 'blocks']
  ]) assert.equal(schedule.themeAt(date), expected);
});

test('next boundary uses local calendar time and advances to tomorrow after 15:00', () => {
  assert.equal(+schedule.nextBoundary(at(6)), +at(7));
  assert.equal(+schedule.nextBoundary(at(7)), +at(15));
  const tomorrow = new Date(2026, 9, 26, 7);
  assert.equal(+schedule.nextBoundary(at(15)), +tomorrow);
  assert.equal(+schedule.nextBoundary(at(23, 59)), +tomorrow);
});

test('manual theme survives reload-shaped state and expires exactly at both boundaries', () => {
  for (const [selectedAt, deadline, manualTheme, scheduledTheme] of [
    [at(6), at(7), 'senja', 'garden'], [at(10), at(15), 'garden', 'blocks']
  ]) {
    const prefs = JSON.parse(JSON.stringify({mode: 'manual', wallpaper: manualTheme,
      manualUntil: +schedule.nextBoundary(selectedAt)}));
    assert.deepEqual(schedule.resolve(prefs, new Date(+deadline - 1)),
      {theme: manualTheme, manual: true, until: +deadline});
    const result = schedule.resolve(prefs, deadline);
    assert.equal(result.theme, scheduledTheme);
    assert.equal(result.manual, false);
  }
});

test('reopening after sleep discards an expired manual selection', () => {
  const prefs = {mode: 'manual', wallpaper: 'warm', manualUntil: +at(15)};
  assert.equal(schedule.resolve(prefs, new Date(2026, 9, 26, 9)).theme, 'garden');
  assert.equal(schedule.resolve(prefs, new Date(2026, 9, 26, 9)).manual, false);
});

test('automatic mode ignores old selection and invalid saved data falls back to schedule', () => {
  for (const prefs of [
    {mode: 'auto', wallpaper: 'blocks', manualUntil: +at(15)},
    {mode: 'manual', wallpaper: 'missing', manualUntil: +at(15)},
    {mode: 'manual', wallpaper: 'blocks', manualUntil: 'later'},
    {mode: 'manual', wallpaper: 'blocks', manualUntil: Infinity}
  ]) assert.equal(schedule.resolve(prefs, at(10)).theme, 'garden');
});
