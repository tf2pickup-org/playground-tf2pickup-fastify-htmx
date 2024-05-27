import fp from 'fastify-plugin'
import { collections } from '../database/collections'
import { QueueSlot } from './views/html/queue-slot'
import { QueueState } from './views/html/queue-state'
import { OnlinePlayerList } from '../online-players/views/html/online-player-list'
import { join } from './join'
import { leave } from './leave'
import { readyUp } from './ready-up'

export default fp(
  // eslint-disable-next-line @typescript-eslint/require-await
  async app => {
    app.gateway.on('connected', async socket => {
      const slots = await collections.queueSlots.find().toArray()
      slots.forEach(async slot => {
        socket.send(await QueueSlot({ slot, actor: socket.player?.steamId }))
      })
      socket.send(await QueueState())
      socket.send(await OnlinePlayerList())
    })

    app.gateway.on('queue:join', async (socket, slotId) => {
      if (!socket.player) {
        return
      }

      await join(slotId, socket.player.steamId)
    })

    app.gateway.on('queue:leave', async socket => {
      if (!socket.player) {
        return
      }

      await leave(socket.player.steamId)
    })

    app.gateway.on('queue:readyup', async socket => {
      if (!socket.player) {
        return
      }

      await readyUp(socket.player.steamId)
    })
  },
  { name: 'queue-gateway-listeners' },
)