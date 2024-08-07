import type { SteamId64 } from '../../shared/types/steam-id-64'
import { Tf2ClassName } from '../../shared/types/tf2-class-name'
import type { GameNumber } from './game.model'

export interface PlayerAvatar {
  small: string
  medium: string
  large: string
}

export enum PlayerRole {
  superUser = 'super user',
  admin = 'admin',
  bot = 'bot',
}

export interface PlayerModel {
  name: string
  steamId: SteamId64
  joinedAt: Date
  avatar: PlayerAvatar
  roles: PlayerRole[]
  hasAcceptedRules: boolean
  etf2lProfileId?: number
  cooldownLevel: number
  activeGame?: GameNumber
  skill?: Partial<Record<Tf2ClassName, number>>
}
