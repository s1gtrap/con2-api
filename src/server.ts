import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';

import repo from './repo';

export async function build(opts: FastifyServerOptions): Promise<FastifyInstance> {
  const server = fastify(opts);

  await server.register(repo);

  server.get('/ping', async (request, reply) => {
    return 'pong\n';
  });

  return server;
}
