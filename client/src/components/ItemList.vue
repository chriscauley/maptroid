<template>
  <div class="osd-panel item-list">
    <div class="osd-panel__inner">
      <div v-for="bin in item_bins" class="list-group" :key="bin.type">
        <template v-for="item in bin.items" :key="item.id">
          <div class="list-group-item" @click="$emit('select-item', item)">
            <i :class="[bin.icon, obtained[item.id] && '-obtained']" />
            <span class="flex-grow">{{ getName(item) }}</span>
            <i v-if="$auth.user.is_superuser" class="fa fa-pencil" @click="edit(item)" />
            <i :class="`fa fa-checkbox`" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import DreadItems from '@/models/DreadItems'

export default {
  props: {
    zone_items: Object,
    playthrough: Object,
    storage: Object,
  },
  emits: ['select-item'],
  computed: {
    obtained() {
      return {}
    },
    item_bins() {
      const bins = DreadItems.items.map((type) => ({
        type,
        obtained: 0,
        icon: DreadItems.getClass(type),
        items: [],
      }))
      const bins_by_type = {}

      bins.forEach((i) => (bins_by_type[i.type] = i))
      this.zone_items.forEach((item) => {
        const { type } = item.data
        if (!bins_by_type[type]) {
          return
        }
        bins_by_type[type].items.push(item)
      })
      return bins
    },
  },
  methods: {
    getName(item) {
      return DreadItems.getName(item)
    },
    // edit(item) {
    //   console.log('TODO')
    // },
  },
}
</script>
