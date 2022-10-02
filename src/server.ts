import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';

import repo from './repo';

export function build(opts: FastifyServerOptions): FastifyInstance {
  const server = fastify(opts);

  server.register(repo);

  server.get('/ping', async (request, reply) => {
    return 'pong\n';
  });

  return server;
}
