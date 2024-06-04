import { collections } from '../database/collections'
import type { QueueSlotModel } from '../database/models/queue-slot.model'
import { QueueState } from '../database/models/queue-state.model'
import { events } from '../events'
import type { SteamId64 } from '../shared/types/steam-id-64'
import { getMapVoteResults } from './get-map-vote-results'
import { getState } from './get-state'
import { mutex } from './mutex'

export async function leave(steamId: SteamId64): Promise<QueueSlotModel> {
  return await mutex.runExclusive(async () => {
    const state = await getState()
    if (state === QueueState.launching) {
      throw new Error('invalid queue state')
    }

    const slot = await collections.queueSlots.findOneAndUpdate(
      {
        player: steamId,
      },
      {
        $set: { player: null },
      },
      {
        returnDocument: 'after',
      },
    )

    if (!slot) {
      throw new Error('player not in the queue')
    }
    events.emit('queue/slots:updated', { slots: [slot] })

    await collections.queueMapVotes.deleteMany({ player: steamId })
    events.emit('queue/mapVoteResults:updated', { results: await getMapVoteResults() })
    return slot
  })
}
