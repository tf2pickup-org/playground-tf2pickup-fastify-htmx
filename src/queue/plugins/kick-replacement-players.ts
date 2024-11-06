import fp from 'fastify-plugin'
import { events } from '../../events'
import { kick } from '../kick'
import { safe } from '../../utils/safe'

export default fp(
  // eslint-disable-next-line @typescript-eslint/require-await
  async () => {
    events.on(
      'game:playerReplaced',
      safe(async ({ replacement }) => {
        await kick(replacement)
      }),
    )
  },
  { name: 'kick replacement players' },
)
