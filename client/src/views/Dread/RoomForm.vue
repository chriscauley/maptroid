<template>
  <unrest-modal @close="$emit('close')">
    <unrest-form :schema="schema" :state="state" @submit="save" @cancel="$emit('close')" />
    <template #actions>{{ ' ' }}</template>
  </unrest-modal>
</template>

<script>
import { cloneDeep } from 'lodash'

const bounds_field = {
  type: 'array',
  items: {
    type: 'number',
  },
}

const schema = {
  type: 'object',
  properties: {
    world: { type: 'integer' },
    zone: { type: 'integer' },
    data: {
      type: 'object',
      title: null,
      properties: {
        zone_bounds: bounds_field,
      },
    },
  },
}

export default {
  props: {
    room: Object,
  },
  emits: ['close', 'refetch'],
  data() {
    const state = cloneDeep(this.room)
    return { state, schema }
  },
  methods: {
    save() {
      this.$store.room2.save(this.state).then(() => {
        this.$ui.toast.success(`Room ${this.state.id ? 'saved' : 'created'}`)
        this.$emit('refetch')
        this.$emit('close')
      })
    },
  },
}
</script>
