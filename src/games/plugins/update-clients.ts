import fp from 'fastify-plugin'
import { collections } from '../../database/collections'
import { PlayerConnectionStatus } from '../../database/models/game-slot.model'
import { GameState } from '../../database/models/game.model'
import { events } from '../../events'
import { ConnectInfo } from '../views/html/connect-info'
import { DemoLink } from '../views/html/demo-link'
import { GameSlotList } from '../views/html/game-slot-list'
import { GameStateIndicator } from '../views/html/game-state-indicator'
import { LogsLink } from '../views/html/logs-link'
import { PlayerConnectionStatusIndicator } from '../views/html/player-connection-status-indicator'

// eslint-disable-next-line @typescript-eslint/require-await
export default fp(async app => {
  events.on('game:updated', ({ before, after }) => {
    if (before.state !== after.state) {
      app.gateway.broadcast(async () => await GameStateIndicator({ game: after }))
      app.gateway.broadcast(async actor => await ConnectInfo({ game: after, actor }))

      if ([GameState.launching, GameState.ended].includes(after.state)) {
        app.gateway.broadcast(async () => await GameSlotList({ game: after }))
      }
    }

    if (
      before.connectString !== after.connectString ||
      before.stvConnectString !== after.stvConnectString
    ) {
      app.gateway.broadcast(async actor => await ConnectInfo({ game: after, actor }))
    }

    if (before.logsUrl !== after.logsUrl) {
      app.gateway.broadcast(async () => await LogsLink({ game: after }))
    }

    if (before.demoUrl !== after.demoUrl) {
      app.gateway.broadcast(async () => await DemoLink({ game: after }))
    }
  })

  events.on('match/player:connected', async ({ steamId }) => {
    const player = await collections.players.findOne({ steamId })
    if (!player) {
      throw new Error(`no such player: ${steamId}`)
    }
    app.gateway.broadcast(
      async () =>
        await PlayerConnectionStatusIndicator({
          steamId: player.steamId,
          connectionStatus: PlayerConnectionStatus.joining,
        }),
    )
  })

  events.on('match/player:joinedTeam', async ({ steamId }) => {
    const player = await collections.players.findOne({ steamId })
    if (!player) {
      throw new Error(`no such player: ${steamId}`)
    }
    app.gateway.broadcast(
      async () =>
        await PlayerConnectionStatusIndicator({
          steamId: player.steamId,
          connectionStatus: PlayerConnectionStatus.connected,
        }),
    )
  })

  events.on('match/player:disconnected', async ({ steamId }) => {
    const player = await collections.players.findOne({ steamId })
    if (!player) {
      throw new Error(`no such player: ${steamId}`)
    }
    app.gateway.broadcast(
      async () =>
        await PlayerConnectionStatusIndicator({
          steamId: player.steamId,
          connectionStatus: PlayerConnectionStatus.offline,
        }),
    )
  })
})