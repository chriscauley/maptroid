<template>
  <svg v-bind="svg.attrs">
    <defs>
      <marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="3" refY="1.75" orient="auto">
        <polygon points="0 0, 5 1.75, 0 3.5" fill="#0f0" />
      </marker>
    </defs>
    <path v-for="path in svg.paths" v-bind="path" :key="path.id" />
    <path v-if="hovering" v-bind="hovering" />
    <line v-for="(line, i) in lines" :key="i" v-bind="line" marker-end="url(#arrowhead)" />
  </svg>
</template>

<script>
import { sortBy } from 'lodash'
export default {
  inject: ['osd_store', 'tool_storage'],
  props: {
    map_props: Object,
  },
  data() {
    return { hovering: null }
  },
  computed: {
    raw_lines() {
      // combine item and room_xy times into an in order list
      const video = this.$store.video.getCurrentVideo()
      if (!video || this.$route.params.zone_slug) {
        return []
      }
      const xy_times = video.data.room_xys.map(([room_id, screen_xy, time]) => {
        const room_xy = this.map_props.room_offsets[room_id]
        return { xy: [room_xy[0] + screen_xy[0], room_xy[1] + screen_xy[1]], time }
      })

      const items_by_id = {}
      this.$store.route.world_items.forEach((i) => (items_by_id[i.id] = i))
      video.data.items.forEach(([item_id, time]) => {
        const item = items_by_id[item_id]
        if (!item) {
          return
        }
        const room_xy = this.map_props.room_offsets[item.room]
        const item_xy = items_by_id[item_id].data.room_xy.map((i) => Math.floor(i / 16))
        xy_times.push({ xy: [room_xy[0] + item_xy[0], room_xy[1] + item_xy[1]], time })
      })
      return sortBy(xy_times, 'time')
    },
    lines() {
      if (!this.raw_lines?.length) {
        return
      }
      let last_xy = this.raw_lines[0].xy
      return this.raw_lines.slice(1).map(({ xy, _time }) => {
        const shift = Math.sign(xy[0] - last_xy[0] || xy[1] - last_xy[1]) / 16
        const path = {
          x1: last_xy[0] + 0.5 + shift,
          x2: xy[0] + 0.5 + shift,
          y1: last_xy[1] + 0.5 + shift,
          y2: xy[1] + 0.5 + shift,
        }
        last_xy = xy
        return path
      })
    },
    svg() {
      const { map_bounds, zone_offsets, zones } = this.map_props

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
          onClick: (event) => this.click(event, room),
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

      return {
        paths,
        attrs: {
          class: 'sm-room-svg',
          viewBox: map_bounds.join(' '),
          style: {
            height: `${100 * map_bounds[3]}%`,
            width: `${100 * map_bounds[2]}%`,
          },
        },
      }
    },
  },
  methods: {
    click(event, room) {
      const { tool } = this.tool_storage.state.selected
      const { overlap_room } = this.$store.local.state
      if (overlap_room !== room.id && tool === 'edit_room') {
        this.$store.local.save({ overlap_room: room.id })
      }
      if (tool === 'video_path' && !this.$route.params.zone_slug) {
        const [x1, y1] = this.map_props.room_offsets[room.id]
        const [x2, y2] = this.osd_store.getWorldXY(event)
        const video = this.$store.video.getCurrentVideo()
        const x = x2 - x1
        const y = y2 - y1
        if (event.shiftKey) {
          let last_index
          video.data.room_xys.forEach(([id, xy], i) => {
            if (id === room.id && xy[0] === x && xy[1] === y) {
              last_index = i
            }
          })
          video.data.room_xys = video.data.room_xys.filter((_, index) => index !== last_index)
        } else {
          video.data.room_xys.push([room.id, [x, y], this.$store.local.state.current_time])
        }
        this.$store.video.save(video).then(() => {
          this.$store.video.api.markStale()
          this.$store.video.getCurrentVideo()
        })
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
