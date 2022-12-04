import t from 'tap';

import * as utils from './utils';

t.test('genToken resolves when randomBytes calls back ok', async t => {
  for (let i = 0; i < 100; i++) {
    t.match(await utils.genToken(), /^[-\w]{43}$/);
  }
});

t.test('genToken resolves when randomBytes calls back ok', async t => {
  const utils = t.mock('./utils', {
    'crypto': {
      randomBytes: (size: number, callback: (err: Error | null, buf: Buffer) => void) => callback(null, Buffer.from([13, 12])),
    },
  });
  await t.resolves(utils.genToken());
});

t.test('genToken rejects on randomBytes calls back with error', async t => {
  const utils = t.mock('./utils', {
    'crypto': {
      randomBytes: (size: number, callback: (err: Error | null, buf: Buffer) => void) => callback(new Error(), Buffer.from([])),
    },
  });
  await t.rejects(utils.genToken());
});

t.test('parseDataUrl accepts browser image blob', async t => {
  const [mime, data] = utils.parseDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII');
  t.equal(mime, 'image/png');
  t.equal(data.toString('base64'), 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII=');
});

t.test('parseDataUrl rejects invalid urls', async t => {
  t.throws(() => utils.parseDataUrl(''));
  t.throws(() => utils.parseDataUrl('data:'));
});