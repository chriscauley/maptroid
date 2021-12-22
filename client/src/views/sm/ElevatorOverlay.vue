<template>
  <template v-if="tool_storage.state.selected.tool === 'elevator'">
    <div :style="style" class="osd-mousetrap" @click="click" @mousemove="mousemove" />
    <div class="osd-mousetrap__cursor" :style="cursor_style" />
  </template>
  <div class="edit-elevator">
    <div v-if="editing">
      {{ editing }}
      <div class="btn -secondary" @click="cancel">Cancel</div>
      <div class="btn -primary" @click="save">Save</div>
    </div>
  </div>
  <svg class="sm-elevator-svg" v-if="!$route.params.zone_slug" v-bind="map_props.svg">
    <line v-for="(line, i) in lines" :key="i" v-bind="line" />
  </svg>
</template>

<script>
import vec from '@/lib/vec'

export default {
  inject: ['map_props', 'tool_storage', 'osd_store'],
  data() {
    return { editing: null, mouse: [0, 0] }
  },
  computed: {
    style() {
      const { _contentSize, _contentFactor } = this.osd_store.viewer.world
      return {
        width: `${(100 * _contentSize.x) / _contentFactor}%`,
        height: `${(100 * _contentSize.y) / _contentFactor}%`,
      }
    },
    cursor_style() {
      return {
        left: `${100 * this.mouse[0]}%`,
        top: `${100 * this.mouse[1]}%`,
      }
    },
    lines() {
      const { elevators = [] } = this.$store.route.world.data
      const lines = []
      elevators
        .filter((e) => e.variant === 'line')
        .forEach((elevator) => {
          let last = elevator.xys[0]
          elevator.xys.slice(1).forEach((xy) => {
            lines.push({
              x1: last[0] + 0.5,
              x2: xy[0] + 0.5,
              y1: last[1] + 0.5,
              y2: xy[1] + 0.5,
              class: 'elevator',
            })
            last = xy
          })
        })
      return lines
    },
  },
  methods: {
    click(event) {
      const xy = this.osd_store.getWorldXY(event)
      const { world } = this.$store.route
      if (!this.editing) {
        const matched = world.data.elevators.find((e) => e.xys.find((xy2) => vec.isEqual(xy, xy2)))
        if (matched) {
          this.editing = matched
          return
        }
        world.data.elevators.push({
          variant: this.tool_storage.state.selected.variant,
          xys: [],
        })
        this.editing = world.data.elevators[world.data.elevators.length - 1]
      }
      if (event.shiftKey) {
        this.editing.xys = this.editing.xys.filter((xy2) => !vec.isEqual(xy, xy2))
      } else {
        this.editing.xys.push(xy)
      }
    },
    mousemove(event) {
      this.mouse = this.osd_store.getWorldXY(event)
    },
    save() {
      this.$store.world.save(this.$store.route.world).then(this.$store.route.refetchWorlds)
      this.editing = null
    },
    cancel() {
      this.editing = null
      this.$store.route.refetchWorlds()
    },
  },
}
</script>

<style>
.osd-mousetrap {
  @apply absolute left-0 top-0;
}
.osd-mousetrap__cursor {
  @apply absolute border border-white border-2 h-full w-full;
  pointer-events: none;
}
.edit-elevator {
  @apply fixed bottom-0 left-0 p-2;
  background: var(--bg);
}
</style>
