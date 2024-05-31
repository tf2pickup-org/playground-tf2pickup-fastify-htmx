import type { ObjectId } from 'mongodb'
import type { Tf2Team } from '../../shared/types/tf2-team'
import type { Tf2ClassName } from '../../shared/types/tf2-class-name'

export enum SlotStatus {
  active = 'active',
  waitingForSubstitute = 'waiting for substitute',
  replaced = 'replaced',
}

export enum PlayerConnectionStatus {
  offline = 'offline',
  joining = 'joining',
  connected = 'connected',
}

export interface GameSlotModel {
  player: ObjectId // TODO change to SteamId64
  team: Tf2Team
  gameClass: Tf2ClassName
  status: SlotStatus
  connectionStatus: PlayerConnectionStatus
  skill: number
}
