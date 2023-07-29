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
export default {
  data() {
    return { open: false }
  },
  computed: {
    schema() {
      return this.$store.tracker.getSchema()
    },
  },
  methods: {
    change(formData) {
      this.$store.tracker.save(formData)
    },
    close() {
      this.open = false
      this.$store.tracker.update()
    },
  },
}
</script>
