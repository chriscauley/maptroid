<template>
  <unrest-popper class="selected-item" placement="right" offset="0,5" :target="target">
    {{ item.class }} #{{ item.id }}
    <i class="fa fa-trash" @click="deleteItem" />
    <div :class="`selected-item__picker -${item.class}`">
      <div v-for="type in item_types" :key="type">
        <span :class="css.type(type)" @click="changeType(type)">
          {{ item.class === 'boss' ? type : '' }}
        </span>
      </div>
    </div>
    <hr />
    <div>
      <span class="btn-group">
        <i
          v-for="(dxy, name) in dxyByName"
          :class="`btn -primary -mini fa fa-arrow-${name}`"
          :key="name"
          @click="moveItem(dxy)"
        />
      </span>
      {{ ' ' }}
      <span title="Coordinates of item on screen">{{ item.screen_xy.join(',') }}</span>
      @
      <span title="Coordinates of screen on world">{{ item.world_xy.join(',') }}</span>
    </div>
  </unrest-popper>
</template>

<script>
import mod from '@/lib/mod'
import vec from '@/lib/vec'
import Item from '@/models/Item'
import { bosses, map_markers, doors } from '@/models'
import Mousetrap from '@unrest/vue-mousetrap'

const types_by_class = {
  item: Item.all,
  boss: bosses,
  map: map_markers,
  chozo: [],
  door: doors,
}

export default {
  mixins: [Mousetrap.Mixin],
  props: {
    world: Object,
  },
  data() {
    const { dxyByName } = vec
    return { dxyByName }
  },
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
    target() {
      return document.getElementById('overlay-item-' + this.item.id)
    },
  },
  methods: {
    moveItem(dxy) {
      this.item.screen_xy = vec.add(this.item.screen_xy, dxy)
      const max_xy = this.world.map_screen_size / this.world.map_item_size
      const dimensions = [0, 1]
      dimensions.forEach((i) => {
        if (this.item.screen_xy[i] === -1) {
          this.item.world_xy[i]--
        } else if (this.item.screen_xy[i] === max_xy) {
          this.item.world_xy[i]++
        }
        this.item.screen_xy[i] = mod(this.item.screen_xy[i], max_xy)
      })
      this.$store.item.save(this.item)
    },
    close() {
      this.$store.viewer.patch({ selected_item: null })
    },
    changeType(type) {
      this.item.type = type
      this.$store.item.save(this.item)
    },
    deleteItem(e) {
      const confirmDelete = () => {
        this.$ui.alert()
        this.$store.item.delete(this.item)
        this.close()
      }
      if (e.ctrlKey) {
        confirmDelete()
        return
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
