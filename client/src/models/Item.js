import mod from '@/lib/mod'

const abilities = [
  'varia-suit',
  'gravity-suit',
  'morph-ball',
  'bomb',
  'spring-ball',
  'high-jump',
  'speed-booster',
  'space-jump',
  'screw-attack',
]

const packs = ['missile', 'super-missile', 'power-bomb', 'energy-tank', 'reserve-tank']

const beams = [
  'charge-beam',
  'ice-beam',
  'wave-beam',
  'spazer',
  'plasma-beam',
  'x-ray',
  'grappling-hook',
]

const misc = ['pedastool', 'energy2-tank']

const all = [...abilities, ...packs, ...beams, ...misc]

export default {
  getMapBounds(item, world) {
    const [world_x, world_y] = item.world_xy
    const [screen_x, screen_y] = item.screen_xy
    const { map_screen_size, map_item_size } = world
    // TODO this makes the item fill the whole room
    if (item.class === 'item') {
      return {
        x: world_x * map_screen_size,
        y: world_y * map_screen_size,
        width: map_screen_size,
        height: map_screen_size,
      }
    }
    const width = item.width * map_item_size
    const height = item.height * map_item_size
    const x = world_x * map_screen_size + screen_x * map_item_size
    const y = world_y * map_screen_size + screen_y * map_item_size
    return { x, y, width, height }
  },
  getOutOfBoundsFix(item) {
    const screen_xy = item.screen_xy.slice()
    const world_xy = item.world_xy.slice()
    const dimensions = [0, 1]
    let bad
    dimensions.forEach((i_xy) => {
      if (screen_xy[i_xy] < 0) {
        world_xy[i_xy] -= 1
        bad = true
      } else if (screen_xy[i_xy] >= 15) {
        world_xy[i_xy] += 1
        bad = true
      }
      screen_xy[i_xy] = mod(screen_xy[i_xy], 16)
    })
    return (
      bad && {
        item,
        screen_xy,
        world_xy,
        id: item.id,
        x: screen_xy[0] / 16 + world_xy[0],
        y: screen_xy[1] / 16 + world_xy[1],
        width: 1 / 16,
        height: 1 / 16,
        class: 'oob-fix',
      }
    )
  },
  all,
  abilities,
  packs,
  beams,
  misc,
}
