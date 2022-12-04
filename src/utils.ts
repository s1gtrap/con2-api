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

export function parseDataUrl(dataUrl: string): [string, Buffer] {
  let [mime, data]: [string, string] = ['', ''];
  try {
    [, mime, data] = dataUrl.match(RegExp('^data:(.+\/.+);base64,(.*)$'))!;
  } catch (e) {
    throw new Error('invalid data url');
  }
  return [mime, Buffer.from(data, 'base64')];
}