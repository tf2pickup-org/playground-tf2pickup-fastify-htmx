import { configuration } from '../configuration'
import { collections } from '../database/collections'
import { GameEventType } from '../database/models/game-event.model'
import { PlayerConnectionStatus } from '../database/models/game-slot.model'
import { GameState, type GameModel } from '../database/models/game.model'
import type { SteamId64 } from '../shared/types/steam-id-64'

export async function calculateJoinGameserverTimeout(
  game: GameModel,
  player: SteamId64,
): Promise<Date | undefined> {
  const joinTimeout = await configuration.get('games.join_gameserver_timeout')
  const rejoinTimeout = await configuration.get('games.rejoin_gameserver_timeout')

  if (joinTimeout <= 0 || rejoinTimeout <= 0) {
    return
  }

  const p = await collections.players.findOne({ steamId: player })
  if (p === null) {
    throw new Error(`player ${player} not found`)
  }

  const disconnectedAt = game.events
    .filter(e => e.event === GameEventType.playerLeftGameServer)
    .filter(e => e.player.equals(p._id))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .at(0)?.at

  const replacedAt = game.events
    .filter(e => e.event === GameEventType.playerReplaced)
    .filter(e => e.replacement.equals(p._id))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .at(0)?.at

  switch (game.state) {
    case GameState.launching: {
      const lastConfiguredAt = game.events
        .filter(e => e.event === GameEventType.gameServerInitialized)
        .sort((a, b) => b.at.getTime() - a.at.getTime())[0]?.at
      if (!lastConfiguredAt) {
        throw new Error('invalid game state')
      }

      return new Date(
        Math.max(
          lastConfiguredAt.getTime() + joinTimeout,
          replacedAt ? replacedAt.getTime() + rejoinTimeout : 0,
          disconnectedAt ? disconnectedAt.getTime() + rejoinTimeout : 0,
        ),
      )
    }

    case GameState.started: {
      const slot = game.slots.find(s => s.player.equals(p._id))
      if (!slot) {
        throw new Error(`player ${player} not found in game ${game.number}`)
      }

      if (slot.connectionStatus !== PlayerConnectionStatus.offline) {
        return undefined
      }

      return new Date(
        Math.max(
          replacedAt ? replacedAt.getTime() + rejoinTimeout : 0,
          disconnectedAt ? disconnectedAt.getTime() + rejoinTimeout : 0,
        ),
      )
    }

    default:
      return undefined
  }
}