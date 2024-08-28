import type { User } from '../../../auth/types/user'
import { collections } from '../../../database/collections'
import { Layout } from '../../../html/layout'
import { NavigationBar } from '../../../html/components/navigation-bar'
import { PlayerRole, type PlayerModel } from '../../../database/models/player.model'
import { format } from 'date-fns'
import { GameState } from '../../../database/models/game.model'
import { getPlayerGameCountOnClasses } from '../../get-player-game-count-on-classes'
import { Tf2ClassName } from '../../../shared/types/tf2-class-name'
import { GameClassIcon } from '../../../html/components/game-class-icon'
import {
  IconAlignBoxBottomRight,
  IconBrandSteam,
  IconEdit,
  IconStars,
} from '../../../html/components/icons'
import { Style } from '../../../html/components/style'
import { resolve } from 'node:path'
import { Page } from '../../../html/components/page'
import { Footer } from '../../../html/components/footer'
import { GameListItem } from '../../../games/views/html/game-list-item'
import { Pagination, paginate } from '../../../html/components/pagination'
import type { WithId } from 'mongodb'
import type { SteamId64 } from '../../../shared/types/steam-id-64'

const gamesPerPage = 5

export async function PlayerPage(props: {
  player: WithId<PlayerModel>
  user?: User | undefined
  page: number
}) {
  const skip = (props.page - 1) * gamesPerPage

  const games = await collections.games
    .find(
      { 'slots.player': props.player._id },
      { limit: gamesPerPage, skip, sort: { 'events.0.at': -1 } },
    )
    .toArray()

  const { last, around } = paginate(
    props.page,
    gamesPerPage,
    await collections.games.countDocuments({ 'slots.player': props.player._id }),
  )

  const gameCount = await collections.games.countDocuments({
    $and: [{ state: GameState.ended }, { ['slots.player']: props.player._id }],
  })

  const gameCountOnClasses = await getPlayerGameCountOnClasses(props.player._id)

  return (
    <Layout
      title={props.player.name}
      head={
        <>
          <Style fileName={resolve(import.meta.dirname, 'style.css')} />
          <Style
            fileName={resolve(import.meta.dirname, '../../../games/views/html/game-list.css')}
          />
        </>
      }
    >
      <NavigationBar user={props.user} />
      <Page>
        <div class="container mx-auto mt-12 grid grid-cols-2 gap-[30px] p-2 lg:p-0 relative">
          <PlayerPresentation
            player={props.player}
            gameCount={gameCount}
            gameCountOnClasses={gameCountOnClasses}
          />

          {games.length > 0 ? (
            <>
              <div class="col-span-2 text-abru-light-75 text-2xl font-bold">Game history</div>
              <div class="col-span-2 game-list">
                {games.map(game => (
                  <GameListItem
                    game={game}
                    classPlayed={game.slots.find(s => s.player.equals(props.player._id))!.gameClass}
                  />
                ))}
              </div>

              <Pagination
                hrefFn={page => `/players/${props.player.steamId}?gamespage=${page}`}
                lastPage={last}
                currentPage={props.page}
                around={around}
              />
            </>
          ) : (
            <>
              <div></div>
            </>
          )}
          <EditPlayerButton user={props.user} steamId={props.player.steamId} />
        </div>
      </Page>
      <Footer user={props.user} />
    </Layout>
  )
}

function PlayerPresentation(props: {
  player: PlayerModel
  gameCount: number
  gameCountOnClasses: { [gameClass in Tf2ClassName]?: number }
}) {
  return (
    <div class="col-span-2 flex flex-row gap-[10px] rounded-lg bg-abru-dark-29 p-[10px] text-abru-light-75">
      <img
        src={props.player.avatar.large}
        width="184"
        height="184"
        class="h-[184px] w-[184px] rounded"
        alt={`${props.player.name}'s avatar`}
      />

      <div class="flex grow flex-col justify-between p-[22px]">
        <div class="flex grow flex-row gap-[10px]">
          <span class="-mt-[6px] text-[48px] font-bold leading-none" safe>
            {props.player.name}
          </span>
          {props.player.roles.includes(PlayerRole.admin) ? (
            <span class="my-2 self-baseline rounded-[3px] bg-alert px-[8px] py-[6px] font-bold leading-none text-abru-light-3">
              admin
            </span>
          ) : (
            <></>
          )}

          <div class="grow"></div>

          <div class="flex flex-col">
            <span class="text-base font-light">Joined:</span>
            <span class="text-2xl font-bold" safe>
              {format(props.player.joinedAt, 'MMMM dd, yyyy')}
            </span>
          </div>
        </div>

        <div class="flex flex-row items-center justify-between">
          <div class="grid grid-flow-col grid-rows-2 place-items-center gap-x-6">
            <span class="text-base font-light">Total games played:</span>
            <span class="justify-self-start text-2xl font-bold">{props.gameCount}</span>

            <div class="row-span-2 mx-2 h-[48px] w-[2px] bg-abru-light-15"></div>

            {[
              Tf2ClassName.scout,
              Tf2ClassName.soldier,
              Tf2ClassName.demoman,
              Tf2ClassName.medic,
            ].map(gameClass => (
              <>
                <GameClassIcon gameClass={gameClass} size={32} />
                <span class="text-2xl font-bold">{props.gameCountOnClasses[gameClass] ?? 0}</span>
              </>
            ))}
          </div>

          <div class="flex flex-row gap-[10px]">
            <a
              href={`https://steamcommunity.com/profiles/${props.player.steamId}`}
              target="_blank"
              rel="noreferrer"
              class="player-presentation-link"
            >
              <IconBrandSteam />
              <span>steam</span>
            </a>

            <a
              href={`https://logs.tf/profile/${props.player.steamId}`}
              target="_blank"
              rel="noreferrer"
              class="player-presentation-link"
            >
              <IconAlignBoxBottomRight />
              <span>logs</span>
            </a>

            {props.player.etf2lProfileId ? (
              <a
                href={`https://etf2l.org/forum/user/${props.player.etf2lProfileId}`}
                target="_blank"
                rel="noreferrer"
                class="player-presentation-link"
              >
                <IconStars />
                <span>etf2l</span>
              </a>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EditPlayerButton(props: { user: User | undefined; steamId: SteamId64 }) {
  return (
    <div class="grid justify-items-end">
      {props.user?.player.roles.includes(PlayerRole.admin) ? (
        <a href={`/players/${props.steamId}/edit`} class="button button--accent drop-shadow">
          <span class="sr-only">Edit player</span>
          <IconEdit />
        </a>
      ) : (
        <></>
      )}
    </div>
  )
}
