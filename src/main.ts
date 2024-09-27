import fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { resolve } from 'node:path'
import { logger as loggerInstance } from './logger'
import { environment } from './environment'
import { secrets } from './secrets'
import { hoursToSeconds } from 'date-fns'

const app = fastify({ loggerInstance })

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

await app.register(await import('@fastify/sensible'))
await app.register(await import('@fastify/formbody'))
await app.register(await import('@fastify/cookie'), {
  secret: environment.AUTH_SECRET,
  hook: 'onRequest',
})
await app.register(await import('@fastify/secure-session'), {
  key: await secrets.get('session'),
  expiry: hoursToSeconds(24),
  cookie: {
    path: '/',
    httpOnly: true,
  },
})
await app.register((await import('@fastify/flash')).default)
await app.register(await import('@fastify/request-context'))

await app.register((await import('./postcss')).default)
await app.register(await import('@fastify/static'), {
  root: resolve(import.meta.dirname, '..', 'public'),
  prefix: '/',
})

await app.register((await import('@kitajs/fastify-html-plugin')).default)

await app.register((await import('./messages')).default)
await app.register((await import('./tasks')).default)
await app.register((await import('./ws')).default)
await app.register((await import('./auth')).default)
await app.register((await import('./queue')).default)
await app.register((await import('./online-players')).default)
await app.register((await import('./players')).default)
await app.register((await import('./games')).default)
await app.register((await import('./static-game-servers')).default)
await app.register((await import('./game-servers')).default)
await app.register((await import('./log-receiver')).default)
await app.register((await import('./documents')).default)
await app.register((await import('./statistics')).default)
await app.register((await import('./admin')).default)

await app.listen({ port: 3000 })
