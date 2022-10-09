import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  FastifyServerOptions,
} from 'fastify';

export default async function (fastify: FastifyInstance, opts: FastifyServerOptions) {
  fastify.route({
    method: 'GET',
    url: '/',
    preHandler: fastify.verifyBearerAuth,
    handler: (request: FastifyRequest, reply: FastifyReply) => {
      return { id: request.user.id, created_at: request.user.created_at };
    }
  })
}
