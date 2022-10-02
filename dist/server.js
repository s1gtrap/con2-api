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
const repo_1 = __importDefault(require("./repo"));
function build(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const server = (0, fastify_1.default)(opts);
        yield server.register(repo_1.default);
        server.get('/ping', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            return 'pong\n';
        }));
        return server;
    });
}
exports.build = build;
