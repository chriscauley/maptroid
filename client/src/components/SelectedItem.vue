<template>
  <unrest-popper class="selected-item" placement="right" offset="0,5">
    {{ item.id }}
    <i class="fa fa-trash" @click="deleteItem" />
    <div class="selected-item__picker">
      <div v-for="type in item_types" :key="type">
        <span :class="css.changeType(type)" @click="changeType(type)" />
      </div>
    </div>
  </unrest-popper>
</template>

<script>
import Item from '@/models/Item'

export default {
  data() {
    return { item_types: Item.all }
  },
  computed: {
    item() {
      const id = this.$store.viewer.state.selected_item
      return this.$store.item.getOne(id)
    },
    css() {
      return {
        changeType: (item) => ['sm-item', item, { '-selected': this.item.kind === item }],
      }
    },
  },
  methods: {
    changeType(type) {
      this.item.kind = type
      this.$store.item.save(this.item)
    },
    deleteItem(e) {
      if (e.ctrlKey) {
        this.$store.item.delete(this.item)
        this.$store.viewer.patch({ selected_item: null })
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
