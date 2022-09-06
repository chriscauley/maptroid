<template>
  <svg v-bind="svg.attrs">
    <defs>
      <marker
        id="white-arrowhead"
        markerWidth="5"
        markerHeight="3.5"
        refX="3"
        refY="1.75"
        orient="auto"
      >
        <polygon points="0 0, 5 1.75, 0 3.5" fill="#fff" />
      </marker>
      <marker
        id="green-arrowhead"
        markerWidth="5"
        markerHeight="3.5"
        refX="3"
        refY="1.75"
        orient="auto"
      >
        <polygon points="0 0, 5 1.75, 0 3.5" fill="#0f0" />
      </marker>
      <marker
        id="red-arrowhead"
        markerWidth="7.5"
        markerHeight="5.25"
        refX="3"
        refY="1.75"
        orient="auto"
      >
        <polygon points="0 0, 5 1.75, 0 3.5" fill="#f00" />
      </marker>
    </defs>
    <path v-for="path in svg.paths" v-bind="path" :key="path.id" />
    <path v-if="hovering" v-bind="hovering" />
    <line v-for="(line, i) in run_lines" :key="i" v-bind="line" />
    <line v-if="one_line" v-bind="one_line" />
  </svg>
</template>

<script>
import { sortBy } from 'lodash'
export default {
  inject: ['map_props', 'osd_store', 'tool_storage'],
  props: {
    highlighted_rooms: Array,
    storage: Object,
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
        const room_xy = this.map_props.room_bounds[room_id]
        return { xy: [room_xy[0] + screen_xy[0], room_xy[1] + screen_xy[1]], time }
      })

      const items_by_id = {}
      this.$store.route.world_items.forEach((i) => (items_by_id[i.id] = i))
      video.data.items.forEach(([item_id, time]) => {
        const item = items_by_id[item_id]
        if (!item) {
          return
        }
        const room_xy = this.map_props.room_bounds[item.room]
        const item_xy = items_by_id[item_id].data.room_xy.map((i) => Math.floor(i / 16))
        xy_times.push({ xy: [room_xy[0] + item_xy[0], room_xy[1] + item_xy[1]], time })
      })
      return sortBy(xy_times, 'time')
    },

    raw_run_lines() {
      // combine item and room_xy times into an in order list
      const run = this.$store.run.getCurrentRun()
      if (!run || this.$route.params.zone_slug) {
        return []
      }
      const items_by_id = {}
      this.$store.route.world_items.forEach((i) => (items_by_id[i.id] = i))
      const xy_times = []
      run.data.actions.forEach((args) => {
        if (args[0] === 'item') {
          const item_id = args[1]
          const item = items_by_id[item_id]
          if (!item) {
            return
          }
          const room_xy = this.map_props.room_bounds[item.room]
          const item_xy = items_by_id[item_id].data.room_xy.map((i) => Math.floor(i / 16))
          xy_times.push({ xy: [room_xy[0] + item_xy[0], room_xy[1] + item_xy[1]] })
        } else {
          const [_action, room_id, screen_xy] = args
          const room_xy = this.map_props.room_bounds[room_id]
          xy_times.push({ xy: [room_xy[0] + screen_xy[0], room_xy[1] + screen_xy[1]] })
        }
      })

      return xy_times.filter(Boolean)
    },

    run_lines() {
      if (!this.storage.state.show_route) {
        return []
      }
      let { raw_lines } = this
      if (this.tool_storage.state.selected.tool === 'run_path') {
        raw_lines = this.raw_run_lines
      }
      if (!raw_lines?.length) {
        return []
      }
      let last_xy = raw_lines[0].xy
      const active_index = this.$store.local.state.insert_run_action_after || raw_lines.length - 1
      return raw_lines.slice(1).map(({ xy, _time }, i) => {
        const shift = Math.sign(xy[0] - last_xy[0] || xy[1] - last_xy[1]) / 16
        const path = {
          x1: last_xy[0] + 0.5 + shift,
          x2: xy[0] + 0.5 + shift,
          y1: last_xy[1] + 0.5 + shift,
          y2: xy[1] + 0.5 + shift,
          class: ['run', i === active_index && '-highlight'],
        }
        last_xy = xy
        return path
      })
    },
    svg() {
      const { zone_offsets, zones } = this.map_props

      const zone_slugs = {}
      zones.forEach((zone) => (zone_slugs[zone.id] = zone.slug.split('__')[0]))

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
        if (!room.data.geometry?.inner) {
          return // room needs to be processed server side
        }
        if (!zone_offsets[room.zone] || room.data.hidden) {
          return
        }
        const [dx, dy] = zone_offsets[room.zone]
        const outer_ds = room.data.geometry.outer.map((shape) =>
          getD(shape, room.data.zone.bounds[0] + dx, room.data.zone.bounds[1] + dy),
        )
        const path = {
          id: `room-outer__${room.id}`,
          class: [
            `-outer -zone-${zone_slugs[room.zone]}`,
            this.highlighted_rooms.includes(room.id) && '-highlight',
          ],
          d: outer_ds.join(' '),
          onMouseenter: () => this.hover(path),
          onMouseleave: () => this.blur(path),
          onClick: (event) => this.click(event, room),
        }
        paths.push(path)
      })

      return {
        paths,
        attrs: {
          ...this.map_props.svg,
          class: 'sm-room-svg',
        },
      }
    },
    one_line() {
      const selected_item_id = parseInt(this.$route.query.item)
      let selected_item = this.map_props.items.find((i) => i.id === selected_item_id)
      let target_item
      if (selected_item?.data.duplicate_of) {
        target_item = this.map_props.items.find((i) => i.id === selected_item.data.duplicate_of)
      } else if (selected_item) {
        target_item = this.map_props.items.find((i) => i.data.duplicate_of === selected_item_id)
        ;[selected_item, target_item] = [target_item, selected_item] // switch direction
      }

      if (target_item && selected_item) {
        const xy1 = this.getItemXY(selected_item)
        const xy2 = this.getItemXY(target_item)
        return {
          x1: xy1[0],
          x2: xy2[0],
          y1: xy1[1],
          y2: xy2[1],
          class: 'one-line',
        }
      }
      return null
    },
  },
  methods: {
    click(event, room) {
      const { tool } = this.tool_storage.state.selected
      const { editing_room } = this.$store.local.state
      if (editing_room !== room.id && tool === 'edit_room') {
        this.$store.local.save({ editing_room: room.id })
      }
      if (tool === 'video_path' && !this.$route.params.zone_slug) {
        const [x1, y1] = this.map_props.room_bounds[room.id]
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
      if (tool === 'run_path' && !this.$route.params.zone_slug) {
        const [x1, y1] = this.map_props.room_bounds[room.id]
        const [x2, y2] = this.osd_store.getWorldXY(event)
        const x = x2 - x1
        const y = y2 - y1
        if (event.shiftKey) {
          this.$store.run.removeLastActionAtXY([x, y], room)
        } else {
          this.$store.run.addAction(['room_xy', room.id, [x, y]])
        }
      }
    },
    hover(path) {
      this.hovering = path
    },
    blur() {
      this.hovering = null
    },
    getItemXY(item) {
      const [room_x, room_y] = this.map_props.room_bounds[item.room]
      const [item_x, item_y] = item.data.room_xy
      return [room_x + item_x / 16, room_y + item_y / 16]
    },
  },
}
</script>
