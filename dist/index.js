"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const server = (0, server_1.build)({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty',
        },
    },
});
server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
});
