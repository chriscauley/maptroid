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
  const state = reactive({ _viewer: null, images: [] })

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
        image_count: 0,
        new_count: 0,
        _viewer: viewer ? markRaw(viewer) : viewer,
        px_width: px.x,
        px_height: px.y,
        content_width: size.x,
        content_height: size.y,
      })
    },
    addImage(image) {
      if (!state.contentFactor) {
        state.contentFactor = state._viewer.world._contentFactor
      }
      const osd_item = state._viewer.world._items.find((i) => image.output === i.source.url)
      if (osd_item) {
        return
      }
      if (image.data._world === undefined) {
        // viewer.world.getItemCount() doesn't update until end of thread so we need to count our own
        const x = 3 + roundDreadPixel(state.new_count % 8)
        const y = roundDreadPixel(0.35 * Math.floor(state.new_count / 8))
        image.data._world = { raw_xy: [x, y], width: 1, xy: [x, y], group: 7 }
        state.new_count++
      }
      const { xy, width } = image.data._world
      state._viewer.addSimpleImage({ url: image.output, x: xy[0], y: xy[1], width, opacity: 1 })
      state.images.push(image)
      state.image_count++
    },

    dragRoom(action, room, client_delta) {
      const scale = 1280 / PX_PER_BLOCK
      if (!room.data._world) {
        room.data._world = { raw_bounds: room.data.zone_bounds.map((i) => i / scale) }
      }
      const [raw_x, raw_y, raw_w, raw_h] = room.data._world.raw_bounds
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
        room.data._world.raw_bounds[0] = new_point.x
        room.data._world.raw_bounds[1] = new_point.y
      } else if (action === 'resize') {
        room.data._world.raw_bounds[2] = new_point.x
        room.data._world.raw_bounds[3] = new_point.y
      }
      room.data.zone_bounds = room.data._world.raw_bounds.map((i) => i * scale)
      room.data.zone_bounds = room.data.zone_bounds.map((i) => Math.floor(i))
    },

    moveImage(image, client_delta, move_group) {
      const osd_item = state._viewer.world._items.find((i) => image.output === i.source.url)
      const old_xy = image.data._world.xy.slice()
      const pixel = osd_item.viewport.pixelFromPoint(
        new Point(image.data._world.raw_xy[0], image.data._world.raw_xy[1]),
      )
      pixel.x += client_delta.x
      pixel.y += client_delta.y
      const point = osd_item.viewport.pointFromPixel(pixel)
      image.data._world.raw_xy[0] = point.x
      image.data._world.raw_xy[1] = point.y
      point.x = roundDreadPixel(point.x)
      point.y = roundDreadPixel(point.y)
      image.data._world.xy = [point.x, point.y]
      osd_item.setPosition(point, true)
      store.screenshot.bounceSave(image)
      // console.warn('TODO debounced save image')

      const delta_point = vec.subtract(old_xy, image.data._world.xy)
      const { group } = image.data._world
      if (group && move_group && vec.magnitude(delta_point)) {
        const images = state.images.filter(
          (i) => i.id !== image.id && i.data._world.group === group,
        )
        images.forEach((image) => {
          const osd_item = state._viewer.world._items.find((i) => image.output === i.source.url)
          const new_xy = (image.data._world.xy = vec.subtract(image.data._world.xy, delta_point))
          const new_point = new Point(new_xy[0], new_xy[1])
          osd_item.setPosition(new_point, true)
          image.data._world.raw_xy = new_xy.slice()
          store.screenshot.bounceSave(image)
        })
      }
    },

    setOpacity(image, value) {
      const osd_item = state._viewer.world._items.find((i) => image.output === i.source.url)
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

    setGroup(image, group) {
      image.data._world.group = group
      if (!group) {
        delete image.data._world.group
      }
      store.screenshot.bounceSave(image)
    },
  }

  return osd_store
}
