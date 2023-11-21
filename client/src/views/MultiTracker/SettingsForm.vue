<template>
  <div>
    <unrest-form :schema="schema" @submit="onSubmit" :onChange="onChange" :state="state" />
  </div>
</template>

<script>
export default {
  props: {
    controller: Object,
  },
  data() {
    return {
      state: {},
    }
  },
  computed: {
    schema() {
      return {
        type: 'object',
        properties: {
          players: {
            type: 'number',
          },
        },
      }
    },
  },
  methods: {
    onChange(state) {
      this.state = state
    },
  },
}
</script>
