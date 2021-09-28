<template>
  <div v-if="worlds && rooms">
    <div class="screenshot-viewer__row" v-for="room in rooms" :key="room.id">
      <div v-for="layer in layers" :key="layer" v-show="active_layer === layer">
        <img :src="getRoomSrc(room, layer)" @click="nextLayer" />
      </div>
    </div>
  </div>
</template>

<script>
import Mousetrap from '@unrest/vue-mousetrap'

export default {
  __route: {
    path: '/screenshot-viewer/',
  },
  mixins: [Mousetrap.Mixin],
  data() {
    return { active_layer: 'bts' }
  },
  computed: {
    mousetrap() {
      return { '1,2,3,4': this.toggleLayer }
    },
    layers() {
      return ['bts', 'layer-1', 'layer-2', 'plm_enemies']
    },
    rooms() {
      return this.$store.room2.getPage()?.items
    },
    worlds() {
      return this.$store.world2.getPage()?.items
    },
  },
  methods: {
    getRoomSrc(room, layer) {
      const world = this.worlds.find(w => w.id === room.world_id)
      return `/static/smile_exports/${world.slug}/${layer}/${room.key}`
    },
    nextLayer() {
      const index = this.layers.indexOf(this.active_layer) + 1
      this.active_layer = this.layers[index % this.layers.length]
    },
    toggleLayer(e) {
      this.active_layer = this.layers[parseInt(e.key) - 1]
    },
  },
}
</script>