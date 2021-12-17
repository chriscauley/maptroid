<template>
  <div class="inventory2">
    <div v-for="group in groups" :key="group.name" class="inventory2__row">
      <span v-for="item in group.items" :key="item.type" class="inventory2__item">
        <span :class="item.icon" /> {{ item.text }}
      </span>
    </div>
  </div>
</template>

<script>
import DreadItems from '@/models/DreadItems'
import Item from '@/models/Item'

export default {
  computed: {
    groups() {
      const { world_items, world } = this.$store.route
      const video = this.$store.video.getCurrentVideo()
      const run = this.$store.run.getCurrentRun()

      if (this.$route.params.world_slug === 'dread') {
        return DreadItems.groupItems(world_items, video.data.actions)
      }

      const actions = run?.data.actions || video?.data.actions || []
      return Item.groupItems(world, world_items, actions)
    },
  },
}
</script>
