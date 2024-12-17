import { Client } from '@tf2pickup-org/mumble-client'
import { authUsers } from './auth-users'

interface MumbleConfiguration {
  host: string
  port: number
  channelName: string
}

export const configureMumbleServer = authUsers.extend<{
  mumbleConfiguration: MumbleConfiguration
  mumbleClient: Client
  mumbleServerConfigured: void
}>({
  mumbleConfiguration: async ({}, use) => {
    await use({ host: 'localhost', port: 64738, channelName: 'tf2pickup-tests' })
  },
  mumbleClient: async ({ mumbleConfiguration }, use) => {
    const client = new Client({
      ...mumbleConfiguration,
      username: 'superuser',
      password: '123456',
      rejectUnauthorized: false,
    })
    await client.connect()
    await use(client)
    client.disconnect()
  },
  mumbleServerConfigured: [
    async ({ users, mumbleConfiguration }, use) => {
      const { channelName } = mumbleConfiguration

      const admin = await users.getAdmin().adminPage()
      await admin.configureVoiceServer({
        host: 'localhost',
        password: '',
        channelName,
      })
      await use()
    },
    { auto: true },
  ],
})
