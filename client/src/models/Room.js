import { range, sortBy } from 'lodash'

const doors_direction_to_dxys = {
  up: range(4).map((i) => [i, 0]),
  down: range(4).map((i) => [i, 0]),
  left: range(4).map((i) => [0, i]),
  right: range(4).map((i) => [0, i]),
}

const sxy2xy = (sxy) => sxy.split(',').map(Number)

const findHorizontalRects = (map) => {
  const results = {}
  map = { ...map }
  const xys = Object.keys(map).map(sxy2xy)
  sortBy(xys, [1, 0]).forEach(([x, y]) => {
    if (!map[[x, y]]) {
      return // value removed in previous loop
    }
    let width = 1
    while (map[[x + width, y]]) {
      delete map[[x + width, y]]
      width++
    }
    results[[x, y]] = [x, y, width, 1]
  })

  // Group rects together if they are next to each other and of equal width
  Object.values(results).forEach(([x, y, width, height]) => {
    if (!results[[x, y]]) {
      return // value removed in previous loop
    }
    while (results[[x, y + height]]?.[2] === width) {
      delete results[[x, y + height]]
      height += 1
    }
    results[[x, y]][3] = height
  })
  return results
}

const findVerticalRects = (map) => {
  const results = {}
  map = { ...map }
  const xys = Object.keys(map).map(sxy2xy)
  sortBy(xys, [1, 0]).forEach(([x, y]) => {
    if (!map[[x, y]]) {
      return // value removed in previous loop
    }
    let height = 1
    while (map[[x, y + height]]) {
      delete map[[x, y + height]]
      height++
    }
    results[[x, y]] = [x, y, 1, height]
  })

  // Group rects together if they are next to each other and of equal width
  Object.values(results).forEach(([x, y, width, height]) => {
    if (!results[[x, y]]) {
      return // value removed in previous loop
    }
    while (results[[x + width, y]]?.[3] === height) {
      delete results[[x + width, y]]
      width += 1
    }
    results[[x, y]][2] = width
  })
  return results
}

const getBlocks = (room, with_cre = false) => {
  // Combines cre_hex, cre_overrides into a block_map { [xy]: type }
  // removes doors and samus-eaters (form plm_overrides)
  const block_map = {}

  if (with_cre) {
    Object.entries(room.data.cre || {}).forEach(([name, rects]) => {
      const _class = `sm-cre-hex -${name}`
      rects.forEach(([x, y, w, h]) => {
        range(w).forEach((dx) => {
          range(h).forEach((dy) => {
            block_map[[x + dx, y + dy]] = _class
          })
        })
      })
    })
  }

  Object.entries(room.data.cre_hex || {}).forEach(([name, rects]) => {
    const _class = `sm-cre-hex -${name}`
    rects.forEach(([x, y, w, h]) => {
      range(w).forEach((dx) => {
        range(h).forEach((dy) => {
          block_map[[x + dx, y + dy]] = _class
        })
      })
    })
  })

  // Samus eaters are recorded in the cre from smile exports
  Object.entries(room.data.plm_overrides || {}).map(([sxy, value]) => {
    if (value.startsWith('samus-eater')) {
      const [x, y] = sxy.split(',').map(Number)
      range(4).forEach((dx) => range(2).forEach((dy) => delete block_map[[x + dx, y + dy]]))
    }
  })

  room.data.cre_overrides?.forEach(([x, y, w, h, name]) => {
    range(w).forEach((dx) => {
      range(h).forEach((dy) => {
        const respawn = block_map[[x + dx, y + dy]]?.includes('-respawn') ? 'respawn' : 'unknown'
        const _class = `sm-block -${respawn} -${name}`
        block_map[[x + dx, y + dy]] = _class
      })
    })
  })
  Object.values(room.data.doors || {}).forEach(([x, y, direction]) => {
    doors_direction_to_dxys[direction].forEach(([dx, dy]) => {
      if (block_map[[x + dx, y + dy]] === 'sm-cre-hex -unknown') {
        delete block_map[[x + dx, y + dy]]
      }
    })
  })
  return block_map
}

// each of these geometries are [includes, excludes]
// includes and excludes are the dxys which must or must not be of the same type
// 0,0 is not included (because it will always be of same type)
const _2x3 = [
  [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [],
]

const _2x2 = [
  [
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  [[-1, 1]],
]

const _2x1 = [[[1, 0]], []]
const _1x2 = [[[0, 1]], []]
const _1x1 = [[], []] // noop
const GEOMETRIES_BY_TYPE = {
  default: [_2x2, _2x1, _1x2, _1x1],
  crumble: [_2x2, _1x2, _1x1], // never 2x1 because those are usually bridges!
}

const getGroupedBlocks = (room) => {
  /* makes a block_map and recombines it into a series of rects */
  const block_map = getBlocks(room, true)
  const results = []
  const blocks = Object.entries(block_map).map(([sxy, type]) => {
    const [x, y] = sxy.split(',').map(Number)
    block_map[sxy] = { x, y, type, sxy }
    return block_map[sxy]
  })

  const match = (block, includes, excludes = []) => {
    // check and see if blocks with same type match icludes and not excludes
    // if so, create a block of that type and remove them from block_map
    const { x, y, type } = block
    const matched_blocks = [block]
    for (const dxy of includes) {
      // make sure that all blocks of includes exist and are of correct type
      const block2 = block_map[[x + dxy[0], y + dxy[1]]]
      if (block2?.type !== type) {
        return false
      }
      matched_blocks.push(block2)
    }
    for (const dxy of excludes) {
      // make sure any blocks in excludes are not of same type
      const block2 = block_map[(x + dxy[0], y + dxy[1])]
      if (block2?.type === type) {
        return false
      }
    }
    const width = Math.max(...matched_blocks.map((b) => b.x)) - x + 1
    const height = Math.max(...matched_blocks.map((b) => b.y)) - y + 1
    matched_blocks.forEach((b) => delete block_map[b.sxy])
    results.push({ x, y, width, height, type, sxy: block.sxy })
    return true
  }

  sortBy(blocks, ['y', 'x']).forEach((block) => {
    if (!block_map[block.sxy]) {
      return // block was removed in a previous loop
    }
    const type = block.type.split(' -').pop()
    const geometries = GEOMETRIES_BY_TYPE[type] || GEOMETRIES_BY_TYPE.default
    geometries.find(([includes, excludes]) => match(block, includes, excludes))
  })
  return results
}

export default { getBlocks, getGroupedBlocks, findHorizontalRects, findVerticalRects }
