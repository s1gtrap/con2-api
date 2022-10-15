"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const typebox_1 = require("@sinclair/typebox");
const utils_1 = require("../../utils");
function default_1(fastify, opts) {
    const bodyJsonSchema = typebox_1.Type.Object({
        token: typebox_1.Type.String(),
    });
    fastify.get('/', {
        schema: {
            body: typebox_1.Type.Object({
                token: typebox_1.Type.String(),
            })
        }
    }, (req) => {
        // The `x`, `y`, `z` types are automatically inferred
        const { token } = req.body;
    });
    fastify.route({
        method: 'POST',
        url: '/',
        preHandler: fastify.verifyBearerAuth,
        handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const invite = yield fastify.repo.insertInvite(yield (0, utils_1.genToken)(64));
            fastify.log.info('invite', JSON.stringify(invite));
            reply.statusCode = 204;
            return invite;
        }),
    });
}
exports.default = default_1;
