"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const env = __importStar(require("./env"));
const utils = __importStar(require("./utils"));
class Repository {
    constructor(pg) {
        this.pg = pg;
    }
    trans(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.pg.connect();
            let data;
            try {
                data = yield fn(client);
            }
            finally {
                client.release();
            }
            return data;
        });
    }
    query(q) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.trans((c) => __awaiter(this, void 0, void 0, function* () { return (yield c.query(q)).rows; }));
        });
    }
    token(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.trans((c) => __awaiter(this, void 0, void 0, function* () {
                const { rows } = yield c.query('SELECT * FROM tokens WHERE token=$1', [token]);
                return rows.length === 1 ? rows[0] : null;
            }));
        });
    }
    selectInvite(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.trans((c) => __awaiter(this, void 0, void 0, function* () {
                const res = yield c.query('SELECT inviter_id, EXTRACT(epoch FROM created_at)::int AS created_at FROM invites WHERE token=$1', [token]);
                return res.rows[0] ? {
                    token,
                    inviterId: res.rows[0].inviter_id,
                    createdAt: res.rows[0].created_at,
                } : null;
            }));
        });
    }
    insertInvite(inviterId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.trans((c) => __awaiter(this, void 0, void 0, function* () {
                const token = yield utils.genToken(env.inviteLen);
                const res = yield c.query('INSERT INTO invites (token, inviter_id) VALUES ($1, $2) RETURNING EXTRACT(epoch FROM created_at)::int AS created_at', [token, inviterId]);
                return {
                    token,
                    inviterId,
                    createdAt: res.rows[0].created_at,
                };
            }));
        });
    }
    deleteInvite(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.trans((c) => __awaiter(this, void 0, void 0, function* () {
                const token = yield utils.genToken(env.tokenLen);
                yield c.query('DELETE FROM invites WHERE token=$1', [token]);
            }));
        });
    }
    insertToken(inviterId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.trans((c) => __awaiter(this, void 0, void 0, function* () {
                const token = yield utils.genToken(env.tokenLen);
                const res = yield c.query('INSERT INTO tokens (inviter_id, token) VALUES ($1, $2) RETURNING id, EXTRACT(epoch FROM created_at)::int AS created_at', [inviterId, token]);
                return {
                    id: res.rows[0].id,
                    inviterId,
                    token,
                    createdAt: res.rows[0].created_at,
                };
            }));
        });
    }
}
exports.Repository = Repository;
exports.default = (0, fastify_plugin_1.default)((fastify, opts) => __awaiter(void 0, void 0, void 0, function* () {
    fastify.register(postgres_1.default, opts);
    yield fastify.after();
    yield fastify.decorate('repo', new Repository(fastify.pg));
    yield fastify.decorateRequest('user', null);
    fastify.log.info('pg ready!');
}), { fastify: '4.x' });
