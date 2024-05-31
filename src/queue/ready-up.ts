import { collections } from '../database/collections'
import type { QueueSlotModel } from '../database/models/queue-slot.model'
import { QueueState } from '../database/models/queue-state.model'
import { events } from '../events'
import { logger } from '../logger'
import type { SteamId64 } from '../shared/types/steam-id-64'
import { getState } from './get-state'
import { mutex } from './mutex'

export async function readyUp(steamId: SteamId64): Promise<QueueSlotModel> {
  return await mutex.runExclusive(async () => {
    const state = await getState()
    if (state !== QueueState.ready) {
      throw new Error('wrong queue state')
    }

    logger.info(`player ${steamId} ready`)

    const slot = await collections.queueSlots.findOneAndUpdate(
      { player: steamId },
      { $set: { ready: true } },
      { returnDocument: 'after' },
    )
    if (!slot) {
      throw new Error(`player not in queue: ${steamId}`)
    }

    events.emit('queue/slots:updated', { slots: [slot] })
    return slot
  })
}
