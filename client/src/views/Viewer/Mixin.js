import { range } from 'lodash'
import OpenSeadragon from 'openseadragon'

import Item from '@/models/Item'
import Room from '@/models/Room'

export default {
  data() {
    return {
      viewer: null,
      overzoomed: false,
      current_room: null,
    }
  },
  computed: {
    viewer_events() {
      return {
        open: (event) => {
          this.viewer = event.eventSource
          const p = new OpenSeadragon.Point(2, 2)
          const width = this.viewer.viewport.imageToViewportCoordinates(p).x
          document.body.style.setProperty('--border-width', width + 'px')
          this.onViewerDone?.()
        },
        zoom: (event) => {
          const { world, viewport, drawer } = event.eventSource
          const tiledImage = world.getItemAt(0)
          const targetZoom = tiledImage.source.dimensions.x / viewport.getContainerSize().x
          this.overzoomed = viewport.getZoom() > targetZoom
          drawer.context.imageSmoothingEnabled = !this.overzoomed
          this.$store.viewer.patch({ zoom: viewport.getZoom() })
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
      return ['viewer-wrapper', { '-overzoomed': this.overzoomed }]
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
      const { x, y, width, height } = Item.getMapBounds(item, this.world)
      this.gotoBounds(x, y, width, height)
      this.viewer.addOnceHandler('animation-finish', () =>
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
      const { viewport } = this.viewer
      viewport.fitBounds(viewport.imageToViewportRectangle(bounds))
    },
  },
}
