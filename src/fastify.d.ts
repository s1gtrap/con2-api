import { Repository } from './repo';

declare module 'fastify' {
  export interface FastifyInstance {
    repo: Repository
  }

  export interface FastifyRequest {
    user: {
      created_at: string,
      id: string,
    },
  }
}
