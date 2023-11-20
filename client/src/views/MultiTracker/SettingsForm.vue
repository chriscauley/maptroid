<template>
  <unrest-form :schema="schema" @submit="submit" onChange="onChange" :state="state" />
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
        },
      }
    },
  },
  methods: {
    onSubmit() {
      console.log(this.state)
    },
    onChange(...args) {
      console.log(args)
    },
  },
}
</script>
