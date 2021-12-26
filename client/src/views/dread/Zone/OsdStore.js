import OsdStore from '@/vue-openseadragon/Store'
import Openseadragon from 'openseadragon'

import vec from '@/lib/vec'

const { Point, Rect } = Openseadragon

const PX_PER_GRID = 0.5

export default (component) => {
  const { $store } = component
  const osd_store = OsdStore()
  const { state } = osd_store
  state.selected_item = null

  const getGeometry = () => component.$store.route.zone.data.screenshot

  const _roundDreadPixel = (fraction) => {
    const geo = getGeometry()
    const pixels = fraction * geo.width
    const rounded_pixels = Math.floor(pixels / PX_PER_GRID) * PX_PER_GRID
    return rounded_pixels / geo.width // fraction rounded to nearest pixel
  }

  // TODO this was used to hack geometry... make it a form if needed again
  // window.gg = getGeometry
  const addScreenshots = (screenshots) => {
    osd_store.patch({ screenshot_count: 0, new_count: 0 })
    state.screenshots = []
    screenshots.forEach(_addScreenshot)
  }

  const _addScreenshot = (screenshot) => {
    if (!state.contentFactor) {
      state.contentFactor = state._viewer.world._contentFactor
    }
    const osd_item = state._viewer.world._items.find((i) => screenshot.output === i.source.url)
    if (osd_item) {
      return
    }
    if (screenshot.data.zone === undefined) {
      // viewer.world.getItemCount() doesn't update until end of thread so we need to count our own
      const x = 3 + _roundDreadPixel(state.new_count % 8)
      const y = -10 - _roundDreadPixel(0.35 * Math.floor(state.new_count / 8))
      screenshot.data.zone = { raw_xy: [x, y], width: 1, xy: [x, y], group: 7 }
      state.new_count++
    }
    const { xy, width } = screenshot.data.zone
    const url = screenshot.output
    const index = state.screenshots.length
    state._viewer.addSimpleImage({ url, x: xy[0], y: xy[1], width, opacity: 1, index })
    state.screenshots.push(screenshot)
    state.screenshot_count++
  }

  const dragRoom = (action, room, client_delta) => {
    const geo = getGeometry()
    const scale = geo.width / geo.px_per_block
    if (!room.data.zone) {
      room.data.zone = { raw_bounds: room.data.zone_bounds.map((i) => i / scale) }
    }
    const [raw_x, raw_y, raw_w, raw_h] = room.data.zone.raw_bounds
    let old_point
    if (action === 'move') {
      old_point = new Point(raw_x, raw_y)
    } else if (action === 'resize') {
      old_point = new Point(raw_w, raw_h)
    }
    const new_pixel = state._viewer.viewport.pixelFromPoint(old_point)
    new_pixel.x += client_delta[0]
    new_pixel.y += client_delta[1]
    const new_point = state._viewer.viewport.pointFromPixel(new_pixel)
    if (action === 'move') {
      room.data.zone.raw_bounds[0] = new_point.x
      room.data.zone.raw_bounds[1] = new_point.y
    } else if (action === 'resize') {
      room.data.zone.raw_bounds[2] = new_point.x
      room.data.zone.raw_bounds[3] = new_point.y
    }
    room.data.zone_bounds = room.data.zone.raw_bounds.map((i) => i * scale)
    room.data.zone_bounds = room.data.zone_bounds.map((i) => Math.floor(i))
  }

  const moveScreenshot = (screenshot, client_delta, move_group) => {
    const { output, data } = screenshot

    const osd_item = state._viewer.world._items.find((i) => output === i.source.url)
    const old_xy = data.zone.xy.slice()
    const pixel = osd_item.viewport.pixelFromPoint(
      new Point(data.zone.raw_xy[0], data.zone.raw_xy[1]),
    )
    pixel.x += client_delta.x
    pixel.y += client_delta.y
    const point = osd_item.viewport.pointFromPixel(pixel)
    data.zone.raw_xy[0] = point.x
    data.zone.raw_xy[1] = point.y
    point.x = _roundDreadPixel(point.x)
    point.y = _roundDreadPixel(point.y)
    data.zone.xy = [point.x, point.y]
    osd_item.setPosition(point, true)
    $store.screenshot.bounceSave(screenshot)

    const delta_point = vec.subtract(old_xy, data.zone.xy)
    const { group } = data.zone
    if (group && move_group && vec.magnitude(delta_point)) {
      const group_screenshots = state.screenshots.filter(
        (i) => i.id !== screenshot.id && i.data.zone.group === group,
      )
      group_screenshots.forEach((ss) => {
        const osd_item = state._viewer.world._items.find((i) => ss.output === i.source.url)
        const new_xy = (ss.data.zone.xy = vec.subtract(ss.data.zone.xy, delta_point))
        const new_point = new Point(new_xy[0], new_xy[1])
        osd_item.setPosition(new_point, true)
        ss.data.zone.raw_xy = new_xy.slice()
        $store.screenshot.bounceSave(ss)
      })
    }
  }

  const setOpacity = (screenshot, value) => {
    const osd_item = state._viewer.world._items.find((i) => screenshot.output === i.source.url)
    osd_item.setOpacity(value)
  }

  const setAllOpacity = (value) => {
    state._viewer.world._items.forEach((i) => i.setOpacity(value))
  }

  const scaleBlock = (block) => {
    const geo = getGeometry()
    return `${(100 * block * geo.px_per_block) / geo.width}%`
  }

  const setGroup = (screenshot, group) => {
    screenshot.data.zone.group = group
    if (!group) {
      delete screenshot.data.zone.group
    }
    $store.screenshot.bounceSave(screenshot)
  }

  // TODO this function was a failed attempt at reording screenshots. Remove?
  let bottom = -1
  const sendScreenshotToBottom = (screenshot) => {
    const osd_item = state._viewer.world._items.find((i) => screenshot.output === i.source.url)
    state._viewer.world.setItemIndex(osd_item, bottom--)
    screenshot.zIndex = bottom
  }

  // TODO everything below here can be abstracted for World viewer as well
  const selectItem = (item) => {
    if (!item) {
      delete state.selected_item
    } else {
      state.selected_item = item
    }
  }

  // TODO this will different for world viewer
  const gotoItem = (item) => {
    const geo = getGeometry()
    const scale = geo.width / geo.px_per_block
    const room = component.$store.route.world_rooms.find((r) => r.id === item.room)
    const [x, y, w, h] = room.data.zone_bounds.map((i) => i / scale)
    const b = 0.2
    state._viewer.viewport.fitBounds(new Rect(x - b, y - b, w + 2 * b, h + 2 * b))

    const f = () => selectItem(item)
    const timeout = setTimeout(f, 100)
    state._viewer.addOnceHandler('animation-finish', f)
    state._viewer.addOnceHandler('animation-start', () => clearTimeout(timeout))
  }

  Object.assign(osd_store, {
    getGeometry,
    addScreenshots,
    dragRoom,
    gotoItem,
    moveScreenshot,
    sendScreenshotToBottom,
    setOpacity,
    setAllOpacity,
    scaleBlock,
    selectItem,
    setGroup,
  })

  return osd_store
}
