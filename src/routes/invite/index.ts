import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  FastifyServerOptions,
} from 'fastify';

import { Invite } from '../../repo';
import { genToken } from '../../utils';

export default async function (fastify: FastifyInstance, opts: FastifyServerOptions) {
  fastify.route({
    method: 'POST',
    url: '/',
    preHandler: fastify.verifyBearerAuth,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const invite: Invite = await fastify.repo.insertInvite(await genToken(64));
      fastify.log.info('invite', JSON.stringify(invite));
      reply.statusCode = 204;
      return invite;
    },
  });
}
