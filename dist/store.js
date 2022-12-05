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
exports.S3Store = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const sharp_1 = __importDefault(require("sharp"));
const utils = __importStar(require("./utils"));
class S3Store {
    constructor(log) {
        this.log = log;
        this.s3 = new client_s3_1.S3({}) || new client_s3_1.S3Client({});
    }
    putImage(key, image) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.info("S3 putImage ");
            const [, data] = utils.parseDataUrl(image);
            const buf = yield (0, sharp_1.default)(data).webp().toBuffer();
            const parallelUploads3 = new lib_storage_1.Upload({
                client: this.s3,
                params: { Bucket: process.env.AWS_BUCKET_NAME, Key: `${yield utils.genToken(16)}.webp`, Body: data },
            });
            parallelUploads3.on("httpUploadProgress", (progress) => {
                this.log.info(progress);
            });
            const upload = (yield parallelUploads3.done());
            return upload.Location;
        });
    }
}
exports.S3Store = S3Store;
exports.default = (0, fastify_plugin_1.default)((fastify, store) => __awaiter(void 0, void 0, void 0, function* () {
    yield fastify.after();
    yield fastify.decorate('store', store || new S3Store(fastify.log));
}), { fastify: '4.x' });
