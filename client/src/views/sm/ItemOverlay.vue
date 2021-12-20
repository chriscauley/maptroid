<template>
  <div v-for="item in items" :key="item.id" v-bind="item.attrs" @click="(e) => click(e, item)">
    <item-popper v-if="item.id === osd_store.state.selected_item_id" />
  </div>
</template>

<script>
import prepItem from './prepItem'
import ItemPopper from './ItemPopper.vue'

const _percent = (i, room_i) => `${100 * (i / 16 + room_i)}%`

export default {
  components: { ItemPopper },
  inject: ['tool_storage', 'osd_store'],
  props: {
    map_props: Object,
  },
  computed: {
    items() {
      const matched = {}
      this.$store.run.getCurrentRun()?.data.actions.forEach((a) => {
        if (a[0] === 'item') {
          matched[a[1]] = true
        }
      })
      return this.map_props.items.map((item) => ({
        attrs: prepItem(item, this.map_props, matched),
        id: item.id,
      }))
    },
  },
  methods: {
    click(event, item) {
      const { tool } = this.tool_storage.state.selected
      if (tool === 'video_path') {
        const video = this.$store.video.getCurrentVideo()
        if (event.shiftKey) {
          video.data.items = video.data.items.filter((i) => i[0] !== item.id)
        } else {
          video.data.items.push([item.id, this.$store.local.state.current_time])
        }
        this.$store.video.save(video).then(() => {
          this.$store.video.api.markStale()
          this.$store.video.getCurrentVideo()
        })
      } else if (tool === 'run_path') {
        const run = this.$store.run.getCurrentRun()
        run.data.actions = run.data.actions || []
        if (event.shiftKey) {
          run.data.actions = run.data.actions.filter((i) => !(i[0] === 'item' && i[1] === item.id))
          this.$store.run.save(run).then(this.$store.run.refetch)
        } else {
          this.$store.run.addAction(['item', item.id])
        }
      } else if (tool === 'edit_room') {
        window.open(`/djadmin/maptroid/item/${item.id}/`)
      }
    },
  },
}
</script>
