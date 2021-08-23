<template>
  <unrest-popper class="selected-item" placement="right" offset="0,5">
    {{ item.id }}
    <div>
      x: {{ item.x % 16 }}
      <i class="fa fa-plus" @click="delta({ x: 1 })" />
      {{ ' ' }}
      <i class="fa fa-minus" @click="delta({ x: -1 })" />
    </div>
    <div>
      y: {{ item.y % 16 }}
      <i class="fa fa-plus" @click="delta({ y: 1 })" />
      {{ ' ' }}
      <i class="fa fa-minus" @click="delta({ y: -1 })" />
    </div>
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
import Mousetrap from '@unrest/vue-mousetrap'

export default {
  mixins: [Mousetrap.Mixin],
  data() {
    return { item_types: Item.all }
  },
  computed: {
    mousetrap() {
      return { esc: this.close }
    },
    item() {
      const id = this.$store.viewer.state.selected_item
      return this.$store.item.getOne(id)
    },
    css() {
      return {
        changeType: (item) => ['sm-item', item, { '-selected': this.item.type === item }],
      }
    },
  },
  methods: {
    close() {
      this.$store.viewer.patch({ selected_item: null })
    },
    delta({ x = 0, y = 0 }) {
      this.item.x += x
      this.item.y += y
      this.$store.item.save(this.item)
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
