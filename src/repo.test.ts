import t from 'tap';

import { build } from './server';

t.beforeEach(async t => {
  t.context.server = await build({
    fastify: {
      logger: {
        level: 'info',
        transport: {
          target: 'pino-pretty',
        },
      },
    },
    pg: { database: 'con2_test' },
  });
  await t.context.server.repo.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TEMPORARY TABLE tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id uuid REFERENCES tokens,
  token text UNIQUE NOT NULL,
  created_at timestamp DEFAULT NOW(),
  deleted_at timestamp
);
CREATE TEMPORARY TABLE invites (
  token text PRIMARY KEY,
  created_at timestamp DEFAULT NOW()
);
`);
  await t.context.server.repo.insertToken('some-super-secret-token');
});

t.afterEach(async t => {
  await t.context.server.close();
});

t.test('repository insertToken', async t => {
  const token = await t.context.server.repo.insertToken('saucy-super-secret-stuff');
  t.equal(token.token, 'saucy-super-secret-stuff');
});
