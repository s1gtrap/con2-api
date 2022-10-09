"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genToken = void 0;
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
