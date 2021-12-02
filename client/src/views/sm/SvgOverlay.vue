<template>
  <svg v-bind="svg.attrs">
    <path v-for="path in svg.paths" v-bind="path" :key="path.id" />
    <path v-if="hovering" v-bind="hovering" />
  </svg>
</template>

<script>
export default {
  inject: ['tool_storage'],
  data() {
    return { hovering: null }
  },
  computed: {
    svg() {
      const world_bounds = [0, 0, 0, 0]
      const zone_offsets = {}

      let zones = this.$store.route.zones
      if (this.$route.params.zone_slug) {
        const { zone } = this.$store.route
        zones = [zone]
        const [_x, _y, width, height] = zone.data.world.bounds
        world_bounds[2] = width
        world_bounds[3] = height
        zone_offsets[zone.id] = [0, 0]
      } else {
        zones
          .filter((z) => !z.data.hidden)
          .forEach((zone) => {
            const [x, y, width, height] = zone.data.world.bounds
            world_bounds[2] = Math.max(width + x, world_bounds[2])
            world_bounds[3] = Math.max(height + y, world_bounds[3])
            zone_offsets[zone.id] = [x, y]
          })
      }

      const zone_slugs = {}
      zones.forEach((zone) => (zone_slugs[zone.id] = zone.slug))

      const paths = []
      const getD = (shape, dx, dy) => {
        const _d = (points) => {
          points = points.map((p) => [p[0] + dx, p[1] + dy])
          points.push(points[0])
          const ls = points.map((p) => `L ${p}`)
          return `M ${points[points.length - 2]} ${ls}`
        }
        return `${_d(shape.exterior)} ${shape.interiors.map(_d).join(' ')}`
      }

      this.$store.route.world_rooms.forEach((room) => {
        if (!zone_offsets[room.zone] || room.data.hidden) {
          return
        }
        const [dx, dy] = zone_offsets[room.zone]
        const outer_ds = room.data.geometry.outer.map((shape) =>
          getD(shape, room.data.zone.bounds[0] + dx, room.data.zone.bounds[1] + dy),
        )
        const path = {
          id: `room-outer__${room.id}`,
          class: `-outer -zone-${zone_slugs[room.zone]}`,
          d: outer_ds.join(' '),
          onMouseenter: () => this.hover(path),
          onMouseleave: () => this.blur(path),
          onClick: () => this.click(room),
        }
        paths.push(path)

        const inner_ds = room.data.geometry.inner.map((shape) =>
          getD(shape, room.data.zone.bounds[0] + dx, room.data.zone.bounds[1] + dy),
        )
        paths.push({
          id: `room-inner__${room.id}`,
          class: `-inner -zone-${zone_slugs[room.zone]}`,
          d: inner_ds.join(' '),
        })
      })

      const [_x, _y, width, height] = world_bounds
      return {
        paths,
        attrs: {
          class: 'sm-room-svg',
          viewBox: world_bounds.join(' '),
          style: {
            height: `${100 * height}%`,
            width: `${100 * width}%`,
          },
        },
      }
    },
  },
  methods: {
    click(room) {
      const { tool } = this.tool_storage.state.selected
      const { overlap_room } = this.$store.local.state
      if (overlap_room !== room.id && tool === 'edit_room') {
        this.$store.local.save({ overlap_room: room.id })
      }
    },
    hover(path) {
      this.hovering = path
    },
    blur() {
      this.hovering = null
    },
  },
}
</script>
