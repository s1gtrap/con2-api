import { build } from './server'

build({
  fastify: {
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
      },
    },
  },
  pg: {
  },
}).then((server) => {
  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
});
