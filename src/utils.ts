import { randomBytes } from 'crypto';

export function genToken(len: number = 32, encoding: BufferEncoding = 'base64url'): Promise<string> {
  return new Promise((resolve, reject) => {
    randomBytes(len, (err, buf) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf.toString(encoding));
      }
    });
  });
}
