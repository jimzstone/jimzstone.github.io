import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync('index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
for (const [, reference] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  if (reference.startsWith('#')) {
    if (reference.length > 1)
      assert.ok(
        ids.includes(reference.slice(1)),
        `Missing section ${reference}`,
      );
  } else if (!/^(?:[a-z]+:|\/\/)/i.test(reference)) {
    const path = decodeURIComponent(reference.split(/[?#]/)[0]).replace(/^\//, '');
    assert.ok(existsSync(path), `Missing local asset ${path}`);
  }
}
JSON.parse(readFileSync('effects.json', 'utf8'));
console.log(
  'Portfolio IDs, section links, local assets and effect settings passed.',
);

