import fastify from 'fastify';

import repo from './repo';

const server = fastify({
  logger: true,
});

server.register(repo);

server.get('/ping', async (request, reply) => {
  return 'pong\n';
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
