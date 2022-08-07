<template>
  <div class="geometry-editor">
    <div v-if="error" class="geometry-editor__error">
      Unable to load geometry editor because: <br />
      {{ error }}
    </div>
    <template v-else>
      <svg :viewBox="svg_viewbox">
        <path v-for="(path, i) in paths" :key="i" v-bind="path" />
      </svg>
      <div v-for="(dot, i) in dots" :key="i" v-bind="dot" />
      <teleport v-if="dirty" to="#edit-room__actions">
        <div class="btn -primary" @click="save">Save Geometry</div>
        {{ mod }}
      </teleport>
    </template>
  </div>
</template>

<script>
import Mousetrap from '@unrest/vue-mousetrap'
import { cloneDeep, isEqual, range } from 'lodash'

export default {
  mixins: [Mousetrap.Mixin],
  props: {
    room: Object,
  },
  emits: ['save'],
  data() {
    const temporary = cloneDeep(this.getStoredGeometry())
    return { temporary, hovering: null, mod: 1 }
  },
  computed: {
    error() {
      const { outer = [] } = this.room.data.geometry
      if (outer.length === 0) {
        return 'Room does not have any geometry. Run script 6'
      } else if (outer.length > 1) {
        return 'Room has multiple geometries. Split room first.'
      }
      return null
    },
    mousetrap() {
      return {
        '1,2,3,4,5,6,7,8,9': (e) => (this.mod = parseInt(e.key)),
      }
    },
    dirty() {
      return !isEqual(this.temporary, this.getStoredGeometry())
    },
    dots() {
      const [_x, _y, w, h] = this.room.data.zone.bounds
      const dots = []
      const mod = this.mod
      range(w).forEach((x_screen) => {
        range(h).forEach((y_screen) => {
          range(mod).forEach((di) => {
            dots.push([x_screen + di / mod, y_screen])
            dots.push([x_screen, y_screen + di / mod])
          })
        })
      })
      range(mod).forEach((di) => {
        range(w).forEach((x_screen) => dots.push([x_screen+di/mod, h]))
        range(h).forEach((y_screen) => dots.push([w, y_screen+di/mod]))
      })
      dots.push([w, h])
      return dots.map(([x, y]) => ({
        xy: [x, y],
        class: ['geometry-editor__dot', x % 1 || y % 1 ? '-minor' : '-major'],
        style: {
          top: `${y * 256}px`,
          left: `${x * 256}px`,
        },
        onClick: (e) => this.click(e, [x, y]),
        onMouseover: () => (this.hovering = [x, y]),
        onMouseout: () => (this.hovering = null),
      }))
    },
    svg_viewbox() {
      const [_x, _y, w, h] = this.room.data.zone.bounds
      return `0 0 ${w} ${h}`
    },
    paths() {
      if (!this.temporary.length) {
        return
      }
      const _d = (points) => `M ${points.map((p) => p.join(',')).join(' L ')}`
      const paths = [
        {
          d: _d(this.temporary.slice()),
          stroke: this.dirty ? 'yellow' : 'green',
        },
      ]
      if (this.hovering) {
        const [x, y] = this.hovering
        const index = this.temporary.findIndex((xy2) => xy2[0] === x && xy2[1] === y)
        if (index !== -1) {
          paths.push({
            stroke: 'red',
            d: _d(this.temporary.slice(index)),
          })
        }
      }
      return paths
    },
  },
  methods: {
    getStoredGeometry() {
      const { data } = this.room
      return data.geometry_override || data.geometry.outer[0].exterior
    },
    click(e, xy) {
      if (e.shiftKey) {
        const index = this.temporary.findIndex((xy2) => xy2[0] === xy[0] && xy2[1] === xy[1])
        if (index === 0) {
          this.temporary = []
        } else if (index !== -1) {
          this.temporary = this.temporary.slice(0, index + 1)
        }
      } else {
        this.temporary.push(xy)
      }
    },
    save() {
      this.room.data.geometry_override = this.temporary // eslint-disable-line
      this.$store.room.save(this.room).then(this.$store.route.refetchRooms)
    },
  },
}
</script>
