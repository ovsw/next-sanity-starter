import assert from 'node:assert/strict';
import test from 'node:test';
import { syncRaster } from './sync-raster-descriptions.mjs';

function fixture(raster, assets) {
  const logs = [];
  let commits = 0;
  const env = Object.fromEntries(['SANITY_STUDIO_PROJECT_ID', 'SANITY_STUDIO_DATASET', 'SANITY_AUTH_TOKEN', 'RASTER_API_KEY', 'RASTER_ORG_ID'].map(key => [key, 'test']));
  const clientFactory = () => ({
    fetch: async () => assets,
    transaction() {
      const pending = [];
      return {
        patch(id, configure) {
          const patch = { ifRevisionId(revision) { assert.equal(revision, 'rev'); return patch; }, set(value) { pending.push([id, value]); return patch; } };
          configure(patch);
          return this;
        },
        async commit() { commits++; for (const [id, value] of pending) Object.assign(assets.find(asset => asset._id === id), value); },
      };
    },
  });
  const fetchImpl = async () => ({ ok: true, json: async () => ({ data: raster }) });
  return { run: args => syncRaster({ args: ['--library', 'library', ...args], env, clientFactory, fetchImpl, log: value => logs.push(value) }), logs, commits: () => commits };
}
const asset = (filename, description = '') => ({ _id: filename, _rev: 'rev', originalFilename: filename, description });

test('dry run lists a case-insensitive dotted stem; apply is repeatable and preserves existing text', async () => {
  const assets = [asset('Camp.Day.JPG'), asset('Other.png', 'Hand written')];
  const f = fixture([{ name: 'camp.day', description: ' Children play. ' }, { name: 'other', description: 'Other text' }], assets);
  await f.run([]);
  assert.equal(f.commits(), 0);
  assert.ok(f.logs.some(line => line.includes('Camp.Day.JPG')));
  await f.run(['--apply']);
  assert.equal(assets[0].description, 'Children play.');
  assert.equal(assets[1].description, 'Hand written');
  await f.run(['--apply']);
  assert.equal(f.commits(), 1);
  assert.ok(f.logs.includes('To patch: 0'));
  await f.run(['--apply', '--overwrite']);
  assert.equal(assets[1].description, 'Other text');
});

test('duplicates on either side are listed and never patched, including undescribed duplicates', async () => {
  const f = fixture([
    { name: 'same', description: 'One' }, { name: 'SAME', description: 'One' },
    { name: 'pending', description: 'Ready' }, { name: 'pending' },
    { name: 'two', description: 'Two' },
  ], [asset('same.jpg'), asset('pending.jpg'), asset('two.jpg'), asset('two.png')]);
  await f.run(['--apply']);
  assert.equal(f.commits(), 0);
  for (const name of ['same', 'pending', 'two']) assert.ok(f.logs.some(line => line.includes(name)));
});

test('rejects malformed flags before contacting services', async () => {
  for (const args of [['--library'], ['--library', '--apply'], ['--aply']]) {
    await assert.rejects(syncRaster({ args, env: {} }), /Usage/);
  }
});

test('default library selection reads all asset pages and chooses the latest upload', async () => {
  const calls = [];
  const logs = [];
  const env = Object.fromEntries(['SANITY_STUDIO_PROJECT_ID', 'SANITY_STUDIO_DATASET', 'SANITY_AUTH_TOKEN', 'RASTER_API_KEY', 'RASTER_ORG_ID'].map(key => [key, 'test']));
  await syncRaster({
    args: [], env, log: line => logs.push(line),
    clientFactory: () => ({ fetch: async () => [asset('latest.jpg')] }),
    fetchImpl: async url => {
      calls.push(url);
      const path = new URL(url);
      let data;
      if (path.pathname.endsWith('/libraries')) {
        assert.equal(path.search, '');
        data = [{ id: 'old' }, { id: 'new' }];
      } else if (path.pathname.includes('/old/')) data = [{ name: 'old', created: 1 }];
      else if (path.searchParams.get('page') === '1') data = Array.from({ length: 50 }, (_, i) => ({ name: `image-${i}`, created: 2 }));
      else data = [{ name: 'latest', description: 'Latest image', created: 3 }];
      return { ok: true, json: async () => ({ data }) };
    },
  });
  assert.equal(calls.length, 4);
  assert.ok(logs.some(line => line.includes('Raster library "new"')));
  assert.ok(logs.includes('To patch: 1'));
});
