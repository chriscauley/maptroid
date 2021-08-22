<template>
  <unrest-popper class="selected-item" placement="right" offset="0,5">
    {{ item.id }}
    <i class="fa fa-trash" @click="deleteItem" />
  </unrest-popper>
</template>

<script>
export default {
  computed: {
    item() {
      const id = this.$store.viewer.state.selected
      return this.$store.item.getOne(id)
    },
  },
  methods: {
    deleteItem(e) {
      if (e.ctrlKey) {
        this.$store.item.delete(this.item)
        this.$store.viewer.patch({ selected: null })
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
