import { build } from './server'

build({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  },
}).then((server) => {
  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
});
