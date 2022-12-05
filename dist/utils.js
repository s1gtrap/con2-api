"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDataUrl = exports.genToken = void 0;
const crypto_1 = require("crypto");
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
function parseDataUrl(dataUrl) {
    let [mime, data] = ['', ''];
    try {
        [, mime, data] = dataUrl.match(RegExp('^data:(.+\/.+);base64,(.*)$'));
    }
    catch (e) {
        throw new Error('invalid data url');
    }
    return [mime, Buffer.from(data, 'base64')];
}
exports.parseDataUrl = parseDataUrl;
