import { range, sortBy } from 'lodash'

const doors_direction_to_dxys = {
  up: range(4).map((i) => [i, 0]),
  down: range(4).map((i) => [i, 0]),
  left: range(4).map((i) => [0, i]),
  right: range(4).map((i) => [0, i]),
}

const getBlocks = (room) => {
  // Combines cre_hex, cre_overrides into a block_map { [xy]: type }
  // removes doors and samus-eaters (form plm_overrides)
  const block_map = {}
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
    const _class = `sm-block -${name}`
    range(w).forEach((dx) => {
      range(h).forEach((dy) => (block_map[[x + dx, y + dy]] = _class))
    })
  })
  Object.values(room.data.doors || {}).forEach(([x, y, direction]) => {
    doors_direction_to_dxys[direction].forEach(([dx, dy]) => {
      delete block_map[[x + dx, y + dy]]
    })
  })
  return block_map
}

const getGroupedBlocks = (room) => {
  /* makes a block_map and recombines it into a series of rects */
  const block_map = getBlocks(room)
  const results = []
  const blocks = Object.entries(block_map).map((sxy, type) => {
    const [x, y] = sxy.split(',').map(Number)
    return { x, y, type, sxy }
  })

  const match = (block, includes, excludes = []) => {
    // check and see if blocks with same type match icludes and not excludes
    // if so, create a block of that type and remove them from block_map
    const matched_blocks = [block]
    for (const dxy of includes) {
      // make sure that all blocks of includes exist and are of correc type
      const block2 = block_map[(block.x + dxy[0], block.y + dxy[1])]
      if (block2?.type !== block.type) {
        return false
      }
      matched_blocks.push(block2)
    }
    for (const dxy of excludes) {
      // make sure any blocks in excludes are not of same type
      const block2 = block_map[(block.x + dxy[0], block.y + dxy[1])]
      if (block2?.type === block.type) {
        return false
      }
    }
    const { x, y, type } = block
    const width = Math.min(...matched_blocks.map((b) => b.x - x + 1))
    const height = Math.min(...matched_blocks.map((b) => b.y - y + 1))
    matched_blocks.forEach((b) => delete block_map[b.sxy])
    results.push({ x, y, width, height, type })
    return true
  }

  const geometries = [
    [
      [
        [0, 1],
        [1, 0],
        [1, 1],
      ],
      [[-1, 1]],
    ], // 2x2
    [[[1, 0]], []], // 2x1
    [[[0, 1]], []], // 1x2
  ]

  sortBy(blocks, ['y', 'x']).forEach((block) => {
    if (!block_map[block.sxy]) {
      return // block was removed in a previous loop
    }
    geometries.find(([includes, excludes]) => match(block, includes, excludes))
  })
}

export default { getBlocks, getGroupedBlocks }
