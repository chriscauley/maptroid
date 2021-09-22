import { range } from 'lodash'
import OpenSeadragon from 'openseadragon'

import Item from '@/models/Item'
import Room from '@/models/Room'

export default {
  data() {
    return { current_room: null }
  },
  computed: {
    viewer_events() {
      return {
        open: (event) => {
          this.$store.osd.viewer = event.eventSource
          const border_width = 2 * this.$store.osd.state.px_width
          document.body.style.setProperty('--border-width', border_width + 'px')
          this.onViewerDone?.()
        },
        zoom: (event) => {
          const { world, viewport, drawer } = event.eventSource
          const tiledImage = world.getItemAt(0)
          const target_zoom = tiledImage.source.dimensions.x / viewport.getContainerSize().x
          const viewport_zoom = viewport.getZoom()
          const image_zoom = Math.floor(viewport_zoom / target_zoom)
          drawer.context.imageSmoothingEnabled = image_zoom < 1
          this.$store.osd.patch({ viewport_zoom, image_zoom })
        },
      }
    },
    viewer_options() {
      return {
        tileSources: [this.world.dzi], // from WorldMixin
        // tileSources: { type: 'image', url: 'SuperMetroidMapZebes.png' },
        maxZoomPixelRatio: 8,
        showNavigator: true,
        showZoomControl: false,
        showHomeControl: false,
        showFullPageControl: false,
        showRotationControl: false,
        debugmode: false,
        clickTimeThreshold: 1000,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: false,
        },
        ...this.getViewerOptions(),
      }
    },
    viewer_class() {
      // TODO only used in editor
      const overzoomed = this.$store.osd.state.image_zoom > 1
      return ['viewer-wrapper', { '-overzoomed': overzoomed }]
    },
    visible_xys() {
      // TODO only in viewer
      const [x, y, width, height] = Room.getBounds(this.current_room)
      const out = []
      range(x, x + width).forEach((x) => range(y, y + height).forEach((y) => out.push([x, y])))
      return out
    },
  },
  methods: {
    getViewerOptions() {
      return {}
    },
    gotoItem(item) {
      // TODO move to viewer store
      const { x, y, width, height } = Item.getMapBounds(item, this.world)
      this.gotoBounds(x, y, width, height)
      this.$store.osd.viewer.addOnceHandler('animation-finish', () =>
        this.$store.viewer.patch({ selected_item: item.id }),
      )
    },
    gotoRoom(room) {
      const [x, y, width, height] = Room.getMapBounds(room, this.world)
      this.gotoBounds(x, y, width, height)
      this.current_room = room
    },
    gotoBounds(x, y, width, height) {
      const b = 64
      const bounds = new OpenSeadragon.Rect(x - b, y - b, width + b * 2, height + b * 2)
      const { viewport } = this.$store.osd.viewer
      viewport.fitBounds(viewport.imageToViewportRectangle(bounds))
    },
  },
}
