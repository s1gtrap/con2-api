import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifyBearerAuth from '@fastify/bearer-auth';
import { PostgresPluginOptions } from '@fastify/postgres';
import { Pool, Client } from 'pg';
import fs from 'fs';
import path from 'path';

import repo from './repo';
import { genToken } from './utils';

export type Options = {
  fastify?: FastifyServerOptions,
  pg?: PostgresPluginOptions,
}

export async function build(opts: Options): Promise<FastifyInstance> {
  const server = fastify(opts.fastify);

  await server.register(repo, opts.pg);

  await server.register(fastifyBearerAuth, {
    keys: new Set([]),
    addHook: false,
    auth: async (token: string, req: any) => {
      const user = await server.repo.token(token);
      req.user = user;
      return user !== null;
    },
  });

  await server.register(require('./routes/me'), { prefix: '/api/v1/me' });
  await server.register(require('./routes/invite'), { prefix: '/api/v1/invite' });

  return server;
}
