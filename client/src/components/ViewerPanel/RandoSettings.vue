<template>
  <button class="btn -secondary" @click="open = true">
    <i class="fa fa-gear" />
  </button>
  <teleport to="body">
    <unrest-modal v-if="open" @close="close" class="rando-settings">
      <unrest-form :schema="schema" @change="change" :state="$store.tracker.state" />
    </unrest-modal>
  </teleport>
</template>

<script>
const BASE_SCHEMA = {
  type: 'object',
  properties: {},
}

export default {
  data() {
    return { open: false }
  },
  computed: {
    schema() {
      const schema = this.$store.tracker.getSchema() || BASE_SCHEMA
      if (this.$auth.user) {
        schema.properties.local_dev = { type: 'boolean' }
      }
      return schema
    },
  },
  methods: {
    change({ ...formData }) {
      delete formData.local_dev
      this.$store.tracker.save(formData)
    },
    close() {
      this.open = false
      this.$store.tracker.update()
    },
  },
}
</script>
