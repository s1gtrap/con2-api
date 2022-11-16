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
    ssl: { rejectUnauthorized: false },
  },
}).then(server => {
  server.listen({
    host: '0.0.0.0',
    port: Number(process.env['PORT']) || 8080,
  }, (err: Error | null, address: string) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
});
