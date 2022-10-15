"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenLen = exports.inviteLen = void 0;
exports.inviteLen = Number(process.env.CON2_INVITE_LEN) || 64;
exports.tokenLen = Number(process.env.CON2_TOKEN_LEN) || 128;
