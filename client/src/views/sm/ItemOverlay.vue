<template>
  <div v-for="item in items" :key="item.id" v-bind="item.attrs" @click="(e) => click(e, item)" />
</template>

<script>
import prepItem from './prepItem'

const _percent = (i, room_i) => `${100 * (i / 16 + room_i)}%`

export default {
  inject: ['tool_storage'],
  props: {
    map_props: Object,
  },
  computed: {
    items() {
      return this.map_props.items.map((item) => ({
        attrs: prepItem(item, this.map_props),
        id: item.id,
      }))
    },
  },
  methods: {
    click(event, item) {
      if (this.tool_storage.state.selected.tool === 'video_path') {
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
      }
    },
  },
}
</script>
