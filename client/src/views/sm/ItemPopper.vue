<template>
  <unrest-popper placement="bottom" :watchme="osd_store.state.zoom">
    <div class="item-popper" @click.stop.prevent>
      <div class="item-popper__name">{{ item.attrs.title }}</div>
      <div v-if="$auth.user?.is_superuser">
        <a :href="`/djadmin/maptroid/item/${item.id}/`" class="link" @click.stop>
          Item Admin
        </a>
        <div
          v-for="status in statuses"
          :key="status"
          :class="['btn', item.data[status] ? '-primary' : '-secondary']"
          @click="(e) => click(e, status)"
        >
          {{ item.data[status] ? 'Is' : 'Not' }} {{ status }}
        </div>
      </div>
    </div>
  </unrest-popper>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {
  inject: ['osd_store'],
  props: {
    item: Object,
  },
  data() {
    return { statuses: ['duplicate'] }
  },
  methods: {
    click(event, status) {
      if (!(event.shiftKey && event.ctrlKey)) {
        this.$ui.toast.error('Must hold ctrl + shift')
        return
      }
      const item = cloneDeep(this.item)
      if (item.data[status]) {
        delete item.data[status]
      } else {
        item.data[status] = true
      }

      this.$store.item.save(item).then(this.$store.route.refetchItems)
      return
    },
  },
}
</script>
