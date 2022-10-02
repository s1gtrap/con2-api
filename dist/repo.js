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
exports.Repository = void 0;
const postgres_1 = __importDefault(require("@fastify/postgres"));
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
class Repository {
    constructor(pg) {
        this.pg = pg;
    }
    trans(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.pg.connect();
            let data;
            try {
                data = fn(client);
            }
            finally {
                client.release();
            }
            return data;
        });
    }
    now() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.trans((c) => __awaiter(this, void 0, void 0, function* () {
                const result = yield c.query('SELECT NOW()');
                return result.rows[0];
            }));
        });
    }
}
exports.Repository = Repository;
exports.default = (0, fastify_plugin_1.default)((fastify, opts) => __awaiter(void 0, void 0, void 0, function* () {
    fastify.register(postgres_1.default, opts);
    yield fastify.after();
    fastify.repo = new Repository(fastify.pg);
    fastify.log.info('pg ready!');
}), { fastify: '4.x' });
