<template>
  <teleport to="body" v-if="state">
    <unrest-modal @close="state = null">
      <unrest-form :state="state" :schema="schema" @submit="submit" @cancel="state = null" />
      <template #actions>{{ ' ' }}</template>
    </unrest-modal>
  </teleport>
  <div class="room-canvas__edit btn -mini -primary" @click="edit">
    <i class="fa fa-pencil" />
  </div>
</template>

<script>
export default {
  props: {
    room: Object,
    zones: Array,
  },
  data() {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        to_zone: {
          type: 'number',
          enum: this.zones.map((r) => r.id),
          enumNames: this.zones.map((z) => z.name),
        },
      },
    }
    return { state: null, schema }
  },
  methods: {
    edit() {
      this.state = {
        name: this.room.name,
        to_zone: this.room.data.to_zone,
      }
    },
    submit() {
      this.room.name = this.state.name // eslint-disable-line
      this.room.data.to_zone = this.state.to_zone // eslint-disable-line
      this.$store.room.save(this.room)
      this.state = null
    },
  },
}
</script>
