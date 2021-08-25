<template>
  <unrest-popper class="selected-item" placement="right" offset="0,5">
    {{ item.class }} #{{ item.id }}
    <i class="fa fa-trash" @click="deleteItem" />
    <div :class="`selected-item__picker -${item.class}`">
      <div v-for="type in item_types" :key="type">
        <span :class="css.type(type)" @click="changeType(type)">
          {{ item.class === 'boss' ? type : '' }}
        </span>
      </div>
    </div>
  </unrest-popper>
</template>

<script>
import Item from '@/models/Item'
import { bosses, map_markers } from '@/models'
import Mousetrap from '@unrest/vue-mousetrap'

const types_by_class = {
  item: Item.all,
  boss: bosses,
  map: map_markers,
  chozo: [],
}

export default {
  mixins: [Mousetrap.Mixin],
  computed: {
    item_types() {
      return types_by_class[this.item.class]
    },
    mousetrap() {
      return { esc: this.close }
    },
    item() {
      const id = this.$store.viewer.state.selected_item
      return this.$store.item.getOne(id)
    },
    css() {
      const { type, class: _class } = this.item
      return {
        type: (_type) => [`sm-${_class} -${_type}`, { '-selected': type === _type }],
      }
    },
  },
  methods: {
    close() {
      this.$store.viewer.patch({ selected_item: null })
    },
    changeType(type) {
      this.item.type = type
      this.$store.item.save(this.item)
    },
    deleteItem(e) {
      if (e.ctrlKey) {
        this.$store.item.delete(this.item)
        this.close()
        return
      }
      const confirmDelete = () => {
        this.$ui.alert()
        this.$store.item.delete(this.item)
      }
      this.$ui.alert({
        text: 'Are you sure?',
        actions: [
          { text: 'Cancel', click: () => this.$ui.alert() },
          { text: 'Delete Item', click: confirmDelete, class: 'btn -danger' },
        ],
      })
    },
  },
}
</script>
