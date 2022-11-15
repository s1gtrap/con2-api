import Fastify, { FastifyBaseLogger, FastifyRequest, FastifyReply, FastifyInstance, FastifyServerOptions, RawServerDefault } from 'fastify'

import { default as bearerAuth, FastifyBearerAuthOptions } from '@fastify/bearer-auth';
import { PostgresPluginOptions } from '@fastify/postgres';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

import { IncomingMessage, ServerResponse } from 'http';

import { Type } from '@sinclair/typebox'

import fs from 'fs';
import path from 'path';

import repo from './repo';
import { genToken } from './utils';

export type Options = {
  fastify?: FastifyServerOptions,
  pg?: PostgresPluginOptions,
}

export type Server = FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse, FastifyBaseLogger, TypeBoxTypeProvider>;

export async function build(opts: Options): Promise<Server> {
  const fastify = Fastify(opts.fastify).withTypeProvider<TypeBoxTypeProvider>();

  await fastify
    .register(repo, opts.pg)
    .register(bearerAuth, {
      keys: new Set([]),
      addHook: false,
      auth: async (key: string, req: FastifyRequest) => {
        const user = await fastify.repo.token(key);
        if (user !== null) {
          req.user = user;
          return true;
        }
        return false;
      },
    });

  // /api/v1/status
  fastify.get('/api/v1/status', (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'ok!',
    };
  });

  // /api/v1/me
  fastify.get('/api/v1/me', {
    preHandler: fastify.verifyBearerAuth,
  }, (request: FastifyRequest, reply: FastifyReply) => {
    return {
      id: request.user.id,
      createdAt: request.user.createdAt,
    };
  });

  // /api/v1/invite
  fastify.get('/api/v1/invite', {
    schema: {
      querystring: Type.Object({
        token: Type.String(),
      })
    }
  }, async (req, res) => {
    const invite = await fastify.repo.selectInvite(req.query.token);
    if (invite !== null) {
      return invite;
    }
    res.statusCode = 404;
    return null; // TODO: error msg
  });
  fastify.route({
    url: '/api/v1/invite',
    method: 'POST',
    preHandler: fastify.verifyBearerAuth,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const invite = await fastify.repo.insertInvite(request.user.id);
      return invite;
    },
  });

  // /api/v1/token
  fastify.route({
    url: '/api/v1/token',
    method: 'POST',
    schema: {
      body: Type.Object({
        token: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      const invite = await fastify.repo.selectInvite(request.body.token);
      if (invite === null) {
        reply.statusCode = 400;
        throw new Error('invalid invite secret');
      }
      await fastify.repo.deleteInvite(request.body.token);
      const token = await fastify.repo.insertToken(invite.inviterId);
      return token;
    },
  });

  return fastify;
}
