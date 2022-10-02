import { test } from 'tap';

import { build } from './server';

test('requests the "/" route', async t => {
  const app = build({
      logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
      },
    },
  });

  const response = await app.inject({
    method: 'GET',
    url: '/'
  });
  t.equal(response.statusCode, 404, 'returns a status code of 404');
});
