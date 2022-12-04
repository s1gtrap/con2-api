import { S3Client, S3 } from "@aws-sdk/client-s3";

import { Repository, Token } from './repo';

declare module 'fastify' {
  export interface FastifyInstance {
    repo: Repository,
    s3: S3 | S3Client,
  }

  export interface FastifyRequest {
    user: Token,
  }
}
