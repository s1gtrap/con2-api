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
const repo_1 = __importDefault(require("./repo"));
function build(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const server = (0, fastify_1.default)(opts.fastify);
        yield server.register(repo_1.default, opts.pg);
        yield server.register(bearer_auth_1.default, {
            keys: new Set([]),
            addHook: false,
            auth: (token, req) => __awaiter(this, void 0, void 0, function* () {
                const user = yield server.repo.token(token);
                req.user = user;
                return user !== null;
            }),
        });
        yield server.register(require('./routes/me'), { prefix: '/api/v1/me' });
        yield server.register(require('./routes/invite'), { prefix: '/api/v1/invite' });
        return server;
    });
}
exports.build = build;
