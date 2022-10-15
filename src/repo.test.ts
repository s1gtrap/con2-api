import t from 'tap';

import * as env from './env';
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
  inviter_id uuid REFERENCES tokens,
  created_at timestamp DEFAULT NOW()
);
`);
  await t.context.server.repo.insertToken();
});

t.afterEach(async t => {
  await t.context.server.close();
});

t.test('insertToken', async t => {
  const token = await t.context.server.repo.insertToken();
  t.match(token, {
    id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    inviteId: null,
    token: new RegExp(`[-\\w]{${Math.ceil(env.tokenLen/3*4)}}`),
    createdAt: Number,
  });
});
