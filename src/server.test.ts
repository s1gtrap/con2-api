import { readFileSync } from 'fs';
import t from 'tap';

import { Repository } from './repo';
import { build } from './server';
import { Store } from './store';

async function createDb(repo: Repository) {
  await repo.query(readFileSync('migrations/tokens-1664917366.up.sql').toString().replace('CREATE TABLE', 'CREATE TEMPORARY TABLE'));
  await repo.query(readFileSync('migrations/invites-1665232748.up.sql').toString().replace('CREATE TABLE', 'CREATE TEMPORARY TABLE'));
  await repo.query(readFileSync('migrations/reports-1664963421.up.sql').toString().replace('CREATE TABLE', 'CREATE TEMPORARY TABLE'));
}

t.test('GET "/api/v1/status" route', async t => {
  t.beforeEach(async t => {
    t.context.server = await build({
      pg: { database: 'con2_test' },
    });
    await createDb(t.context.server.repo);
    const token = await t.context.server.repo.insertToken();
    t.context.token = token.token;
  });
  t.afterEach(async t => {
    await t.context.server.close();
  });

  t.test('always returns ok!', async t => {
    const response = await t.context.server.inject({
      method: 'GET',
      url: '/api/v1/status',
    });
    t.equal(response.statusCode, 200);
    t.equal(response.body, '{"status":"ok!"}');
  });
});

t.test('GET "/api/v1/me" route', async t => {
  t.beforeEach(async t => {
    t.context.server = await build({
      pg: { database: 'con2_test' },
    });
    await createDb(t.context.server.repo);
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
        'authorization': `Bearer ${t.context.token} `,
      },
      url: '/api/v1/me',
    });
    t.equal(response.statusCode, 200);
  });
});

t.test('GET "/api/v1/invite" route', async t => {
  t.beforeEach(async t => {
    t.context.server = await build({
      pg: { database: 'con2_test' },
    });
    await createDb(t.context.server.repo);
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
      pg: { database: 'con2_test' },
    });
    await createDb(t.context.server.repo);
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
  t.test('returns 201 response status code', async t => {
    const response = await t.context.server.inject({
      method: 'POST',
      headers: {
        'authorization': `Bearer ${t.context.token} `,
      },
      url: '/api/v1/invite',
    });
    t.equal(response.statusCode, 201);
    t.match(response.json(), {
      token: /^[-\w]{86}$/,
      createdAt: Number,
    });
  });
});

t.test('POST "/api/v1/token" route', async t => {
  t.beforeEach(async t => {
    t.context.server = await build({
      pg: { database: 'con2_test' },
    });
    await createDb(t.context.server.repo);
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
    t.equal(response.statusCode, 201);
    t.match(response.json(), {
      token: /^[-\w]{171}$/,
      createdAt: Number,
    });
  });
});

t.test('POST "/api/v1/reports" route', async t => {
  class MockStore implements Store {
    public async putImage(key: string, image: string): Promise<string> {
      return 'https://place.holder/img-url.tiff';
    }
  }

  t.beforeEach(async t => {
    t.context.server = await build({
      fastify: {
        logger: {
          level: 'error',
          transport: {
            target: 'pino-pretty',
          },
        },
      },
      pg: { database: 'con2_test' },
      store: new MockStore(),
    });
    await createDb(t.context.server.repo);

    const token = await t.context.server.repo.insertToken();
    t.context.token = token;
  });
  t.afterEach(async t => {
    await t.context.server.close();
  });

  t.test('accepts valid report', async t => {
    const response = await t.context.server.inject({
      method: 'POST',
      url: '/api/v1/reports',
      headers: {
        'authorization': `Bearer ${t.context.token.token} `,
      },
      body: {
        stopId: '751415001',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII',
      },
    });
    t.equal(response.statusCode, 201);
    t.match(response.json(), {
    });
  });
});
