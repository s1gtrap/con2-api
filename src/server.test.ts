import t from 'tap';

import { build } from './server';

t.test('GET "/api/v1/me" route', async t => {
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
    const token = await t.context.server.repo.insertToken();
    t.context.token = token.token;
  });
  t.afterEach(async t => {
    await t.context.server.close();
  });

  t.test('requires authorization header', async t => {
    const response = await t.context.server.inject({
      method: 'GET',
      url: '/api/v1/me',
    });
    t.equal(response.statusCode, 401);
  });
  t.test('required non-empty authorization header', async t => {
    const response = await t.context.server.inject({
      method: 'GET',
      headers: {
        'authorization': '',
      },
      url: '/api/v1/me',
    });
    t.equal(response.statusCode, 401);
  });
  t.test('requires bearer authorization header', async t => {
    const response = await t.context.server.inject({
      method: 'GET',
      headers: {
        'authorization': 'password',
      },
      url: '/api/v1/me',
    });
    t.equal(response.statusCode, 401);
  });
  t.test('requires well-formed bearer authorization header', async t => {
    const response = await t.context.server.inject({
      method: 'GET',
      headers: {
        'authorization': 'Bearer ',
      },
      url: '/api/v1/me',
    });
    t.equal(response.statusCode, 401);
  });
  t.test('requires valid bearer token', async t => {
    const response = await t.context.server.inject({
      method: 'GET',
      headers: {
        'authorization': 'Bearer password',
      },
      url: '/api/v1/me',
    });
    t.equal(response.statusCode, 401);
  });
  t.test('accepts a valid bearer token', async t => {
    const response = await t.context.server.inject({
      method: 'GET',
      headers: {
        'authorization': `Bearer ${t.context.token}`,
      },
      url: '/api/v1/me',
    });
    t.equal(response.statusCode, 200);
  });
});

t.test('GET "/api/v1/invite" route', async t => {
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
    const token = await t.context.server.repo.insertToken();
    t.context.token = token;
    const invite = await t.context.server.repo.insertInvite(token.id);
    t.context.invite = invite;
  });
  t.afterEach(async t => {
    await t.context.server.close();
  });

  t.test('should reject requests without any query params', async t => {
    const res = await t.context.server.inject({
      method: 'GET',
      url: '/api/v1/invite',
    });
    t.equal(res.statusCode, 400);
  });
  t.test('should reject requests with invalid invite token', async t => {
    const res = await t.context.server.inject({
      method: 'GET',
      url: '/api/v1/invite',
      query: {
        token: 'deadbeef',
      },
    });
    t.equal(res.statusCode, 404);
  });
  t.test('should resolve requests with valid invite token', async t => {
    const response = await t.context.server.inject({
      method: 'GET',
      url: '/api/v1/invite',
      query: {
        token: t.context.invite.token,
      },
    });
    t.equal(response.statusCode, 200);
    t.match(response.json(), {
      token: t.context.invite.token,
      inviterId: t.context.invite.inviterId,
      createdAt: Number,
    });
  });
});

t.test('POST "/api/v1/invite" route', async t => {
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
    const token = await t.context.server.repo.insertToken();
    t.context.token = token.token;
  });
  t.afterEach(async t => {
    await t.context.server.close();
  });

  t.test('requires "authorization" header', async t => {
    const res = await t.context.server.inject({
      method: 'POST',
      url: '/api/v1/invite',
    });
    t.equal(res.statusCode, 401);
  });
  t.test('returns 204 response status code', async t => {
    const response = await t.context.server.inject({
      method: 'POST',
      headers: {
        'authorization': `Bearer ${t.context.token}`,
      },
      url: '/api/v1/invite',
    });
    t.equal(response.statusCode, 204);
    t.match(response.json(), {
      token: /^[-\w]{86}$/,
      createdAt: Number,
    });
  });
});

t.test('POST "/api/v1/token" route', async t => {
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
    const token = await t.context.server.repo.insertToken();
    const invite = await t.context.server.repo.insertInvite(token.id);
    t.context.invite = invite;
  });
  t.afterEach(async t => {
    await t.context.server.close();
  });

  t.test('rejects invalid token', async t => {
    const response = await t.context.server.inject({
      method: 'POST',
      url: '/api/v1/token',
      body: {
        token: 'skrrt',
      },
    });
    t.equal(response.statusCode, 400);
    t.match(response.json(), {
      message: 'invalid invite secret',
    });
  });
  t.test('returns 204 response status code', async t => {
    const response = await t.context.server.inject({
      method: 'POST',
      url: '/api/v1/token',
      body: {
        token: t.context.invite.token,
      },
    });
    t.equal(response.statusCode, 204);
    t.match(response.json(), {
      token: /^[-\w]{171}$/,
      createdAt: Number,
    });
  });
});
