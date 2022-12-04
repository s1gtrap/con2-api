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
exports.build = void 0;
const lib_storage_1 = require("@aws-sdk/lib-storage");
const client_s3_1 = require("@aws-sdk/client-s3");
const fastify_1 = __importDefault(require("fastify"));
const sharp_1 = __importDefault(require("sharp"));
const bearer_auth_1 = __importDefault(require("@fastify/bearer-auth"));
const cors_1 = __importDefault(require("@fastify/cors"));
const typebox_1 = require("@sinclair/typebox");
const repo_1 = __importDefault(require("./repo"));
const utils = __importStar(require("./utils"));
const stops = require('../data/stops.json');
function build(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const fastify = (0, fastify_1.default)(opts.fastify).withTypeProvider();
        yield fastify
            .decorate('s3', new client_s3_1.S3({}) || new client_s3_1.S3Client({}))
            .register(cors_1.default, {
            origin: 'https://tan.ge',
        })
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
        // /api/v1/status
        fastify.get('/api/v1/status', (request, reply) => {
            return {
                status: 'ok!',
            };
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
        // /api/v1/token
        fastify.route({
            url: '/api/v1/token',
            method: 'POST',
            schema: {
                body: typebox_1.Type.Object({
                    token: typebox_1.Type.String(),
                }),
            },
            handler: (request, reply) => __awaiter(this, void 0, void 0, function* () {
                const invite = yield fastify.repo.selectInvite(request.body.token);
                if (invite === null) {
                    reply.statusCode = 400;
                    throw new Error('invalid invite secret');
                }
                yield fastify.repo.deleteInvite(request.body.token);
                const token = yield fastify.repo.insertToken(invite.inviterId);
                return token;
            }),
        });
        // GET /api/v1/reports
        fastify.get('/api/v1/reports', {
            preHandler: fastify.verifyBearerAuth,
        }, (request, reply) => __awaiter(this, void 0, void 0, function* () {
            return yield fastify.repo.selectReports();
        }));
        // POST /api/v1/reports
        fastify.post('/api/v1/reports', {
            schema: {
                body: typebox_1.Type.Object({
                    stopId: typebox_1.Type.String(),
                    image: typebox_1.Type.String(),
                }),
            },
            preHandler: (request, reply, done) => fastify.verifyBearerAuth(request, reply, done)
        }, (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const stop = stops[request.body.stopId];
            if (!stop) {
                reply.statusCode = 400;
                throw new Error('invalid stop id');
            }
            reply.statusCode = 201;
            const [, data] = utils.parseDataUrl(request.body.image);
            const buf = yield (0, sharp_1.default)(data).webp().toBuffer();
            try {
                const parallelUploads3 = new lib_storage_1.Upload({
                    client: fastify.s3,
                    params: { Bucket: process.env.AWS_BUCKET_NAME, Key: `${yield utils.genToken(16)}.webp`, Body: buf },
                });
                parallelUploads3.on("httpUploadProgress", (progress) => {
                    fastify.log.info(progress);
                });
                const upload = (yield parallelUploads3.done());
                fastify.log.warn(upload);
                const report = yield fastify.repo.insertReport(request.user, {
                    stop: request.body.stopId,
                    image: request.body.image,
                    name: stop.name,
                    lat: stop.lat,
                    lng: stop.lng,
                });
                return {
                    name: report.name,
                    image: upload.Location,
                    lat: report.lat,
                    lng: report.lng,
                };
            }
            catch (e) {
                fastify.log.error(e);
            }
        }));
        return fastify;
    });
}
exports.build = build;
