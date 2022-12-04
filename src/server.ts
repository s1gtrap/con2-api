import { CompleteMultipartUploadCommandOutput, S3Client, S3 } from "@aws-sdk/client-s3";

import Fastify, { FastifyBaseLogger, FastifyRequest, FastifyReply, FastifyInstance, FastifyServerOptions, RawServerDefault } from 'fastify'

import { default as bearerAuth, FastifyBearerAuthOptions } from '@fastify/bearer-auth';
import cors from '@fastify/cors'
import { PostgresPluginOptions } from '@fastify/postgres';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

import { IncomingMessage, ServerResponse } from 'http';

import { Type } from '@sinclair/typebox'

import fs from 'fs';
import path from 'path';

import repo, { Stop } from './repo';
import store, { Store } from './store';
import * as utils from './utils';
import { ReadableStreamBYOBRequest } from 'node:stream/web';

const stops: { [key: string]: Stop } = require('../data/stops.json');

export type Options = {
  fastify?: FastifyServerOptions,
  pg?: PostgresPluginOptions,
  store?: Store,
}

export type Server = FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse, FastifyBaseLogger, TypeBoxTypeProvider>;

export async function build(opts: Options): Promise<Server> {
  const fastify = Fastify(opts.fastify).withTypeProvider<TypeBoxTypeProvider>();

  await fastify
    .register(store, opts.store)
    .register(cors, {
      origin: 'https://tan.ge',
    })
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
      reply.statusCode = 204;
      return invite;
    },
  });

  // POST /api/v1/token
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
      reply.statusCode = 201;
      return token;
    },
  });

  // GET /api/v1/reports
  fastify.get('/api/v1/reports', {
    preHandler: fastify.verifyBearerAuth,
  }, async (request, reply) => {
    return await fastify.repo.selectReports();
  });

  // POST /api/v1/reports
  fastify.post('/api/v1/reports', {
    schema: {
      body: Type.Object({
        stopId: Type.String(),
        image: Type.String(),
      }),
    },
    preHandler: (request, reply, done) => fastify.verifyBearerAuth!(request, reply, done)
  }, async (request, reply) => {
    const stop = stops[request.body.stopId];
    if (!stop) {
      reply.statusCode = 400;
      throw new Error('invalid stop id');
    }

    const url = await fastify.store.putImage('', request.body.image);

    const report = await fastify.repo.insertReport(request.user, {
      stop: request.body.stopId,
      image: url,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
    });

    reply.statusCode = 201;
    return {
      id: report.id,
      stop: request.body.stopId,
      name: report.name,
      image: url,
      lat: report.lat,
      lng: report.lng,
    };
  });

  return fastify;
}
