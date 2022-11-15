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
    connectionString: process.env['DATABASE_URL'],
  },
}).then(server => {
  server.listen({ port: 8080 }, (err: Error | null, address: string) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
});
