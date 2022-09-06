<template>
  <router-link
    v-for="item in items"
    :key="item.id"
    v-bind="getAttrs(item)"
    @click.stop="(e) => click(e, item)"
    :to="`?item=${item.id}`"
  >
    <item-popper v-if="item.id === selected_item_id" :item="item" />
  </router-link>
</template>

<script>
import ItemPopper from './ItemPopper.vue'

const _percent = (i, room_i) => `${100 * (i / 16 + room_i)}%`

export default {
  components: { ItemPopper },
  inject: ['map_props', 'tool_storage', 'osd_store'],
  computed: {
    video_items() {
      const { tool } = this.tool_storage.state.selected
      const video_items = {}
      if (tool === 'video_path') {
        const video = this.$store.video.getCurrentVideo()
        video?.data.items.map((item) => (video_items[item[0]] = true))
      }
      return video_items
    },
    items() {
      const { items } = this.map_props
      const { item_type } = this.osd_store.state.filters
      if (item_type) {
        return items.filter((i) => i.data.type === item_type)
      }
      return items
    },
    selected_item_id() {
      return parseInt(this.$route.query.item)
    },
    matched() {
      const matched = {}
      this.$store.run.getCurrentRun()?.data.actions.forEach((a) => {
        if (a[0] === 'item') {
          matched[a[1]] = true
        }
      })
      return matched
    },
  },
  methods: {
    getAttrs(item) {
      const [room_x, room_y] = this.map_props.room_bounds[item.room]
      const [x, y] = item.data.room_xy
      const _class = [...item.attrs.class]
      _class.push(this.matched[item.id] ? '-matched' : '-not-matched')
      _class.push(this.video_items[item.id] ? '-video-matched' : '-not-video-matched')

      return {
        ...item.attrs,
        class: _class,
        style: {
          left: `${100 * (x / 16 + room_x)}%`,
          top: `${100 * (y / 16 + room_y)}%`,
          width: `${100 / 16}%`,
          height: `${100 / 16}%`,
        },
      }
    },
    click(event, item) {
      const { tool } = this.tool_storage.state.selected
      if (tool === 'video_path') {
        const video = this.$store.video.getCurrentVideo()
        const unknown_item = this.$store.video.getNextUnknownItem()
        if (unknown_item) {
          video.data.items.push([item.id, unknown_item.seconds])
        } else if (event.shiftKey) {
          video.data.items = video.data.items.filter((i) => i[0] !== item.id)
        } else {
          video.data.items.push([item.id, this.$store.local.state.current_time])
        }
        this.$store.video.save(video).then(() => {
          this.$store.video.api.markStale()
          this.$store.video.getCurrentVideo()
        })
        event.stopPropagation()
        event.preventDefault()
      } else if (tool === 'run_path') {
        const run = this.$store.run.getCurrentRun()
        run.data.actions = run.data.actions || []
        if (event.shiftKey) {
          run.data.actions = run.data.actions.filter((i) => !(i[0] === 'item' && i[1] === item.id))
          this.$store.run.save(run).then(this.$store.run.refetch)
        } else {
          this.$store.run.addAction(['item', item.id])
        }
        event.stopPropagation()
        event.preventDefault()
      }
    },
  },
}
</script>
