// TODO I'm moving generic OSD stuff out of the viewer store and into here
// viewer store will most likely become app or editor or something generic like that
import { reactive, markRaw } from 'vue'
import vec from '@/lib/vec'
import OpenSeadragon from 'openseadragon'

const { Point } = (window.OSD = OpenSeadragon)

const PX_PER_GRID = 1
const PX_PER_BLOCK = 17.855
// const PX_PER_BLOCK = 16.5

const roundDreadPixel = (fraction) => {
  const pixels = fraction * 1280
  const rounded_pixels = Math.floor(pixels / PX_PER_GRID) * PX_PER_GRID
  return rounded_pixels / 1280 // rounded_fraction
}

export default ({ store }) => {
  const state = reactive({ _viewer: null, screenshots: [] })

  const osd_store = {
    PX_PER_BLOCK,
    state,
    patch: (data) => Object.assign(state, data),
    // this makes the viewer more accessible and marks it raw
    get viewer() {
      return state._viewer
    },
    set viewer(viewer) {
      // TODO everything except state._viewer=viewer is unecessary as the viewer has methods to get these
      let px = { x: 1, y: 1 }
      let size = px
      if (viewer) {
        const p = new Point(1, 1)
        px = viewer.viewport.imageToViewportCoordinates(p)
        size = viewer.world.getItemAt(0)?.getContentSize() || px
      }
      Object.assign(state, {
        screenshot_count: 0,
        new_count: 0,
        _viewer: viewer ? markRaw(viewer) : viewer,
        px_width: px.x,
        px_height: px.y,
        content_width: size.x,
        content_height: size.y,
      })
    },

    addScreenshots(screenshots) {
      state.screenshots = []
      screenshots.forEach(osd_store.addScreenshot)
    },

    addScreenshot(screenshot) {
      if (!state.contentFactor) {
        state.contentFactor = state._viewer.world._contentFactor
      }
      const osd_item = state._viewer.world._items.find((i) => screenshot.output === i.source.url)
      if (osd_item) {
        return
      }
      if (screenshot.data.zone === undefined) {
        // viewer.world.getItemCount() doesn't update until end of thread so we need to count our own
        const x = 3 + roundDreadPixel(state.new_count % 8)
        const y = roundDreadPixel(0.35 * Math.floor(state.new_count / 8))
        screenshot.data.zone = { raw_xy: [x, y], width: 1, xy: [x, y], group: 7 }
        state.new_count++
      }
      const { xy, width } = screenshot.data.zone
      const url = screenshot.output
      state._viewer.addSimpleImage({ url, x: xy[0], y: xy[1], width, opacity: 1 })
      state.screenshots.push(screenshot)
      state.screenshot_count++
    },

    dragRoom(action, room, client_delta) {
      const scale = 1280 / PX_PER_BLOCK
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
    },

    moveScreenshot(screenshot, client_delta, move_group) {
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
      point.x = roundDreadPixel(point.x)
      point.y = roundDreadPixel(point.y)
      data.zone.xy = [point.x, point.y]
      osd_item.setPosition(point, true)
      store.screenshot.bounceSave(screenshot)

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
          store.screenshot.bounceSave(ss)
        })
      }
    },

    setOpacity(screenshot, value) {
      const osd_item = state._viewer.world._items.find((i) => screenshot.output === i.source.url)
      osd_item.setOpacity(value)
    },

    setAllOpacity(value) {
      state._viewer.world._items.forEach((i) => i.setOpacity(value))
    },

    scaleBlock(block) {
      // The bg is made from fully zoomed in blocks, meaning 1280px is "100%" and 1/2 block is 16px
      // using half blocks since I think that's the smallest possible geometry in dread
      return `${(100 * block * PX_PER_BLOCK) / 1280}%`
    },

    setGroup(screenshot, group) {
      screenshot.data.zone.group = group
      if (!group) {
        delete screenshot.data.zone.group
      }
      store.screenshot.bounceSave(screenshot)
    },
  }

  return osd_store
}
