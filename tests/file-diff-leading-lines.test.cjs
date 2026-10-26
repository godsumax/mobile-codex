const {test} = require('node:test');
const assert = require('node:assert/strict');
const C = require('../app/src/main/assets/web/ui-core.js');

test('large-file edge trimming preserves leading blank lines and hunk coordinates', () => {
  for (const prefix of ['\n', '\n\n', '\n\n\n', 'first\n\n\n']) {
    const small = C.fileDiff(prefix + 'old\n' + 'tail\n'.repeat(10), prefix + 'new\n' + 'tail\n'.repeat(10));
    const before = prefix + 'old\n' + 'tail\n'.repeat(50001);
    const after = prefix + 'new\n' + 'tail\n'.repeat(50001);
    const diff = C.fileDiff(before, after);
    assert.equal(diff.truncated, false);
    assert.equal(diff.approximate, false);
    assert.deepEqual(diff.hunks, small.hunks, JSON.stringify(prefix));

    const original = before.match(/[^\n]*\n|[^\n]+$/g) || [];
    let cursor = 0, reconstructed = '';
    for (const hunk of diff.hunks) {
      const start = hunk.oldStart - (hunk.oldCount ? 1 : 0);
      reconstructed += original.slice(cursor, start).join('');
      for (const line of hunk.lines) if (line.kind !== '-') reconstructed += line.text + (line.noNewline ? '' : '\n');
      cursor = start + hunk.oldCount;
    }
    reconstructed += original.slice(cursor).join('');
    assert.equal(reconstructed, after);
  }
});
