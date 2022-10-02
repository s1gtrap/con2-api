import { test } from 'tap';

import { build } from './server';

const opts = {
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  },
};

test('requests the "/" route', async t => {
  const app = await build(opts);

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });
  t.equal(response.statusCode, 404, 'returns a status code of 404');
});
