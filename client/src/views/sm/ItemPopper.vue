<template>
  <unrest-popper placement="bottom" :watchme="osd_store.state.zoom">
    <div class="item-popper" @click.stop.prevent>
      <div class="item-popper__name">{{ item.attrs.title }}</div>
      <div v-if="$auth.user?.is_superuser">
        <a :href="`/djadmin/maptroid/item/${item.id}/`" class="link" @click.stop>
          Item Admin
        </a>
        <label class="item-popper__duplicate">
          Duplicate of:
          <input v-model="duplicate_of" @input="updateDuplicate" />
        </label>
        <div
          v-for="status in statuses"
          :key="status"
          :class="['btn', item.data[status] ? '-primary' : '-secondary']"
          @click="(e) => toggleStatus(e, status)"
        >
          {{ item.data[status] ? 'Is' : 'Not' }} {{ status }}
        </div>
        <div v-if="location_choices">
          <select :value="item.data.location_name" @change="changeLocation">
            <option value="">NONE</option>
            <option v-for="c in location_choices" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>
    </div>
  </unrest-popper>
</template>

<script>
import { debounce, cloneDeep } from 'lodash'

export default {
  inject: ['osd_store'],
  props: {
    item: Object,
  },
  data() {
    return { statuses: ['duplicate', 'hidden'], duplicate_of: this.item.data.duplicate_of }
  },
  computed: {
    location_choices() {
      const { location_names } = this.$store.route.world.data
      if (!location_names) {
        return
      }
      location_names.sort()
      const used = {}
      this.$store.route.world_items.forEach((i) => {
        used[i.data.location_name] = true
      })
      if (this.item.data.location_name) {
        delete used[this.item.data.location_name]
      }
      return location_names.filter((i) => !used[i])
    },
  },
  methods: {
    updateDuplicate() {
      const { item } = this
      item.data.duplicate_of = parseInt(this.duplicate_of)
      const match = (i) => i.id === item.data.duplicate_of
      const target_item = this.$store.route.world_items.find(match)
      if (!target_item) {
        delete item.data.duplicate_of
      }
      this.bounceSave()
    },
    bounceSave: debounce(function() {
      this.$store.item.save(this.item).then(this.$store.route.refetchItems)
    }, 1000),
    toggleStatus(event, status) {
      const { item } = this
      if (!(event.shiftKey && event.ctrlKey)) {
        this.$ui.toast.error('Must hold ctrl + shift')
        return
      }
      if (item.data[status]) {
        delete item.data[status]
      } else {
        item.data[status] = true
      }

      this.$store.item.save(item)
    },
    changeLocation(event) {
      const item = cloneDeep(this.item)
      item.data.location_name = event.target.value
      this.$store.item.save(item)
    },
  },
}
</script>
