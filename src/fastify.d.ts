import { Repository, Token } from './repo';

declare module 'fastify' {
  export interface FastifyInstance {
    repo: Repository
  }

  export interface FastifyRequest {
    user: Token,
  }
}
