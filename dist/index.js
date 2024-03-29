"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
(0, server_1.build)({
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
        //ssl: { rejectUnauthorized: false },
    },
}).then(server => {
    server.listen({
        host: '0.0.0.0',
        port: Number(process.env['PORT']) || 8080,
    }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });
});
