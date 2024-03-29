import fastifyPostgres, { PostgresDb } from '@fastify/postgres';
import fp from 'fastify-plugin';
import { PostgresPluginOptions } from '@fastify/postgres';
import * as Pg from 'pg';

import * as env from './env';
import * as utils from './utils';

export type Invite = {
  token: string,
  inviterId: string,
  createdAt: number,
}

export type Token = {
  id: string,
  inviterId: string | undefined,
  token: string,
  createdAt: number,
}

export type Stop = {
  id: string,
  name: string,
  lat: number,
  lng: number,
}

export type Report = {
  id?: string,
  stop: string,
  image: string,
  name: string,
  lat: number,
  lng: number,
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

  public async token(token: string): Promise<Token | null> {
    return await this.trans(async c => {
      const { rows } = await c.query('SELECT * FROM tokens WHERE token=$1', [token]);
      return rows.length === 1 ? rows[0] : null;
    });
  }

  public async selectInvite(token: string): Promise<Invite | null> {
    return await this.trans(async c => {
      const res = await c.query('SELECT inviter_id, EXTRACT(epoch FROM created_at)::int AS created_at FROM invites WHERE token=$1', [token]);
      return res.rows[0] ? {
        token,
        inviterId: res.rows[0].inviter_id,
        createdAt: <number>res.rows[0].created_at,
      } : null;
    });
  }

  public async insertInvite(inviterId: string): Promise<Invite> {
    return await this.trans(async c => {
      const token = await utils.genToken(env.inviteLen);
      const res = await c.query('INSERT INTO invites (token, inviter_id) VALUES ($1, $2) RETURNING EXTRACT(epoch FROM created_at)::int AS created_at', [token, inviterId]);
      return {
        token,
        inviterId,
        createdAt: <number>res.rows[0].created_at,
      };
    });
  }

  public async deleteInvite(token: string): Promise<void> {
    return await this.trans(async c => {
      const token = await utils.genToken(env.tokenLen);
      await c.query('DELETE FROM invites WHERE token=$1', [token]);
    });
  }

  public async insertToken(inviterId?: string): Promise<Token> {
    return await this.trans(async c => {
      const token = await utils.genToken(env.tokenLen);
      const res = await c.query('INSERT INTO tokens (inviter_id, token) VALUES ($1, $2) RETURNING id, EXTRACT(epoch FROM created_at)::int AS created_at', [inviterId, token]);
      return {
        id: <string>res.rows[0].id,
        inviterId,
        token,
        createdAt: <number>res.rows[0].created_at,
      };
    });
  }

  public async selectReports(): Promise<Report[]> {
    return await this.trans(async c => {
      const res = await c.query('SELECT * FROM reports WHERE created_at >= NOW() - INTERVAL \'2 hours\'', []);

      return res.rows;
    });
  }

  public async insertReport(reporter: Token, report: Report): Promise<Report> {
    return await this.trans(async c => {
      const { rows } = await c.query(
        'INSERT INTO reports (reporter, stop, image, name, lat, lng) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [reporter.id, report.stop, report.image, report.name, report.lat, report.lng],
      );
      return {
        id: rows[0].id,
        reporter: reporter.id,
        stop: report.stop,
        image: report.image,
        name: report.name,
        lat: report.lat,
        lng: report.lng,
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
