import { Repository } from './repo';

declare module 'fastify' {
  export interface FastifyInstance {
    repo: Repository
  }
}
