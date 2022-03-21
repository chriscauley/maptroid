<template>
  <unrest-form :state="state" :schema="schema" @submit="addSprite" />
</template>

<script>
export const schema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
}

export default {
  emits: ['save'],
  data() {
    return { schema, state: {} }
  },
  methods: {
    addSprite() {
      this.$emit('save', this.state)
      this.state = {}
    },
  },
}
</script>
