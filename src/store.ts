import { CompleteMultipartUploadCommandOutput, S3Client, S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { FastifyBaseLogger } from 'fastify';
import fp from 'fastify-plugin';
import sharp from 'sharp';

import * as utils from './utils';

export interface Store {
  putImage(key: string, image: string): Promise<string>;
}

export class S3Store<T extends FastifyBaseLogger> implements Store {
  private s3 = new S3({}) || new S3Client({});

  public constructor(private log: T) { }

  public async putImage(key: string, image: string): Promise<string> {
    this.log.info("S3 putImage ");
    const [, data] = utils.parseDataUrl(image);
    const buf = await sharp(data).webp().toBuffer();

    const parallelUploads3 = new Upload({
      client: this.s3,
      params: { Bucket: process.env.AWS_BUCKET_NAME, Key: `${await utils.genToken(16)}.webp`, Body: data },
    });

    parallelUploads3.on("httpUploadProgress", (progress) => {
      this.log.info(progress);
    });

    const upload = <CompleteMultipartUploadCommandOutput>(await parallelUploads3.done());
    return upload.Location!;
  }
}

export default fp(async (fastify, store?: Store) => {
  await fastify.after();
  await fastify.decorate('store', store || new S3Store(fastify.log));
}, { fastify: '4.x' });
