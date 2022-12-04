import { randomBytes } from 'crypto';

export function parseDataUrl(dataUrl: string): [string, Buffer] {
  const [, mime, data] = dataUrl.match(RegExp('^data:.+\/(.+);base64,(.*)$'))!;
  return [mime, Buffer.from(data, 'base64')];
}

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
