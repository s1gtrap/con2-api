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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const fastify_1 = __importDefault(require("fastify"));
const bearer_auth_1 = __importDefault(require("@fastify/bearer-auth"));
const typebox_1 = require("@sinclair/typebox");
const repo_1 = __importDefault(require("./repo"));
function build(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const fastify = (0, fastify_1.default)(opts.fastify).withTypeProvider();
        yield fastify
            .register(repo_1.default, opts.pg)
            .register(bearer_auth_1.default, {
            keys: new Set([]),
            addHook: false,
            auth: (key, req) => __awaiter(this, void 0, void 0, function* () {
                const user = yield fastify.repo.token(key);
                if (user !== null) {
                    req.user = user;
                    return true;
                }
                return false;
            }),
        });
        // /api/v1/me
        fastify.get('/api/v1/me', {
            preHandler: fastify.verifyBearerAuth,
        }, (request, reply) => {
            return {
                id: request.user.id,
                createdAt: request.user.createdAt,
            };
        });
        // /api/v1/invite
        fastify.get('/api/v1/invite', {
            schema: {
                querystring: typebox_1.Type.Object({
                    token: typebox_1.Type.String(),
                })
            }
        }, (req, res) => __awaiter(this, void 0, void 0, function* () {
            const invite = yield fastify.repo.selectInvite(req.query.token);
            if (invite !== null) {
                return invite;
            }
            res.statusCode = 404;
            return null; // TODO: error msg
        }));
        fastify.route({
            url: '/api/v1/invite',
            method: 'POST',
            preHandler: fastify.verifyBearerAuth,
            handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
                const invite = yield fastify.repo.insertInvite(request.user.id);
                reply.statusCode = 204;
                return invite;
            }),
        });
        return fastify;
    });
}
exports.build = build;
