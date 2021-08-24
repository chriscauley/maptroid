<template>
  <form class="selected-room" @submit.prevent="save">
    <input type="text" v-model="room.name" />
    <div>xys: {{ room.xys }}</div>
    <div>
      <select v-model="room.area">
        <option v-for="area in areas" :key="area" :value="area">{{ area }}</option>
      </select>
    </div>
    <button class="btn -primary">Save</button>
    <div v-if="saved">Saved!</div>
  </form>
</template>

<script>
import Area from '@/models/Area'
import Mousetrap from '@unrest/vue-mousetrap'

export default {
  mixins: [Mousetrap.Mixin],
  data() {
    const mousetrap = { esc: () => this.$store.viewer.unSelectRoom() }
    return { saved: null, areas: Area.list, mousetrap }
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
      this.$store.room.save(this.room)
      this.$ui.toast(`Room saved: ${this.room.name}`)
      this.$store.viewer.unSelectRoom()
    },
  },
}
</script>
