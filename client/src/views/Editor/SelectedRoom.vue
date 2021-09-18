<template>
  <form class="selected-room" @submit.prevent="save">
    #{{ room.id }} - {{ room.zone }}
    <div>
      <input type="text" v-model="room.name" />
      <select v-model="room.elevator">
        <option v-for="elevator in elevators" :value="elevator.id" :key="elevator.id">
          {{ elevator.name || '???' }}
        </option>
      </select>
    </div>
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
    elevators() {
      return this.$store.room.getAll({ world_id: this.world.id, zone: 'elevator' })
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
    setSelectingElevator() {
      this.$store.viewer.patch({ selecting_elevator: true })
    },
  },
}
</script>
