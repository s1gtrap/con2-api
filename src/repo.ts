import fastifyPostgres, { PostgresDb } from '@fastify/postgres';
import fp from 'fastify-plugin';
import * as Pg from 'pg';

export class Repository {
  private pg: PostgresDb;

  public constructor(pg: PostgresDb) {
    this.pg = pg;
  }

  private async trans(fn: (c: Pg.PoolClient) => any) {
    const client = await this.pg.connect();
    let data;
    try {
      data = fn(client);
    } finally {
      client.release()
    }
    return data;
  }

  public async now() {
    return this.trans(async (c) => {
      const result = await c.query('SELECT NOW()');
      return result.rows[0];
    });
  }
}

export default fp(async (fastify, opts) => {
  fastify.register(fastifyPostgres, opts);
  await fastify.after();
  fastify.repo = new Repository(fastify.pg);
  fastify.log.info('pg ready!');
}, { fastify: '4.x' });
