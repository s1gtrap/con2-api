import fastifyPostgres, { PostgresDb } from '@fastify/postgres';
import fp from 'fastify-plugin';
import { PostgresPluginOptions } from '@fastify/postgres';
import * as Pg from 'pg';

export type Invite = {
  token: string,
  createdAt: number,
}

export type Token = {
  id: string,
  inviterId: string | undefined,
  token: string,
  createdAt: number,
}

export class Repository {
  private pg: PostgresDb;

  public constructor(pg: PostgresDb) {
    this.pg = pg;
  }

  private async trans<T>(fn: (c: Pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pg.connect();
    let data: T;
    try {
      data = await fn(client);
    } finally {
      client.release()
    }
    return data;
  }

  public async query<T>(q: string): Promise<T[]> {
    return await this.trans(async c => (await c.query(q)).rows);
  }

  public async token(token: string): Promise<object> {
    return await this.trans(async c => {
      const { rows } = await c.query('SELECT * FROM tokens WHERE token=$1', [token]);
      return rows.length === 1 ? rows[0] : null;
    });
  }

  public async insertInvite(token: string): Promise<Invite> {
    console.log('dasfsdf', token);
    return await this.trans(async c => {
      const res = await c.query('INSERT INTO invites (token) VALUES ($1) RETURNING EXTRACT(epoch FROM created_at)::int AS created_at', [token]);
      return {
        token,
        createdAt: <number>res.rows[0].created_at, 
      };
    });
  }

  public async insertToken(token: string, inviterId?: string): Promise<Token> {
    return await this.trans(async c => {
      const res = await c.query('INSERT INTO tokens (inviter_id, token) VALUES ($1, $2) RETURNING id, EXTRACT(epoch FROM created_at)::int AS created_at', [inviterId, token]);
      console.log('token', res.rows[0]);
      return {
        id: <string>res.rows[0].id,
        inviterId,
        token,
        createdAt: <number>res.rows[0].created_at, 
      };
    });
  }
}

export default fp(async (fastify, opts: PostgresPluginOptions) => {
  fastify.register(fastifyPostgres, opts);
  await fastify.after();
  await fastify.decorate('repo', new Repository(fastify.pg));
  await fastify.decorateRequest('user', null);
  fastify.log.info('pg ready!');
}, { fastify: '4.x' });
