<template>
  <form class="selected-room" @submit.prevent="save">
    #{{ room.id }}
    <input type="text" v-model="room.name" />
    <div>xys: {{ room.xys }}</div>
    <div>
      <select v-model="room.zone">
        <option v-for="zone in zones" :key="zone" :value="zone">{{ zone }}</option>
      </select>
    </div>
    <button class="btn -primary">Save</button>
    <div v-if="saved">Saved!</div>
  </form>
</template>

<script>
import Mousetrap from '@unrest/vue-mousetrap'

export default {
  mixins: [Mousetrap.Mixin],
  props: {
    world: Object,
  },
  data() {
    const { zones } = this.world
    const mousetrap = { esc: () => this.$store.viewer.unSelectRoom() }
    return { saved: null, zones: zones, mousetrap }
  },
  computed: {
    room() {
      return this.$store.viewer.getSelectedRoom()
    },
  },
  mounted() {
    this.$el.querySelector('input').focus()
  },
  methods: {
    save() {
      this.room.world_id = this.room.world_id || this.world.id
      this.$store.room.save(this.room)
      this.$ui.toast(`Room saved: ${this.room.name}`)
      this.$store.viewer.unSelectRoom()
    },
  },
}
</script>
