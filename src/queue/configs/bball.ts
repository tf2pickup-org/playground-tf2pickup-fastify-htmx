import { Tf2ClassName } from '../../shared/types/tf2-class-name'
import { QueueConfig } from '../types/queue-config'

export const bball: QueueConfig = {
  teamCount: 2,
  classes: [
    {
      name: Tf2ClassName.soldier,
      count: 2,
    },
  ],
}
