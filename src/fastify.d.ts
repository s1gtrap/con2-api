import { Repository, Token } from './repo';
import { Store } from './store';

declare module 'fastify' {
  export interface FastifyInstance {
    repo: Repository,
    store: Store,
  }

  export interface FastifyRequest {
    user: Token,
  }
}
