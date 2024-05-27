import { User } from './types/user'

declare module 'fastify' {
  interface FastifyRequest {
    user?: User
  }
}