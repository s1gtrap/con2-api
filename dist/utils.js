"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genToken = exports.parseDataUrl = void 0;
const crypto_1 = require("crypto");
function parseDataUrl(dataUrl) {
    const [, mime, data] = dataUrl.match(RegExp('^data:.+\/(.+);base64,(.*)$'));
    return [mime, Buffer.from(data, 'base64')];
}
exports.parseDataUrl = parseDataUrl;
function genToken(len = 32, encoding = 'base64url') {
    return new Promise((resolve, reject) => {
        (0, crypto_1.randomBytes)(len, (err, buf) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(buf.toString(encoding));
            }
        });
    });
}
exports.genToken = genToken;
