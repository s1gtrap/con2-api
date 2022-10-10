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

t.test('authentication for "/api/v1/me" route', async t => {
  const response = await t.context.server.inject({
    method: 'GET',
    url: '/api/v1/me',
  });
  t.equal(response.statusCode, 401);
});

t.test('authentication for "/api/v1/me" route', async t => {
  const response = await t.context.server.inject({
    method: 'GET',
    headers: {
      'authorization': '',
    },
    url: '/api/v1/me',
  });
  t.equal(response.statusCode, 401);
});

t.test('authentication for "/api/v1/me" route', async t => {
  const response = await t.context.server.inject({
    method: 'GET',
    headers: {
      'authorization': 'password',
    },
    url: '/api/v1/me',
  });
  t.equal(response.statusCode, 401);
});

t.test('authentication for "/api/v1/me" route', async t => {
  const response = await t.context.server.inject({
    method: 'GET',
    headers: {
      'authorization': 'Bearer ',
    },
    url: '/api/v1/me',
  });
  t.equal(response.statusCode, 401);
});

t.test('authentication for "/api/v1/me" route', async t => {
  const response = await t.context.server.inject({
    method: 'GET',
    headers: {
      'authorization': 'Bearer password',
    },
    url: '/api/v1/me',
  });
  t.equal(response.statusCode, 401);
});

t.test('authentication for "/api/v1/me" route', async t => {
  const response = await t.context.server.inject({
    method: 'GET',
    headers: {
      'authorization': 'Bearer some-super-secret-token',
    },
    url: '/api/v1/me',
  });
  t.equal(response.statusCode, 200);
});

t.test('authentication for "/api/v1/invite" route', async t => {
  const response = await t.context.server.inject({
    method: 'POST',
    url: '/api/v1/invite',
  });
  t.equal(response.statusCode, 401);
});

t.test('authentication for "/api/v1/invite" route', async t => {
  const response = await t.context.server.inject({
    method: 'POST',
    headers: {
      'authorization': 'Bearer some-super-secret-token',
    },
    url: '/api/v1/invite',
  });
  t.equal(response.statusCode, 204);
});

t.test('data returned by "/api/v1/invite" route', async t => {
  const response = await t.context.server.inject({
    method: 'POST',
    headers: {
      'authorization': 'Bearer some-super-secret-token',
    },
    url: '/api/v1/invite',
  });
  t.equal(response.headers['content-type'], 'application/json; charset=utf-8')
  t.match(response.json(), {
    token: /^[\w-]{86}$/,
    createdAt: Number,
  });
});
